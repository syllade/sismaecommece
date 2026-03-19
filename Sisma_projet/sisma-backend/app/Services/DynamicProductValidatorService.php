<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Dynamic Product Validator Service
 * 
 * Validates products based on category fields defined in the database.
 * - Loads dynamic fields per category
 * - Validates required fields
 * - Rejects unauthorized fields
 * - Sanitizes HTML inputs
 */
class DynamicProductValidatorService
{
    /**
     * Validate product data based on category fields
     * 
     * @param int $categoryId
     * @param array $data
     * @param int|null $productId (for updates)
     * @return array ['valid' => bool, 'errors' => array, 'validated_data' => array]
     */
    public function validate(int $categoryId, array $data, ?int $productId = null): array
    {
        $errors = [];
        $validatedData = [];

        // Get category fields
        $categoryFields = $this->getCategoryFields($categoryId);

        if (empty($categoryFields)) {
            return ['valid' => true, 'errors' => [], 'validated_data' => $data];
        }

        // Check for unauthorized fields
        $allowedFieldSlugs = array_column($categoryFields, 'slug');
        $allowedFieldSlugs[] = 'name';
        $allowedFieldSlugs[] = 'description';
        $allowedFieldSlugs[] = 'price';
        $allowedFieldSlugs[] = 'stock';
        $allowedFieldSlugs[] = 'sku';
        $allowedFieldSlugs[] = 'images';
        $allowedFieldSlugs[] = 'colors';
        $allowedFieldSlugs[] = 'sizes';

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowedFieldSlugs)) {
                $errors[$key][] = "Le champ '$key' n'est pas autorisé pour cette catégorie";
            }
        }

        // Validate each category field
        foreach ($categoryFields as $field) {
            $fieldSlug = $field['slug'];
            $value = $data[$fieldSlug] ?? null;

            // Check required
            if ($field['is_required'] && empty($value)) {
                $errors[$fieldSlug][] = "Le champ '{$field['name']}' est obligatoire";
                continue;
            }

            // Skip validation if empty and not required
            if (empty($value)) {
                continue;
            }

            // Validate based on field type
            $fieldError = $this->validateField($field, $value);
            if ($fieldError) {
                $errors[$fieldSlug][] = $fieldError;
            }

            // Sanitize based on type
            $validatedData[$fieldSlug] = $this->sanitizeValue($field, $value);
        }

        // Add standard fields to validated data
        $standardFields = ['name', 'description', 'price', 'stock', 'sku', 'images', 'colors', 'sizes'];
        foreach ($standardFields as $field) {
            if (isset($data[$field])) {
                $validatedData[$field] = $field === 'description' 
                    ? $this->sanitizeHtml($data[$field]) 
                    : $data[$field];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'validated_data' => $validatedData,
        ];
    }

    /**
     * Get category fields from database
     */
    private function getCategoryFields(int $categoryId): array
    {
        try {
            $fields = DB::table('category_fields')
                ->where('category_id', $categoryId)
                ->where('is_active', 1)
                ->orderBy('position')
                ->get();

            return $fields->map(function ($field) {
                return [
                    'id' => $field->id,
                    'slug' => $field->slug,
                    'name' => $field->name,
                    'type' => $field->type,
                    'options' => $field->options ? json_decode($field->options, true) : [],
                    'is_required' => (bool) $field->is_required,
                    'is_filterable' => (bool) $field->is_filterable,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('DynamicProductValidatorService: Failed to get category fields', [
                'category_id' => $categoryId,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Validate field based on type
     */
    private function validateField(array $field, $value): ?string
    {
        $type = $field['type'];
        $name = $field['name'];

        switch ($type) {
            case 'text':
                if (!is_string($value) || strlen($value) > 1000) {
                    return "Le champ '$name' doit être un texte de moins de 1000 caractères";
                }
                break;

            case 'number':
                if (!is_numeric($value)) {
                    return "Le champ '$name' doit être un nombre";
                }
                break;

            case 'select':
                $options = $field['options'] ?? [];
                if (!empty($options) && !in_array($value, array_column($options, 'value'))) {
                    return "La valeur '$value' n'est pas valide pour le champ '$name'";
                }
                break;

            case 'multi_select':
                if (!is_array($value)) {
                    return "Le champ '$name' doit être un tableau";
                }
                break;

            case 'boolean':
                if (!is_bool($value) && !in_array($value, ['0', '1', 'true', 'false'])) {
                    return "Le champ '$name' doit être un booléen";
                }
                break;

            case 'file':
                // File validation would be handled separately
                break;
        }

        return null;
    }

    /**
     * Sanitize value based on type
     */
    private function sanitizeValue(array $field, $value)
    {
        $type = $field['type'];

        switch ($type) {
            case 'text':
                return strip_tags($value);

            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);

            case 'number':
                return is_numeric($value) ? (float) $value : $value;

            default:
                return $value;
        }
    }

    /**
     * Sanitize HTML content
     */
    private function sanitizeHtml(string $html): string
    {
        // Allow safe HTML tags
        $allowedTags = '<p><br><strong><b><em><i><u><a><ul><ol><li><h1><h2><h3><h4><h5><h6>';
        
        // Strip dangerous tags but keep formatting
        $cleaned = strip_tags($html, $allowedTags);
        
        // Remove event handlers and javascript: URLs
        $cleaned = preg_replace('/\s+on\w+\s*=/i', ' data-removed=', $cleaned);
        $cleaned = preg_replace('/javascript:/i', 'removed:', $cleaned);
        
        return trim($cleaned);
    }

    /**
     * Get available fields for a category (for API response)
     */
    public function getFieldsForCategory(int $categoryId): array
    {
        return $this->getCategoryFields($categoryId);
    }

    /**
     * Get all categories with their fields (for building dynamic forms)
     */
    public function getCategoriesWithFields(): array
    {
        try {
            $categories = DB::table('categories')
                ->where('is_active', 1)
                ->orderBy('name')
                ->get();

            return $categories->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'fields' => $this->getCategoryFields($category->id),
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('DynamicProductValidatorService: Failed to get categories', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
}
