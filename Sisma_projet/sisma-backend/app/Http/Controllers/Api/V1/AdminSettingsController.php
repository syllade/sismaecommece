<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin Settings Controller V1
 * 
 * API Version 1 - Paramètres globaux
 * Commissions, catégories, zones livraison, notifications
 */
class AdminSettingsController extends Controller
{
    // ========== COMMISSIONS ==========

    /**
     * GET /api/v1/admin/settings/commissions
     * 
     * Liste des commissions (globale et par fournisseur)
     */
    public function commissions()
    {
        try {
            // Commission globale
            $globalCommission = DB::table('settings')
                ->where('key', 'global_commission_rate')
                ->first();

            // Commissions par fournisseur
            $supplierCommissions = DB::table('supplier_commissions')
                ->join('suppliers', 'supplier_commissions.supplier_id', '=', 'suppliers.id')
                ->select('supplier_commissions.*', 'suppliers.name as supplier_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'global_commission' => (float) ($globalCommission->value ?? 10),
                    'supplier_commissions' => $supplierCommissions,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commissions',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/commissions/global
     * 
     * Modifier la commission globale
     */
    public function updateGlobalCommission(Request $request)
    {
        try {
            $request->validate([
                'rate' => 'required|numeric|min:0|max:100',
            ]);

            DB::table('settings')
                ->updateOrInsert(
                    ['key' => 'global_commission_rate'],
                    ['value' => $request->rate, 'updated_at' => now()]
                );

            return response()->json([
                'success' => true,
                'message' => 'Commission globale mise à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/commissions/supplier
     * 
     * Modifier la commission d'un fournisseur
     */
    public function updateSupplierCommission(Request $request)
    {
        try {
            $request->validate([
                'supplier_id' => 'required|integer',
                'rate' => 'required|numeric|min:0|max:100',
            ]);

            DB::table('supplier_commissions')
                ->updateOrInsert(
                    ['supplier_id' => $request->supplier_id],
                    ['rate' => $request->rate, 'updated_at' => now()]
                );

            return response()->json([
                'success' => true,
                'message' => 'Commission fournisseur mise à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    // ========== CATÉGORIES ==========

    /**
     * GET /api/v1/admin/settings/categories
     * 
     * Liste des catégories avec configuration de champs
     */
    public function categories()
    {
        try {
            $categories = DB::table('categories')
                ->selectRaw('*, (SELECT COUNT(*) FROM products WHERE products.category_id = categories.id) as products_count')
                ->orderBy('order', 'asc')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/settings/categories
     * 
     * Créer une catégorie
     */
    public function createCategory(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:categories',
                'slug' => 'sometimes|string|max:255|unique:categories',
                'fields_config' => 'sometimes|json',
            ]);

            $slug = $request->slug ?? str_slug($request->name);
            $maxOrder = DB::table('categories')->max('order') ?? 0;

            $id = DB::table('categories')->insertGetId([
                'name' => $request->name,
                'slug' => $slug,
                'fields_config' => $request->fields_config ?? json_encode([]),
                'order' => $maxOrder + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie créée',
                'data' => ['id' => $id],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/categories/{id}
     * 
     * Modifier une catégorie
     */
    public function updateCategory(Request $request, $id)
    {
        try {
            $data = ['updated_at' => now()];

            if ($request->has('name')) {
                $data['name'] = $request->name;
            }
            if ($request->has('slug')) {
                $data['slug'] = $request->slug;
            }
            if ($request->has('fields_config')) {
                $data['fields_config'] = $request->fields_config;
            }
            if ($request->has('order')) {
                $data['order'] = $request->order;
            }

            DB::table('categories')->where('id', $id)->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie mise à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/settings/categories/{id}
     * 
     * Supprimer une catégorie
     */
    public function deleteCategory($id)
    {
        try {
            // Vérifier si des produits utilisent cette catégorie
            $productsCount = DB::table('products')->where('category_id', $id)->count();

            if ($productsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer une catégorie avec des produits',
                ], 422);
            }

            DB::table('categories')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Catégorie supprimée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/categories/reorder
     * 
     * Réordonner les catégories
     */
    public function reorderCategories(Request $request)
    {
        try {
            $request->validate([
                'categories' => 'required|array',
            ]);

            foreach ($request->categories as $category) {
                DB::table('categories')
                    ->where('id', $category['id'])
                    ->update(['order' => $category['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Catégories réordonnées',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du réordonnancement',
            ], 500);
        }
    }

    // ========== ZONES DE LIVRAISON ==========

    /**
     * GET /api/v1/admin/settings/delivery-zones
     * 
     * Liste des zones de livraison
     */
    public function deliveryZones()
    {
        try {
            $zones = DB::table('delivery_zones')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $zones,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des zones',
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/settings/delivery-zones
     * 
     * Créer une zone de livraison
     */
    public function createDeliveryZone(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:delivery_zones',
                'price' => 'required|numeric|min:0',
                'estimated_time' => 'sometimes|string|max:100',
            ]);

            $id = DB::table('delivery_zones')->insertGetId([
                'name' => $request->name,
                'price' => $request->price,
                'estimated_time' => $request->estimated_time ?? '',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Zone créée',
                'data' => ['id' => $id],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/delivery-zones/{id}
     * 
     * Modifier une zone de livraison
     */
    public function updateDeliveryZone(Request $request, $id)
    {
        try {
            $data = ['updated_at' => now()];

            if ($request->has('name')) {
                $data['name'] = $request->name;
            }
            if ($request->has('price')) {
                $data['price'] = $request->price;
            }
            if ($request->has('estimated_time')) {
                $data['estimated_time'] = $request->estimated_time;
            }

            DB::table('delivery_zones')->where('id', $id)->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Zone mise à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/settings/delivery-zones/{id}
     * 
     * Supprimer une zone de livraison
     */
    public function deleteDeliveryZone($id)
    {
        try {
            DB::table('delivery_zones')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Zone supprimée',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    // ========== NOTIFICATIONS ==========

    /**
     * GET /api/v1/admin/settings/notifications
     * 
     * Liste des templates de notifications
     */
    public function notificationTemplates()
    {
        try {
            $templates = DB::table('notification_templates')
                ->orderBy('type', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/notifications/{id}
     * 
     * Modifier un template de notification
     */
    public function updateNotificationTemplate(Request $request, $id)
    {
        try {
            $data = ['updated_at' => now()];

            if ($request->has('subject')) {
                $data['subject'] = $request->subject;
            }
            if ($request->has('body')) {
                $data['body'] = $request->body;
            }
            if ($request->has('is_active')) {
                $data['is_active'] = $request->is_active ? 1 : 0;
            }

            DB::table('notification_templates')->where('id', $id)->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Template mis à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    // ========== PARAMÈTRES GLOBAUX ==========

    /**
     * GET /api/v1/admin/settings
     * 
     * Tous les paramètres globaux
     */
    public function index()
    {
        try {
            $settings = DB::table('settings')->get()->keyBy('key');

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings
     * 
     * Mettre à jour les paramètres
     */
    public function update(Request $request)
    {
        try {
            foreach ($request->all() as $key => $value) {
                DB::table('settings')
                    ->updateOrInsert(
                        ['key' => $key],
                        ['value' => $value, 'updated_at' => now()]
                    );
            }

            return response()->json([
                'success' => true,
                'message' => 'Paramètres mis à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    // ========== LANDING PAGE ==========

    /**
     * GET /api/v1/admin/settings/landing
     * 
     * Obtenir les paramètres de la landing page
     */
    public function landingSettings()
    {
        try {
            $landingKeys = [
                'site_name', 'site_description',
                'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link', 'hero_image',
                'about_title', 'about_text', 'about_image',
                'contact_phone', 'contact_email', 'contact_address',
                'facebook_url', 'instagram_url', 'tiktok_url', 'whatsapp_url', 'youtube_url',
                'footer_text', 'footer_logo',
                'primary_color', 'secondary_color', 'accent_color',
                'features_title', 'features_subtitle',
                'cta_title', 'cta_text', 'cta_button_text',
                'seo_title', 'seo_description', 'seo_keywords', 'seo_image',
                'maintenance_mode', 'maintenance_message',
            ];
            
            $settings = DB::table('settings')
                ->whereIn('key', $landingKeys)
                ->get()
                ->keyBy('key');
            
            $result = [];
            foreach ($landingKeys as $key) {
                $result[$key] = $settings[$key]->value ?? '';
            }
            
            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
            ], 500);
        }
    }

    /**
     * PUT /api/v1/admin/settings/landing
     * 
     * Mettre à jour les paramètres de la landing page
     */
    public function updateLandingSettings(Request $request)
    {
        try {
            $landingKeys = [
                'site_name', 'site_description',
                'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link', 'hero_image',
                'about_title', 'about_text', 'about_image',
                'contact_phone', 'contact_email', 'contact_address',
                'facebook_url', 'instagram_url', 'tiktok_url', 'whatsapp_url', 'youtube_url',
                'footer_text', 'footer_logo',
                'primary_color', 'secondary_color', 'accent_color',
                'features_title', 'features_subtitle',
                'cta_title', 'cta_text', 'cta_button_text',
                'seo_title', 'seo_description', 'seo_keywords', 'seo_image',
                'maintenance_mode', 'maintenance_message',
            ];
            
            foreach ($landingKeys as $key) {
                if ($request->has($key)) {
                    DB::table('settings')
                        ->updateOrInsert(
                            ['key' => $key],
                            [
                                'value' => $request->input($key),
                                'updated_at' => now()
                            ]
                        );
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Paramètres landing page mis à jour',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
            ], 500);
        }
    }

    // ========== CATEGORY ATTRIBUTES ==========

    /**
     * GET /api/v1/admin/settings/categories/{id}/attributes
     * 
     * Obtenir les attributs d'une catégorie
     */
    public function categoryAttributes($id)
    {
        try {
            $attributes = DB::table('category_attributes')
                ->where('category_id', $id)
                ->orderBy('sort_order', 'asc')
                ->get();

            // Transform options JSON string to array
            $attributes = $attributes->map(function ($attr) {
                $attr->options = $attr->options ? json_decode($attr->options) : [];
                $attr->validation = $attr->validation ? json_decode($attr->validation) : null;
                return $attr;
            });

            return response()->json([
                'success' => true,
                'data' => $attributes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des attributs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/settings/categories/all/attributes
     * 
     * Obtenir tous les attributs de toutes les catégories
     */
    public function allCategoryAttributes()
    {
        try {
            $categories = DB::table('categories')
                ->select('id', 'name', 'slug')
                ->orderBy('order', 'asc')
                ->get();

            $result = $categories->map(function ($category) {
                $attributes = DB::table('category_attributes')
                    ->where('category_id', $category->id)
                    ->orderBy('sort_order', 'asc')
                    ->get()
                    ->map(function ($attr) {
                        $attr->options = $attr->options ? json_decode($attr->options) : [];
                        $attr->validation = $attr->validation ? json_decode($attr->validation) : null;
                        return $attr;
                    });

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'attributes' => $attributes,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des attributs',
            ], 500);
        }
    }
}
