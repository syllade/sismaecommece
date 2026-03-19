<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Product Import Analyzer Service
 * 
 * Provides enhanced CSV import:
 * - Validation preview before import
 * - Smart column mapping
 * - Transaction rollback per batch
 * - Structured error reporting
 */
class ProductImportAnalyzerService
{
    private const BATCH_SIZE = 50;
    private const REQUIRED_COLUMNS = ['name', 'price'];
    private const OPTIONAL_COLUMNS = ['sku', 'description', 'category', 'stock', 'discount'];

    /**
     * Analyze and preview CSV file before import
     * 
     * @param string $filePath
     * @return array [valid => bool, columns => [], preview => [], errors => [], warnings => []]
     */
    public function analyze(string $filePath): array
    {
        try {
            $handle = fopen($filePath, 'r');
            if (!$handle) {
                return ['valid' => false, 'error' => 'Cannot open file'];
            }

            $header = fgetcsv($handle, 1000, ',');
            $header = array_map('strtolower', array_map('trim', $header));

            // Validate required columns
            $missingColumns = array_diff(self::REQUIRED_COLUMNS, $header);
            if (!empty($missingColumns)) {
                fclose($handle);
                return [
                    'valid' => false,
                    'error' => 'Colonnes manquantes: ' . implode(', ', $missingColumns),
                ];
            }

            // Smart column mapping
            $columnMapping = $this->mapColumns($header);

            // Preview first 10 rows
            $preview = [];
            $rowNumber = 1;
            $errors = [];
            $warnings = [];

            while (($row = fgetcsv($handle, 1000, ',')) !== false && $rowNumber <= 10) {
                $rowData = array_combine($header, $row);
                $rowValidation = $this->validateRow($rowData, $columnMapping, $rowNumber);
                
                if (!empty($rowValidation['errors'])) {
                    $errors = array_merge($errors, $rowValidation['errors']);
                }
                if (!empty($rowValidation['warnings'])) {
                    $warnings = array_merge($warnings, $rowValidation['warnings']);
                }

                $preview[] = [
                    'row' => $rowNumber,
                    'data' => $rowValidation['mapped_data'],
                    'has_errors' => !empty($rowValidation['errors']),
                ];
                $rowNumber++;
            }

            fclose($handle);

            // Count total rows
            $handle = fopen($filePath, 'r');
            $totalRows = 0;
            while (fgetcsv($handle, 1000, ',') !== false) {
                $totalRows++;
            }
            fclose($handle);
            $totalRows--; // Exclude header

            return [
                'valid' => empty($errors),
                'total_rows' => $totalRows,
                'columns' => $header,
                'column_mapping' => $columnMapping,
                'preview' => $preview,
                'errors' => array_slice($errors, 0, 20), // Limit errors shown
                'warnings' => array_slice($warnings, 0, 20),
                'can_proceed' => count($errors) < ($totalRows * 0.1), // Allow if < 10% errors
            ];

        } catch (\Exception $e) {
            Log::error('ProductImportAnalyzer: Analysis failed', ['error' => $e->getMessage()]);
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Process import with transaction rollback per batch
     * 
     * @param string $filePath
     * @param int $supplierId
     * @param callable|null $progressCallback
     * @return array [imported => int, failed => int, errors => []]
     */
    public function import(string $filePath, int $supplierId, ?callable $progressCallback = null): array
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            return ['imported' => 0, 'failed' => 0, 'errors' => ['Cannot open file']];
        }

        $header = fgetcsv($handle, 1000, ',');
        $header = array_map('strtolower', array_map('trim', $header));
        $columnMapping = $this->mapColumns($header);

        $imported = 0;
        $failed = 0;
        $errors = [];
        $batch = [];
        $rowNumber = 1;

        // Get supplier info
        $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
        $needsApproval = !$supplier || !$supplier->is_approved;
        $commissionRate = $supplier->commission_rate ?? 0;

        while (($row = fgetcsv($handle, 1000, ',')) !== false) {
            $rowNumber++;
            $rowData = array_combine($header, $row);
            
            try {
                $mappedData = $this->mapRowData($rowData, $columnMapping, $supplierId, $commissionRate, $needsApproval);
                $batch[] = $mappedData;

                // Process batch
                if (count($batch) >= self::BATCH_SIZE) {
                    $batchResult = $this->processBatch($batch, $supplierId);
                    $imported += $batchResult['imported'];
                    $failed += $batchResult['failed'];
                    $errors = array_merge($errors, $batchResult['errors']);
                    $batch = [];

                    if ($progressCallback) {
                        $progressCallback($rowNumber);
                    }
                }
            } catch (\Exception $e) {
                $failed++;
                $errors[] = "Row {$rowNumber}: " . $e->getMessage();
            }
        }

        // Process remaining batch
        if (!empty($batch)) {
            $batchResult = $this->processBatch($batch, $supplierId);
            $imported += $batchResult['imported'];
            $failed += $batchResult['failed'];
            $errors = array_merge($errors, $batchResult['errors']);
        }

        fclose($handle);

        // Log activity
        DB::table('supplier_activity_logs')->insert([
            'supplier_id' => $supplierId,
            'action' => 'bulk_import',
            'metadata' => json_encode([
                'imported' => $imported,
                'failed' => $failed,
                'total_rows' => $rowNumber - 1,
            ]),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return [
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors,
            'success_rate' => ($imported + $failed) > 0 
                ? round(($imported / ($imported + $failed)) * 100, 1) 
                : 0,
        ];
    }

    /**
     * Smart column mapping
     */
    private function mapColumns(array $header): array
    {
        $mapping = [];
        $possibleMappings = [
            'name' => ['name', 'nom', 'product_name', 'produit', 'title'],
            'price' => ['price', 'prix', 'tarif'],
            'description' => ['description', 'desc', 'details'],
            'category' => ['category', 'categorie', 'cat'],
            'stock' => ['stock', 'quantity', 'qte', 'quantite'],
            'discount' => ['discount', 'reduction', 'remise'],
            'sku' => ['sku', 'reference', 'ref'],
        ];

        foreach ($possibleMappings as $field => $possibleNames) {
            foreach ($possibleNames as $possibleName) {
                $index = array_search($possibleName, $header);
                if ($index !== false) {
                    $mapping[$field] = $header[$index];
                    break;
                }
            }
        }

        return $mapping;
    }

    /**
     * Validate single row
     */
    private function validateRow(array $rowData, array $columnMapping, int $rowNumber): array
    {
        $errors = [];
        $warnings = [];
        $mappedData = [];

        // Check required fields
        foreach (self::REQUIRED_COLUMNS as $required) {
            if (!isset($columnMapping[$required])) {
                $errors[] = "Row {$rowNumber}: Missing column '{$required}'";
                continue;
            }

            $value = $rowData[$columnMapping[$required]] ?? null;
            if (empty($value)) {
                $errors[] = "Row {$rowNumber}: '{$required}' is required";
            }
        }

        // Validate price
        if (isset($rowData[$columnMapping['price'] ?? ''])) {
            $price = str_replace([',', ' '], ['.', ''], $rowData[$columnMapping['price']]);
            if (!is_numeric($price)) {
                $errors[] = "Row {$rowNumber}: Invalid price";
            }
        }

        // Validate stock
        if (isset($rowData[$columnMapping['stock'] ?? ''])) {
            $stock = $rowData[$columnMapping['stock']];
            if (!is_numeric($stock) || $stock < 0) {
                $warnings[] = "Row {$rowNumber}: Invalid stock value";
            }
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'mapped_data' => $mappedData,
        ];
    }

    /**
     * Map row data to database format
     */
    private function mapRowData(array $rowData, array $columnMapping, int $supplierId, float $commissionRate, bool $needsApproval): array
    {
        $name = $rowData[$columnMapping['name']] ?? '';
        $price = isset($columnMapping['price']) 
            ? (float) str_replace([',', ' '], ['.', ''], $rowData[$columnMapping['price']]) 
            : 0;

        // Get category ID if provided
        $categoryId = null;
        if (isset($columnMapping['category'])) {
            $categoryName = $rowData[$columnMapping['category']] ?? '';
            if ($categoryName) {
                $category = DB::table('categories')
                    ->where('name', 'like', '%' . $categoryName . '%')
                    ->first();
                $categoryId = $category ? $category->id : null;
            }
        }

        return [
            'supplier_id' => $supplierId,
            'category_id' => $categoryId,
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $rowData[$columnMapping['description'] ?? ''] ?? '',
            'price' => $price,
            'stock' => (int) ($rowData[$columnMapping['stock'] ?? ''] ?? 0),
            'discount' => (int) ($rowData[$columnMapping['discount'] ?? ''] ?? 0),
            'sku' => $rowData[$columnMapping['sku'] ?? ''] ?? 'SKU-' . $supplierId . '-' . Str::upper(Str::random(6)),
            'commission_rate' => $commissionRate,
            'is_active' => $needsApproval ? 0 : 1,
            'status' => $needsApproval ? 'pending' : 'active',
            'views' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Process batch with transaction
     */
    private function processBatch(array $batch, int $supplierId): array
    {
        $imported = 0;
        $failed = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($batch as $productData) {
                // Check for duplicate SKU
                if (!empty($productData['sku'])) {
                    $existing = DB::table('products')
                        ->where('sku', $productData['sku'])
                        ->where('supplier_id', $supplierId)
                        ->first();

                    if ($existing) {
                        // Update existing
                        DB::table('products')
                            ->where('id', $existing->id)
                            ->update($productData);
                    } else {
                        DB::table('products')->insert($productData);
                    }
                } else {
                    DB::table('products')->insert($productData);
                }
                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $failed = count($batch);
            $errors[] = 'Batch failed: ' . $e->getMessage();
            Log::error('ProductImportAnalyzer: Batch failed', [
                'supplier_id' => $supplierId,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors,
        ];
    }
}
