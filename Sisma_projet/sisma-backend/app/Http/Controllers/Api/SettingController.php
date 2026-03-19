<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /** Obtenir tous les paramètres (PUBLIC) */
    public function index()
    {
        // Retourne un objet { key: value } avec valeurs déjà castées (json/boolean/etc)
        $out = [];
        foreach (Setting::all() as $s) {
            $out[$s->key] = $s->value;
        }
        return response()->json($out);
    }
    
    /** Obtenir les paramètres de la landing page (PUBLIC) */
    public function landing()
    {
        // Retourne les paramètres de la landing page groupés par section
        $landingKeys = [
            // Site
            'site_name', 'site_description',
            // Hero
            'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link', 'hero_image',
            // About
            'about_title', 'about_text', 'about_image',
            // Contact
            'contact_phone', 'contact_email', 'contact_address',
            // Social
            'facebook_url', 'instagram_url', 'tiktok_url', 'whatsapp_url', 'youtube_url',
            // Footer
            'footer_text', 'footer_logo',
            // Colors
            'primary_color', 'secondary_color', 'accent_color',
            // Features
            'features_title', 'features_subtitle',
            // CTA
            'cta_title', 'cta_text', 'cta_button_text',
            // SEO
            'seo_title', 'seo_description', 'seo_keywords', 'seo_image',
            // Maintenance
            'maintenance_mode', 'maintenance_message',
        ];
        
        $settings = Setting::whereIn('key', $landingKeys)->get()->keyBy('key');
        
        $result = [];
        foreach ($landingKeys as $key) {
            $result[$key] = $settings[$key]->value ?? null;
        }
        
        // Check maintenance mode
        $maintenanceMode = $settings['maintenance_mode']->value ?? false;
        $result['maintenance_mode'] = filter_var($maintenanceMode, FILTER_VALIDATE_BOOLEAN);
        
        return response()->json([
            'data' => $result,
        ]);
    }

    /** ADMIN: Mettre à jour un paramètre */
    public function update(Request $request)
    {
        try {
            // L'admin envoie du JSON via fetch(). Selon la config serveur, $request->all() peut parfois être vide.
            // On récupère donc d'abord explicitement le JSON (fallback vers all()).
            $payload = $request->json()->all();
            if (!is_array($payload) || empty($payload)) {
                $payload = $request->all();
            }

            // Accepter soit un seul paramètre ({ key, value }), soit plusieurs ({ settings: {...} } ou objet direct)
            if (is_array($payload) && (array_key_exists('key', $payload) || array_key_exists('value', $payload))) {
                // Format: { key: 'xxx', value: ... }
                $validated = Validator::make($payload, [
                    'key' => 'required|string',
                    'value' => 'required',
                ])->validate();

                $key = $validated['key'];
                if (!is_string($key) || trim($key) === '') {
                    return response()->json([
                        'message' => 'Erreur de validation',
                        'errors' => ['key' => ['La clé est obligatoire']],
                    ], 422);
                }

                $setting = Setting::set(trim($key), $validated['value']);
                
                return response()->json([
                    'message' => 'Paramètre mis à jour avec succès',
                    'setting' => $setting,
                ]);
            } else {
                // Format: { settings: { key1: value1, key2: value2 } }
                return $this->updateBulk($request);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => ['key' => [$e->getMessage()]],
            ], 422);
        } catch (\Exception $e) {
            try {
                \Log::error('Erreur mise à jour paramètre: ' . $e->getMessage(), [
                    'content_type' => $request->header('Content-Type'),
                    'accept' => $request->header('Accept'),
                    'origin' => $request->header('Origin'),
                    'raw' => substr((string) $request->getContent(), 0, 2000),
                    'all' => $request->all(),
                    'json' => $request->json()->all(),
                ]);
            } catch (\Exception $_) {
                \Log::error('Erreur mise à jour paramètre (logging failed): ' . $e->getMessage());
            }
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Mettre à jour plusieurs paramètres */
    public function updateBulk(Request $request)
    {
        try {
            // Accepter soit 'settings' soit directement un objet
            $settings = $request->input('settings', $request->all());
            
            if (!is_array($settings) || empty($settings)) {
                return response()->json([
                    'message' => 'Erreur de validation',
                    'errors' => ['settings' => ['Les paramètres doivent être un tableau non vide']]
                ], 422);
            }

            foreach ($settings as $key => $value) {
                if (is_string($key) && trim($key) !== '') {
                    Setting::set($key, $value);
                }
            }

            return response()->json([
                'message' => 'Paramètres mis à jour avec succès',
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur mise à jour paramètres: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }
    
    /** Obtenir un paramètre spécifique */
    public function show($key)
    {
        try {
            $setting = Setting::where('key', $key)->first();
            if (!$setting) {
                // Valeurs par défaut pour éviter les 404 côté frontend
                $defaults = [
                    'social_links' => [
                        'facebook' => '',
                        'instagram' => '',
                        'whatsapp' => '',
                    ],
                    'banner' => [
                        'text' => '',
                        'active' => true,
                        'discount' => 0,
                    ],
                ];

                if (array_key_exists($key, $defaults)) {
                    $setting = Setting::set($key, $defaults[$key]);
                } else {
                    return response()->json([
                        'message' => 'Paramètre non trouvé',
                    ], 404);
                }
            }
            return response()->json([
                'key' => $setting->key,
                'value' => $setting->value,
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur récupération paramètre: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }
}

