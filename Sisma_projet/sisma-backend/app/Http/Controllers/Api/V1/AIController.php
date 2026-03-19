<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AI Controller - Product Description Generator
 * 
 * Uses AI to generate product descriptions for suppliers
 * Logs usage for future billing
 */
class AIController extends Controller
{
    /**
     * Generate AI product description
     * POST /api/v1/supplier/ai/generate-description
     */
    public function generateDescription(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'product_name' => 'required|string|max:255',
                'keywords' => 'nullable|array',
                'keywords.*' => 'string',
                'tone' => 'nullable|string|in:professional,friendly,formal,casual,persuasive',
                'length' => 'nullable|string|in:short,medium,long',
                'language' => 'nullable|string|in:fr,en',
                'category' => 'nullable|string',
                'features' => 'nullable|array',
                'features.*' => 'string',
            ]);

            // Get AI settings from config
            $aiProvider = config('services.ai.provider', 'openai');
            $aiModel = config('services.ai.model', 'gpt-3.5-turbo');
            $aiApiKey = config('services.ai.api_key');

            // Validate API key exists
            if (empty($aiApiKey)) {
                Log::warning('AI service not configured - using fallback generation');
                return $this->fallbackGenerate($request);
            }

            // Build prompt
            $productName = $request->product_name;
            $keywords = $request->keywords ?? [];
            $tone = $request->tone ?? 'professional';
            $length = $request->length ?? 'medium';
            $language = $request->language ?? 'fr';
            $category = $request->category ?? '';
            $features = $request->features ?? [];

            $lengthMap = [
                'short' => $language === 'fr' ? '100-150 mots' : '100-150 words',
                'medium' => $language === 'fr' ? '200-300 mots' : '200-300 words',
                'long' => $language === 'fr' ? '400-500 mots' : '400-500 words',
            ];

            $toneInstructions = [
                'professional' => $language === 'fr' ? 'Utilisez un ton professionnel et formel' : 'Use a professional and formal tone',
                'friendly' => $language === 'fr' ? 'Utilisez un ton amical et décontracté' : 'Use a friendly and casual tone',
                'formal' => $language === 'fr' ? 'Utilisez un ton très formel et élégant' : 'Use a very formal and elegant tone',
                'casual' => $language === 'fr' ? 'Utilisez un ton décontracté et moderne' : 'Use a casual and modern tone',
                'persuasive' => $language === 'fr' ? 'Utilisez un ton persuasif et commercial' : 'Use a persuasive and commercial tone',
            ];

            $prompt = $language === 'fr' 
                ? "Générez une description de produit attrayante pour \"{$productName}\"." 
                : "Generate an attractive product description for \"{$productName}\".";

            if ($category) {
                $prompt .= $language === 'fr' 
                    ? " C'est un produit de catégorie {$category}." 
                    : " This is a {$category} product.";
            }

            if (!empty($features)) {
                $featuresList = implode(', ', $features);
                $prompt .= $language === 'fr' 
                    ? " Caractéristiques principales: {$featuresList}." 
                    : " Main features: {$featuresList}.";
            }

            if (!empty($keywords)) {
                $keywordsList = implode(', ', $keywords);
                $prompt .= $language === 'fr' 
                    ? " Mots-clés à intégrer: {$keywordsList}." 
                    : " Keywords to integrate: {$keywordsList}.";
            }

            $prompt .= $language === 'fr'
                ? " Longueur: {$lengthMap[$length]}. {$toneInstructions[$tone]}. Rédigez en {$language}."
                : " Length: {$lengthMap[$length]}. {$toneInstructions[$tone]}. Write in {$language}.";

            // Call AI API (placeholder - would need actual API integration)
            $description = $this->callAI($prompt, $aiProvider, $aiModel, $aiApiKey, $language);

            // Log AI usage for billing
            $this->logAIUsage($supplierId, 'generate_description', [
                'product_name' => $productName,
                'tone' => $tone,
                'length' => $length,
                'language' => $language,
            ]);

            return response()->json([
                'description' => $description,
                'metadata' => [
                    'product_name' => $productName,
                    'tone' => $tone,
                    'length' => $length,
                    'language' => $language,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AIController@generateDescription error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la génération de la description'], 500);
        }
    }

    /**
     * Generate multiple descriptions/variations
     * POST /api/v1/supplier/ai/generate-variations
     */
    public function generateVariations(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'product_name' => 'required|string|max:255',
                'count' => 'nullable|integer|min:2|max:5',
                'language' => 'nullable|string|in:fr,en',
            ]);

            $count = $request->count ?? 3;
            $language = $request->language ?? 'fr';
            $productName = $request->product_name;

            $variations = [];
            $tones = ['professional', 'friendly', 'persuasive'];

            for ($i = 0; $i < $count; $i++) {
                $tone = $tones[$i % count($tones)];
                $variation = $this->fallbackGenerateWithTone($productName, $tone, $language);
                $variations[] = [
                    'tone' => $tone,
                    'description' => $variation,
                ];
            }

            // Log AI usage
            $this->logAIUsage($supplierId, 'generate_variations', [
                'product_name' => $productName,
                'count' => $count,
                'language' => $language,
            ]);

            return response()->json([
                'variations' => $variations,
                'metadata' => [
                    'product_name' => $productName,
                    'count' => $count,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AIController@generateVariations error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la génération des variations'], 500);
        }
    }

    /**
     * Translate product description
     * POST /api/v1/supplier/ai/translate
     */
    public function translate(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'text' => 'required|string',
                'target_language' => 'required|string|in:fr,en',
                'source_language' => 'nullable|string|in:fr,en,auto',
            ]);

            $text = $request->text;
            $targetLanguage = $request->target_language;
            $sourceLanguage = $request->source_language ?? 'auto';

            // Log AI usage
            $this->logAIUsage($supplierId, 'translate', [
                'source_language' => $sourceLanguage,
                'target_language' => $targetLanguage,
                'text_length' => strlen($text),
            ]);

            // Simple fallback translation (would integrate with AI in production)
            $translatedText = $this->simpleTranslate($text, $sourceLanguage, $targetLanguage);

            return response()->json([
                'original_text' => $text,
                'translated_text' => $translatedText,
                'source_language' => $sourceLanguage,
                'target_language' => $targetLanguage,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AIController@translate error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la traduction'], 500);
        }
    }

    /**
     * Improve existing description
     * POST /api/v1/supplier/ai/improve
     */
    public function improveDescription(Request $request)
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'description' => 'required|string',
                'improvement_type' => 'nullable|string|in:seo,engagement,clarity,length',
                'language' => 'nullable|string|in:fr,en',
            ]);

            $description = $request->description;
            $improvementType = $request->improvement_type ?? 'engagement';
            $language = $request->language ?? 'fr';

            // Log AI usage
            $this->logAIUsage($supplierId, 'improve_description', [
                'improvement_type' => $improvementType,
                'original_length' => strlen($description),
            ]);

            // Simple improvement (would integrate with AI in production)
            $improved = $this->simpleImprove($description, $improvementType, $language);

            return response()->json([
                'original_description' => $description,
                'improved_description' => $improved,
                'improvement_type' => $improvementType,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AIController@improveDescription error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'amélioration'], 500);
        }
    }

    /**
     * Call AI API (placeholder)
     */
    private function callAI($prompt, $provider, $model, $apiKey, $language)
    {
        // This is a placeholder - in production, you would integrate with OpenAI, Anthropic, etc.
        // For now, return a fallback generation
        
        Log::info('AI API call (simulated)', [
            'provider' => $provider,
            'model' => $model,
            'prompt_length' => strlen($prompt),
        ]);

        return $this->fallbackGenerateFromPrompt($prompt, $language);
    }

    /**
     * Fallback generation when AI is not configured
     */
    private function fallbackGenerate(Request $request)
    {
        $productName = $request->product_name;
        $keywords = $request->keywords ?? [];
        $tone = $request->tone ?? 'professional';
        $length = $request->length ?? 'medium';
        $language = $request->language ?? 'fr';

        return $this->fallbackGenerateWithTone($productName, $tone, $language);
    }

    /**
     * Fallback generation with tone
     */
    private function fallbackGenerateWithTone($productName, $tone, $language)
    {
        if ($language === 'fr') {
            $templates = [
                'professional' => "Découvrez {$productName}, un produit de qualité supérieure conçu pour répondre à vos besoins les plus exigeants. Doté d'une fabrication irréprochable et d'un design moderne, ce produit allie performance et esthétique. Ideal pour les professionnels et les particuliers exigeants.",
                'friendly' => "Salut ! Tu vas adorer {$productName} ! C'est le produit parfait qui combine qualité et fun. Facile à utiliser et super pratique, il deviendra vite indispensable dans ton quotidien. Ne tarde plus pour te faire plaisir !",
                'persuasive' => "{$productName} - La solution qu'il vous faut ! Ne compromettez plus sur la qualité. Achetez maintenant et profitez d'un rapport qualité-prix imbattable. Stock limité - Agissez vite !",
            ];
        } else {
            $templates = [
                'professional' => "Discover {$productName}, a superior quality product designed to meet your most demanding needs. With impeccable manufacturing and modern design, this product combines performance and aesthetics. Ideal for demanding professionals and individuals.",
                'friendly' => "Hey! You're going to love {$productName}! It's the perfect product that combines quality and fun. Easy to use and super practical, it will quickly become essential in your daily life. Don't wait to treat yourself!",
                'persuasive' => "{$productName} - The solution you need! Don't compromise on quality anymore. Buy now and enjoy an unbeatable value proposition. Limited stock - Act fast!",
            ];
        }

        return $templates[$tone] ?? $templates['professional'];
    }

    /**
     * Fallback from AI prompt
     */
    private function fallbackGenerateFromPrompt($prompt, $language)
    {
        // Extract key information from prompt
        if ($language === 'fr') {
            return "Description générée pour votre produit. Cette description met en avant les caractéristiques principales et les avantages de votre produit. Elle est optimisée pour convertir vos visiteurs en acheteurs.";
        } else {
            return "Generated description for your product. This description highlights the main features and benefits of your product. It is optimized to convert your visitors into buyers.";
        }
    }

    /**
     * Simple translation (placeholder)
     */
    private function simpleTranslate($text, $source, $target)
    {
        // This is a placeholder - in production, use Google Translate API, DeepL, etc.
        return $text . ' [' . $target . ']';
    }

    /**
     * Simple improvement (placeholder)
     */
    private function simpleImprove($description, $type, $language)
    {
        // This is a placeholder - in production, use AI
        if ($type === 'seo') {
            if ($language === 'fr') {
                return $description . "\n\nMots-clés: produit, qualité, achat, commander";
            } else {
                return $description . "\n\nKeywords: product, quality, buy, order";
            }
        }
        return $description;
    }

    /**
     * Log AI usage for billing
     */
    private function logAIUsage($supplierId, $action, $metadata)
    {
        try {
            DB::table('ai_usage_logs')->insert([
                'supplier_id' => $supplierId,
                'action' => $action,
                'metadata' => json_encode($metadata),
                'tokens_used' => 0, // Would be calculated in production
                'created_at' => now(),
            ]);

            Log::info('AI usage logged for billing', [
                'supplier_id' => $supplierId,
                'action' => $action,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log AI usage: ' . $e->getMessage());
        }
    }

    /**
     * Get AI usage stats
     * GET /api/v1/supplier/ai/stats
     */
    public function stats()
    {
        try {
            $supplierId = $this->getSupplierId();
            if (!$supplierId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $stats = DB::table('ai_usage_logs')
                ->where('supplier_id', $supplierId)
                ->select(
                    DB::raw('action'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(tokens_used) as total_tokens')
                )
                ->groupBy('action')
                ->get();

            $totalUsage = DB::table('ai_usage_logs')
                ->where('supplier_id', $supplierId)
                ->count();

            return response()->json([
                'total_usage' => $totalUsage,
                'by_action' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('AIController@stats error: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    /**
     * Get supplier ID from authenticated user
     */
    private function getSupplierId()
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        if (isset($user->supplier_id) && $user->supplier_id) {
            return (int) $user->supplier_id;
        }

        if ($user->role === 'supplier') {
            $supplier = DB::table('suppliers')->where('user_id', $user->id)->first();
            return $supplier ? $supplier->id : null;
        }

        return null;
    }
}
