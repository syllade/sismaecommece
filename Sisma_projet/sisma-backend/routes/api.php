<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Ici sont définies les routes API pour l'application SISMA
| Toutes les routes sont automatiquement protégées par le middleware CORS
|
*/

// =====================================================
// ROUTES PUBLIQUES (sans authentification)
// =====================================================

// Auth
$router->group(['prefix' => 'api/auth'], function ($router) {
    $router->post('login', ['middleware' => 'throttle:10,1', 'uses' => 'Api\AuthController@login']);
    $router->post('refresh-token', 'Api\AuthController@refreshToken');
    $router->post('register', 'Api\AuthController@register');
    $router->get('activation/{token}', 'Api\AuthController@activationStatus');
    $router->post('activate', ['middleware' => 'throttle:5,1', 'uses' => 'Api\AuthController@activate']);
});
// Alias contract simplifié
$router->post('api/login', ['middleware' => 'throttle:10,1', 'uses' => 'Api\AuthController@login']);

// Produits (PUBLIC)
$router->group(['prefix' => 'api/products'], function ($router) {
    $router->get('/', 'Api\ProductController@index');
    $router->get('{slug}', 'Api\ProductController@show');
});

// Catégories (PUBLIC)
$router->get('api/categories', 'Api\CategoryController@index');
$router->get('api/categories/{category}/schema', 'Api\CategoryController@schema');

// Témoignages (PUBLIC)
$router->get('api/testimonials', 'Api\TestimonialController@index');

// Paramètres (PUBLIC)
$router->get('api/settings', 'Api\SettingController@index');
$router->get('api/settings/{key}', 'Api\SettingController@show');

// Landing Page Settings (PUBLIC)
$router->get('api/landing', 'Api\SettingController@landing');

// Fournisseurs (PUBLIC - inscription fournisseur)
$router->post('api/suppliers', 'Api\SuppliersController@store');
// NOUVELLE ROUTE - Inscription complète fournisseur
$router->post('api/supplier/register', 'Api\V1\SupplierRegistrationController@register');
$router->get('api/supplier/register/status/{token}', 'Api\V1\SupplierRegistrationController@checkStatus');
$router->post('api/supplier/resend-activation', 'Api\V1\SupplierRegistrationController@resendActivation');
$router->get('api/supplier/requirements', 'Api\V1\SupplierRegistrationController@requirements');
// Fournisseurs (PUBLIC - liste et détail)
$router->get('api/suppliers', 'Api\SuppliersController@publicIndex');
$router->get('api/suppliers/{slug}', 'Api\SuppliersController@publicShow');
$router->get('api/suppliers/{id}/products', 'Api\SuppliersController@publicProducts');

// Frais de livraison (PUBLIC - calcul)
$router->get('api/delivery-fees/calculate', 'Api\DeliveryFeeController@calculate');

// Landing Page dynamique (PUBLIC)
$router->get('api/v1/home', 'Api\V1\HomeController@index');
$router->get('api/v1/home/top-products', 'Api\V1\HomeController@topProducts');
$router->get('api/v1/home/new-products', 'Api\V1\HomeController@newProducts');
$router->get('api/v1/home/top-shops', 'Api\V1\HomeController@topShops');
$router->get('api/v1/home/promotions', 'Api\V1\HomeController@promotions');

// Fournisseurs avec produits (PUBLIC) - Pour pages Homme/Femme
$router->get('api/v1/home/suppliers-with-products', 'Api\V1\HomeController@suppliersWithProducts');

// Boutiques (PUBLIC)
$router->get('api/v1/shops', 'Api\V1\ShopController@index');
$router->get('api/v1/shops/top', 'Api\V1\ShopController@top');
$router->get('api/v1/shops/{slug}', 'Api\V1\ShopController@show');
$router->get('api/v1/shops/{slug}/products', 'Api\V1\ShopController@products');

// Produits et boutiques sponsorisés (PUBLIC)
$router->get('api/v1/sponsored/products', 'Api\V1\SponsoredController@products');
$router->get('api/v1/sponsored/suppliers', 'Api\V1\SponsoredController@suppliers');
$router->get('api/v1/sponsored/mixed', 'Api\V1\SponsoredController@mixed');
$router->post('api/v1/sponsored/impression', 'Api\V1\SponsoredController@recordImpression');
$router->post('api/v1/sponsored/click', 'Api\V1\SponsoredController@recordClick');
$router->post('api/v1/sponsored/conversion', 'Api\V1\SponsoredController@recordConversion');

// Avis et Notes (PUBLIC)
$router->group(['prefix' => 'api/v1'], function ($router) {
    // Products reviews
    $router->post('products/{id}/reviews', 'Api\V1\ReviewController@storeProductReview');
    $router->get('products/{id}/reviews', 'Api\V1\ReviewController@getProductReviews');
    $router->get('products/{id}/reviews-summary', 'Api\V1\ReviewController@getProductReviewsSummary');
    
    // Supplier reviews
    $router->post('shops/{id}/reviews', 'Api\V1\ReviewController@storeSupplierReview');
    $router->get('shops/{id}/reviews', 'Api\V1\ReviewController@getSupplierReviews');
    $router->get('shops/{id}/reviews-summary', 'Api\V1\ReviewController@getSupplierReviewsSummary');
    
    // Promotions
    $router->post('promotions/validate', 'Api\V1\PromotionController@validateCode');
});

// Commandes (PUBLIC - création uniquement)
$router->post('api/orders', 'Api\OrderController@store');
// Recherche commandes par téléphone (PUBLIC - clients non connectés)
$router->get('api/orders/guest', 'Api\OrderController@guestOrders');
// Livraisons (PUBLIC - confirmation par email)
$router->get('api/delivery/confirm/{token}', 'Api\OrderController@confirmDeliveryFromEmail');

// Retours (PUBLIC - création)
$router->post('api/v1/returns', 'Api\V1\OrderReturnController@store');

// =====================================================
// ROUTES PROTÉGÉES (authentification requise)
// =====================================================

$router->group(['prefix' => 'api', 'middleware' => 'auth.api'], function ($router) {
    
    // Auth user
    $router->group(['prefix' => 'auth'], function ($router) {
        $router->get('me', 'Api\AuthController@me');
        $router->post('logout', 'Api\AuthController@logout');
        $router->post('refresh', 'Api\AuthController@refresh');
    });
    // Alias contract simplifié
    $router->get('me', 'Api\AuthController@me');
    $router->post('logout', 'Api\AuthController@logout');

    // =====================================================
    // ROUTES ADMIN (rôle admin uniquement)
    // =====================================================
    
    $router->group(['prefix' => 'admin', 'middleware' => 'role:admin'], function ($router) {
        
        // Dashboard & Analytics
        $router->group(['prefix' => 'analytics'], function ($router) {
            $router->get('dashboard', 'Api\AnalyticsController@dashboardStats');
            $router->get('sales', 'Api\AnalyticsController@salesData');
            $router->get('category-sales', 'Api\AnalyticsController@categorySales');
            $router->get('top-products', 'Api\AnalyticsController@topProducts');
            $router->get('orders-by-status', 'Api\AnalyticsController@ordersByStatus');
            $router->get('delivery-persons', 'Api\AnalyticsController@deliveryPersonsStats');
        });

        // Produits (ADMIN)
        $router->group(['prefix' => 'products'], function ($router) {
            $router->get('/', 'Api\ProductController@adminIndex');
            $router->post('/', 'Api\ProductController@store');
            $router->get('{product}', 'Api\ProductController@show');
            $router->put('{product}', 'Api\ProductController@update');
            $router->delete('{product}', 'Api\ProductController@destroy');
            $router->post('{product}/duplicate', 'Api\ProductController@duplicate');
        });

        // Catégories (ADMIN)
        $router->group(['prefix' => 'categories'], function ($router) {
            $router->get('/', 'Api\CategoryController@adminIndex');
            $router->post('/', 'Api\CategoryController@store');
            $router->put('{category}', 'Api\CategoryController@update');
            $router->delete('{category}', 'Api\CategoryController@destroy');
        });

        // Commandes (ADMIN)
        $router->group(['prefix' => 'orders'], function ($router) {
            $router->get('grouped', 'Api\OrderController@grouped');
            $router->post('bulk-assign', 'Api\OrderController@bulkAssign');
            $router->get('/', 'Api\OrderController@index');
            $router->get('{order}', 'Api\OrderController@show');
            $router->put('{order}/status', 'Api\OrderController@updateStatus');
            $router->post('{order}/whatsapp', 'Api\OrderController@sendWhatsAppMessage');
            $router->post('{order}/assign-delivery-person', 'Api\OrderController@assignDeliveryPerson');
            $router->post('{order}/assign-delivery', 'Api\OrderController@assignDeliveryPerson'); // Alias pour compatibilité
            $router->post('{order}/send-to-delivery-person', 'Api\OrderController@sendToDeliveryPerson');
            $router->post('{order}/send-to-delivery', 'Api\OrderController@sendToDeliveryPerson'); // Alias pour compatibilité
            $router->delete('{order}', 'Api\OrderController@destroy');
        });

        // Livreurs (ADMIN)
        $router->group(['prefix' => 'delivery-persons'], function ($router) {
            $router->get('/', 'Api\DeliveryPersonController@index');
            $router->post('/', 'Api\DeliveryPersonController@store');
            $router->get('{id}/orders', 'Api\DeliveryPersonController@getOrders');
            $router->post('{id}/send-daily-orders', 'Api\DeliveryPersonController@sendDailyOrders');
            $router->put('{id}', 'Api\DeliveryPersonController@update');
            $router->delete('{id}', 'Api\DeliveryPersonController@destroy');
        });

        // Fournisseurs (ADMIN)
        $router->group(['prefix' => 'suppliers'], function ($router) {
            $router->get('/', 'Api\SuppliersController@index');
            $router->post('/', 'Api\SuppliersController@store');
            $router->post('bulk-status', 'Api\SuppliersController@bulkStatus');
            $router->put('{id}', 'Api\SuppliersController@update');
            $router->delete('{id}', 'Api\SuppliersController@destroy');
        });

        // Factures (ADMIN)
        $router->group(['prefix' => 'invoices'], function ($router) {
            $router->get('/', 'Api\InvoiceController@index');
            $router->get('{id}', 'Api\InvoiceController@show');
            $router->put('{id}/status', 'Api\InvoiceController@updateStatus');
        });

        // Frais de livraison (ADMIN)
        $router->group(['prefix' => 'delivery-fees'], function ($router) {
            $router->get('/', 'Api\DeliveryFeeController@index');
            $router->post('/', 'Api\DeliveryFeeController@store');
        });

        // Témoignages (ADMIN)
        $router->group(['prefix' => 'testimonials'], function ($router) {
            $router->get('/', 'Api\TestimonialController@adminIndex');
            $router->post('/', 'Api\TestimonialController@store');
            $router->put('{testimonial}', 'Api\TestimonialController@update');
            $router->delete('{testimonial}', 'Api\TestimonialController@destroy');
        });

        // Paramètres (ADMIN)
        $router->group(['prefix' => 'settings'], function ($router) {
            $router->put('/', 'Api\SettingController@update');
            $router->put('bulk', 'Api\SettingController@updateBulk');
        });
        
        // Paramètres individuels (PUBLIC - pour compatibilité)
        $router->get('settings/{key}', 'Api\SettingController@show');
    });

    // =====================================================
    // ROUTES FOURNISSEUR (rôle supplier)
    // =====================================================
    $router->group(['prefix' => 'supplier', 'middleware' => 'role:supplier'], function ($router) {
        $router->get('orders', 'Api\SupplierOrderController@index');
        $router->post('orders/{id}/status', 'Api\SupplierOrderController@updateStatus');
        $router->post('orders/bulk-status', 'Api\SupplierOrderController@bulkStatus');
        // Produits (FOURNISSEUR)
        $router->group(['prefix' => 'products'], function ($router) {
            $router->get('/', 'Api\SupplierProductController@index');
            $router->post('/', 'Api\SupplierProductController@store');
            $router->get('{product}', 'Api\SupplierProductController@show');
            $router->patch('{product}', 'Api\SupplierProductController@update');
            $router->delete('{product}', 'Api\SupplierProductController@destroy');
        });
    });

    // =====================================================
    // API V1 - FOURNISSEUR (VERSIONNÉE)
    // =====================================================
    $router->group(['prefix' => 'v1/supplier', 'middleware' => 'role:supplier,supplier.commissions'], function ($router) {
        // Dashboard
        $router->get('dashboard', 'Api\V1\SupplierDashboardController@stats');
        $router->get('dashboard/revenue', 'Api\V1\SupplierDashboardController@revenue');
        $router->get('dashboard/orders-by-status', 'Api\V1\SupplierDashboardController@ordersByStatus');
        $router->get('dashboard/top-products', 'Api\V1\SupplierDashboardController@topProducts');
        $router->get('dashboard/recent-orders', 'Api\V1\SupplierDashboardController@recentOrders');

        // Orders
        $router->get('orders', 'Api\V1\SupplierOrderController@index');
        $router->get('orders/{id}', 'Api\V1\SupplierOrderController@show');
        $router->put('orders/{id}', 'Api\V1\SupplierOrderController@update');
        $router->put('orders/{id}/status', 'Api\V1\SupplierOrderController@updateStatus');
        $router->post('orders/manual', 'Api\V1\SupplierOrderController@createManual');
        $router->post('orders/bulk-status', 'Api\V1\SupplierOrderController@bulkStatus');
        $router->get('orders/pending-count', 'Api\V1\SupplierOrderController@pendingCount');

        // Campagnes sponsorisées
        $router->get('campaigns', 'Api\V1\SupplierCampaignController@index');
        $router->get('campaigns/stats', 'Api\V1\SupplierCampaignController@stats');
        $router->get('campaigns/products', 'Api\V1\SupplierCampaignController@products');
        $router->post('campaigns', 'Api\V1\SupplierCampaignController@store');
        $router->get('campaigns/{id}', 'Api\V1\SupplierCampaignController@show');
        $router->put('campaigns/{id}', 'Api\V1\SupplierCampaignController@update');
        $router->delete('campaigns/{id}', 'Api\V1\SupplierCampaignController@destroy');
        $router->post('campaigns/{id}/toggle', 'Api\V1\SupplierCampaignController@toggle');

        // Order Notifications (Communication)
        $router->get('orders/{id}/notifications', 'Api\V1\SupplierOrderNotificationController@index');
        $router->post('orders/{id}/send-whatsapp', 'Api\V1\SupplierOrderNotificationController@sendWhatsApp');
        $router->post('orders/{id}/send-email', 'Api\V1\SupplierOrderNotificationController@sendEmail');
        $router->get('orders/{id}/invoice-html', 'Api\V1\SupplierOrderNotificationController@generateInvoicePdf');
        $router->get('orders/{id}/print', 'Api\V1\SupplierOrderNotificationController@getPrintView');

        // Products
        $router->get('products', 'Api\V1\SupplierProductController@index');
        $router->post('products', 'Api\V1\SupplierProductController@store');
        $router->get('products/{id}', 'Api\V1\SupplierProductController@show');
        $router->put('products/{id}', 'Api\V1\SupplierProductController@update');
        $router->delete('products/{id}', 'Api\V1\SupplierProductController@destroy');
        $router->post('products/import', 'Api\V1\SupplierProductController@import');
        $router->get('products/export', 'Api\V1\SupplierProductController@export');
        $router->put('products/{id}/variants', 'Api\V1\SupplierProductController@updateVariants');

        // AI
        $router->post('ai/generate-description', 'Api\V1\AIController@generateDescription');
        $router->post('ai/generate-variations', 'Api\V1\AIController@generateVariations');
        $router->post('ai/translate', 'Api\V1\AIController@translate');
        $router->post('ai/improve', 'Api\V1\AIController@improveDescription');
        $router->get('ai/stats', 'Api\V1\AIController@stats');

        // Marketing
        $router->get('campaigns', 'Api\V1\SupplierMarketingController@index');
        $router->post('campaigns', 'Api\V1\SupplierMarketingController@store');
        $router->get('campaigns/{id}', 'Api\V1\SupplierMarketingController@show');
        $router->put('campaigns/{id}', 'Api\V1\SupplierMarketingController@update');
        $router->put('campaigns/{id}/toggle', 'Api\V1\SupplierMarketingController@toggle');
        $router->delete('campaigns/{id}', 'Api\V1\SupplierMarketingController@destroy');
        $router->get('campaigns/{id}/stats', 'Api\V1\SupplierMarketingController@stats');
        $router->get('advertising/balance', 'Api\V1\SupplierMarketingController@balance');
        $router->post('advertising/deposit', 'Api\V1\SupplierMarketingController@deposit');

        // Settings
        $router->get('settings', 'Api\V1\SupplierSettingsController@index');
        $router->get('settings/profile', 'Api\V1\SupplierSettingsController@profile');
        $router->put('settings/profile', 'Api\V1\SupplierSettingsController@updateProfile');
        $router->get('settings/notifications', 'Api\V1\SupplierSettingsController@notifications');
        $router->put('settings/notifications', 'Api\V1\SupplierSettingsController@updateNotifications');
        $router->get('settings/billing', 'Api\V1\SupplierSettingsController@billing');
        $router->get('settings/delivery', 'Api\V1\SupplierSettingsController@delivery');
        $router->put('settings/delivery', 'Api\V1\SupplierSettingsController@updateDelivery');
        $router->get('settings/api', 'Api\V1\SupplierSettingsController@apiKeys');
        $router->post('settings/api/generate', 'Api\V1\SupplierSettingsController@generateApiKey');
        $router->delete('settings/api/{id}', 'Api\V1\SupplierSettingsController@deleteApiKey');
        
        // Wallet & Commissions
        $router->get('wallet', 'Api\V1\PromotionController@getWallet');
        $router->post('withdraw', 'Api\V1\PromotionController@requestWithdrawal');
    });

    // =====================================================
    // ROUTES LIVREUR (rôle delivery)
    // =====================================================
    $router->group(['prefix' => 'delivery', 'middleware' => 'role:delivery'], function ($router) {
        $router->get('orders', 'Api\DeliveryOrderController@index');
        $router->post('orders/{id}/accept', 'Api\DeliveryOrderController@accept');
        $router->post('orders/{id}/refuse', 'Api\DeliveryOrderController@refuse');
        $router->post('orders/{id}/delivered', 'Api\DeliveryOrderController@delivered');
    });

    // Accès sécurisé à la preuve photo (autorisé selon policy)
    $router->get('orders/{id}/proof-photo', ['middleware' => 'role:admin,supplier,delivery,client', 'uses' => 'Api\DeliveryOrderController@proofPhoto']);

    // =====================================================
    // API V1 - ADMIN (VERSIONNÉE)
    // =====================================================
    $router->group(['prefix' => 'v1/admin', 'middleware' => ['auth.api', 'role:admin']], function ($router) {
        // Dashboard Stats
        $router->get('stats', 'Api\V1\AdminStatsController@stats');
        $router->get('stats/kpis', 'Api\V1\AdminStatsController@kpis');

        // Admin Notifications
        $router->get('notifications', 'Api\V1\AdminNotificationController@index');
        $router->get('notifications/unread-count', 'Api\V1\AdminNotificationController@unreadCount');
        $router->get('notifications/stats', 'Api\V1\AdminNotificationController@stats');
        $router->put('notifications/{id}/read', 'Api\V1\AdminNotificationController@markAsRead');
        $router->put('notifications/read-all', 'Api\V1\AdminNotificationController@markAllAsRead');
        $router->delete('notifications/{id}', 'Api\V1\AdminNotificationController@destroy');

        // Threshold Alerts
        $router->get('suppliers/threshold-alert', 'Api\V1\AdminNotificationController@thresholdAlerts');

        // Risk Management
        $router->get('risk/dashboard', 'Api\V1\AdminRiskController@dashboard');
        $router->get('risk/clients', 'Api\V1\AdminRiskController@atRiskClients');
        $router->get('risk/suppliers', 'Api\V1\AdminRiskController@atRiskSuppliers');
        $router->post('risk/clients/{id}/ban', 'Api\V1\AdminRiskController@banClient');
        $router->post('risk/clients/{id}/suspend', 'Api\V1\AdminRiskController@suspendClient');
        $router->post('risk/suppliers/{id}/suspend', 'Api\V1\AdminRiskController@suspendSupplier');
        $router->get('risk/security-events', 'Api\V1\AdminRiskController@securityEvents');
        $router->get('risk/blacklist', 'Api\V1\AdminRiskController@blacklist');
        $router->post('risk/blacklist/add', 'Api\V1\AdminRiskController@addToBlacklist');

        // Fournisseurs
        $router->get('suppliers', 'Api\V1\AdminSupplierController@index');
        $router->post('suppliers', 'Api\V1\AdminSupplierController@store');
        $router->get('suppliers/{id}', 'Api\V1\AdminSupplierController@show');
        $router->put('suppliers/{id}', 'Api\V1\AdminSupplierController@update');
        $router->delete('suppliers/{id}', 'Api\V1\AdminSupplierController@destroy');
        $router->post('suppliers/{id}/block', 'Api\V1\AdminSupplierController@block');
        $router->post('suppliers/{id}/reset-password', 'Api\V1\AdminSupplierController@resetPassword');
        $router->post('suppliers/invite', 'Api\V1\AdminSupplierController@invite');
        $router->post('suppliers/bulk-action', 'Api\V1\AdminSupplierController@bulkAction');
        $router->get('suppliers/{id}/export-pdf', 'Api\V1\AdminSupplierController@exportPdf');
        
        // Supplier Performance & Ranking
        $router->get('suppliers/performance', 'Api\V1\AdminSupplierPerformanceController@performance');
        $router->get('suppliers/pending-registrations', 'Api\V1\AdminSupplierPerformanceController@pendingRegistrations');
        $router->post('suppliers/{id}/validate', 'Api\V1\AdminSupplierPerformanceController@activateSupplier');
        $router->post('suppliers/{id}/reject', 'Api\V1\AdminSupplierPerformanceController@rejectSupplier');
        $router->get('suppliers/stats', 'Api\V1\AdminSupplierPerformanceController@stats');

        // Supplier Monitoring
        $router->get('suppliers-overview', 'Api\V1\AdminSupplierMonitorController@getSuppliersOverview');
        $router->get('suppliers/{id}/activity', 'Api\V1\AdminSupplierMonitorController@getActivity');
        $router->get('suppliers/{id}/ai-usage', 'Api\V1\AdminSupplierMonitorController@getAiUsage');
        $router->get('suppliers/{id}/campaign-clicks', 'Api\V1\AdminSupplierMonitorController@getCampaignClicks');
        $router->get('suppliers/{id}/metrics', 'Api\V1\AdminSupplierMonitorController@getMetrics');
        $router->get('suppliers/{id}/export', 'Api\V1\AdminSupplierMonitorController@export');

        // Livreurs
        $router->get('drivers', 'Api\V1\AdminDriverController@index');
        $router->post('drivers', 'Api\V1\AdminDriverController@store');
        $router->get('drivers/{id}', 'Api\V1\AdminDriverController@show');
        $router->put('drivers/{id}', 'Api\V1\AdminDriverController@update');
        $router->post('drivers/{id}/toggle-status', 'Api\V1\AdminDriverController@toggleStatus');
        $router->delete('drivers/{id}', 'Api\V1\AdminDriverController@destroy');
        $router->get('drivers/zones', 'Api\V1\AdminDriverController@zones');
        $router->post('drivers/bulk-toggle', 'Api\V1\AdminDriverController@bulkToggle');

        // Commandes
        $router->get('orders', 'Api\V1\AdminOrderController@index');
        $router->get('orders/{id}', 'Api\V1\AdminOrderController@show');
        $router->put('orders/{id}', 'Api\V1\AdminOrderController@update');
        $router->put('orders/{id}/status', 'Api\V1\AdminOrderController@updateStatus');
        $router->post('orders/{id}/assign-driver', 'Api\V1\AdminOrderController@assignDriver');
        $router->post('orders/assign-driver', 'Api\V1\AdminOrderController@bulkAssign');
        $router->post('orders/auto-assign', 'Api\V1\AdminOrderController@autoAssign');
        $router->post('orders/{id}/whatsapp-supplier', 'Api\V1\AdminOrderController@whatsappSupplier');
        $router->post('orders/{id}/whatsapp-driver', 'Api\V1\AdminOrderController@whatsappDriver');
        $router->get('orders/grouped', 'Api\V1\AdminOrderController@grouped');
        $router->get('orders/unprocessed', 'Api\V1\AdminOrderController@unprocessed');
        $router->delete('orders/{id}', 'Api\V1\AdminOrderController@destroy');
        
        // Order Management (Create, QR Code)
        $router->post('orders/create', 'Api\V1\AdminOrderManagementController@createOrder');
        $router->get('orders/{id}/qr', 'Api\V1\AdminOrderManagementController@getQrCode');
        $router->post('orders/{id}/validate-qr', 'Api\V1\AdminOrderManagementController@validateQr');
        $router->post('orders/{id}/regenerate-qr', 'Api\V1\AdminOrderManagementController@regenerateQr');

        // Campagnes sponsorisées (Admin)
        $router->get('sponsored/dashboard', 'Api\V1\AdminSponsoredController@dashboard');
        $router->get('sponsored/campaigns', 'Api\V1\AdminSponsoredController@campaigns');
        $router->put('sponsored/campaigns/{id}/status', 'Api\V1\AdminSponsoredController@updateStatus');
        $router->delete('sponsored/campaigns/{id}', 'Api\V1\AdminSponsoredController@destroy');
        $router->post('sponsored/suppliers/{id}/sponsor', 'Api\V1\AdminSponsoredController@sponsorSupplier');
        $router->delete('sponsored/suppliers/{id}/sponsor', 'Api\V1\AdminSponsoredController@unsponsorSupplier');
        $router->get('sponsored/export', 'Api\V1\AdminSponsoredController@export');

        // Logistique
        $router->get('logistics/live', 'Api\V1\AdminLogisticsController@live');
        $router->get('logistics/zones', 'Api\V1\AdminLogisticsController@zones');
        $router->get('logistics/alerts', 'Api\V1\AdminLogisticsController@alerts');
        $router->get('logistics/tours', 'Api\V1\AdminLogisticsController@tours');
        
        // Smart Alerts
        $router->get('alerts/smart', 'Api\V1\AdminSmartAlertsController@index');

        // Marketing
        $router->get('campaigns', 'Api\V1\AdminMarketingController@index');
        $router->post('campaigns', 'Api\V1\AdminMarketingController@store');
        $router->get('campaigns/{id}', 'Api\V1\AdminMarketingController@show');
        $router->put('campaigns/{id}', 'Api\V1\AdminMarketingController@update');
        $router->put('campaigns/{id}/approve', 'Api\V1\AdminMarketingController@approve');
        $router->put('campaigns/{id}/reject', 'Api\V1\AdminMarketingController@reject');
        $router->delete('campaigns/{id}', 'Api\V1\AdminMarketingController@destroy');
        $router->get('campaigns/{id}/stats', 'Api\V1\AdminMarketingController@stats');

        // Rapports
        $router->get('reports/orders', 'Api\V1\AdminReportsController@orders');
        $router->get('reports/suppliers', 'Api\V1\AdminReportsController@suppliers');
        $router->get('reports/deliveries', 'Api\V1\AdminReportsController@deliveries');
        $router->get('reports/top-products', 'Api\V1\AdminReportsController@topProducts');
        $router->get('reports/export/csv', 'Api\V1\AdminReportsController@exportCsv');
        $router->get('reports/export/pdf', 'Api\V1\AdminReportsController@exportPdf');

        // Paramètres
        $router->get('settings', 'Api\V1\AdminSettingsController@index');
        $router->put('settings', 'Api\V1\AdminSettingsController@update');
        $router->get('settings/landing', 'Api\V1\AdminSettingsController@landingSettings');
        $router->put('settings/landing', 'Api\V1\AdminSettingsController@updateLandingSettings');
        $router->get('settings/commissions', 'Api\V1\AdminSettingsController@commissions');
        $router->put('settings/commissions/global', 'Api\V1\AdminSettingsController@updateGlobalCommission');
        $router->put('settings/commissions/supplier', 'Api\V1\AdminSettingsController@updateSupplierCommission');
        $router->get('settings/categories', 'Api\V1\AdminSettingsController@categories');
        $router->post('settings/categories', 'Api\V1\AdminSettingsController@createCategory');
        $router->put('settings/categories/{id}', 'Api\V1\AdminSettingsController@updateCategory');
        $router->delete('settings/categories/{id}', 'Api\V1\AdminSettingsController@deleteCategory');
        $router->put('settings/categories/reorder', 'Api\V1\AdminSettingsController@reorderCategories');
        $router->get('settings/categories/{id}/attributes', 'Api\V1\AdminSettingsController@categoryAttributes');
        $router->get('settings/categories/all/attributes', 'Api\V1\AdminSettingsController@allCategoryAttributes');
        $router->get('settings/delivery-zones', 'Api\V1\AdminSettingsController@deliveryZones');
        $router->post('settings/delivery-zones', 'Api\V1\AdminSettingsController@createDeliveryZone');
        $router->put('settings/delivery-zones/{id}', 'Api\V1\AdminSettingsController@updateDeliveryZone');
        $router->delete('settings/delivery-zones/{id}', 'Api\V1\AdminSettingsController@deleteDeliveryZone');
        $router->get('settings/notifications', 'Api\V1\AdminSettingsController@notificationTemplates');
        $router->put('settings/notifications/{id}', 'Api\V1\AdminSettingsController@updateNotificationTemplate');
        
        // Promotions
        $router->post('promotions', 'Api\V1\PromotionController@create');
        $router->get('promotions', 'Api\V1\PromotionController@listAdmin');
        $router->post('promotions/{id}/toggle', 'Api\V1\PromotionController@toggle');
        
        // Commissions
        $router->get('commissions', 'Api\V1\PromotionController@listCommissions');
        
        // Retours (Admin/Supplier)
        $router->group(['prefix' => 'returns'], function ($router) {
            $router->get('/', 'Api\V1\OrderReturnController@index');
            $router->get('/my', 'Api\V1\OrderReturnController@myReturns');
            $router->get('/{id}', 'Api\V1\OrderReturnController@show');
            $router->post('/{id}/approve', 'Api\V1\OrderReturnController@approve');
            $router->post('/{id}/reject', 'Api\V1\OrderReturnController@reject');
            $router->post('/{id}/refund', 'Api\V1\OrderReturnController@refund');
        });

        // Reviews
        $router->get('reviews', 'Api\V1\ReviewController@listReviews');
        $router->post('reviews/{id}/verify', 'Api\V1\ReviewController@verifyReview');
        $router->delete('reviews/{id}', 'Api\V1\ReviewController@deleteReview');
        
        // Paiements (Cash on Delivery)
        $router->get('payments', 'Api\V1\PaymentController@listPayments');
        $router->get('payments/logs', 'Api\V1\PaymentController@listPaymentLogs');
        $router->post('orders/{id}/mark-paid', 'Api\V1\PaymentController@markAsPaid');
    });

    // =====================================================
    // API V1 - DRIVER / LIVREUR (VERSIONNÉE)
    // =====================================================
    // Routes publiques pour activation
    $router->group(['prefix' => 'v1/driver'], function ($router) {
        // Activation (Signed URL)
        $router->get('activate/{id}', 'Api\V1\Driver\DriverActivationController@show')->name('driver.activate');
        $router->post('activate/{id}', 'Api\V1\Driver\DriverActivationController@activate');
        
        // Auth
        $router->post('login', ['middleware' => 'throttle:10,1', 'uses' => 'Api\V1\Driver\DriverAuthController@login']);
        $router->post('forgot-password', ['middleware' => 'throttle:5,1', 'uses' => 'Api\V1\Driver\DriverAuthController@forgotPassword']);
        $router->post('reset-password', 'Api\V1\Driver\DriverAuthController@resetPassword');
    });

    // Routes protégées pour driver
    $router->group(['prefix' => 'v1/driver', 'middleware' => 'role:delivery'], function ($router) {
        // Auth
        $router->post('logout', 'Api\V1\Driver\DriverAuthController@logout');
        $router->get('me', 'Api\V1\Driver\DriverAuthController@me');
        
        // Deliveries
        $router->get('deliveries', 'Api\V1\Driver\DriverDeliveryController@index');
        $router->get('deliveries/{id}', 'Api\V1\Driver\DriverDeliveryController@show');
        $router->post('deliveries/{id}/accept', 'Api\V1\Driver\DriverDeliveryController@accept');
        $router->post('deliveries/{id}/pickup', 'Api\V1\Driver\DriverDeliveryController@pickup');
        $router->post('deliveries/{id}/complete', ['middleware' => 'throttle:20,1', 'uses' => 'Api\V1\Driver\DriverDeliveryController@complete']);
        $router->post('deliveries/{id}/fail', 'Api\V1\Driver\DriverDeliveryController@fail');
        $router->post('deliveries/bulk-update', 'Api\V1\Driver\DriverDeliveryController@bulkUpdate');
        
        // QR Code Scanning
        $router->get('deliveries/{id}/qr-data', 'Api\V1\Driver\DriverQrController@getQrData');
        $router->get('deliveries/{id}/verify-qr', 'Api\V1\Driver\DriverQrController@verifyQr');
        $router->post('deliveries/{id}/scan-qr', 'Api\V1\Driver\DriverQrController@scanQr');
        $router->post('deliveries/{id}/confirm-manual', 'Api\V1\Driver\DriverQrController@confirmManual');
        
        // Paiement à la livraison (Cash on Delivery)
        $router->post('deliveries/{id}/confirm-payment', 'Api\V1\PaymentController@confirmPayment');
        $router->get('deliveries/{id}/payment-status', 'Api\V1\PaymentController@getPaymentStatus');
        
        // Stats
        $router->get('stats', 'Api\V1\Driver\DriverStatsController@index');
        $router->get('stats/weekly', 'Api\V1\Driver\DriverStatsController@weekly');
        
        // Profile
        $router->get('profile', 'Api\V1\Driver\DriverProfileController@show');
        $router->put('profile', 'Api\V1\Driver\DriverProfileController@update');
        $router->put('change-password', 'Api\V1\Driver\DriverProfileController@changePassword');
    });

    // =====================================================
    // ROUTES CLIENT (rôle client)
    // =====================================================
    $router->group(['prefix' => 'client', 'middleware' => 'role:client'], function ($router) {
        $router->get('orders', 'Api\ClientOrderController@index');
        $router->get('orders/{id}', 'Api\ClientOrderController@show');
        $router->get('orders/{id}/qr-data', 'Api\ClientOrderController@getQrData');
        $router->get('orders/{id}/tracking', 'Api\ClientOrderController@getTrackingStatus');
        $router->post('orders/{id}/cancel', 'Api\ClientOrderController@cancel');
        // Permet de créer une commande en étant connecté client (liaison customer_user_id)
        $router->post('orders', 'Api\OrderController@store');
        
        // Adresses client
        $router->get('addresses', 'Api\V1\ClientAddressController@index');
        $router->post('addresses', 'Api\V1\ClientAddressController@store');
        $router->put('addresses/{id}', 'Api\V1\ClientAddressController@update');
        $router->delete('addresses/{id}', 'Api\V1\ClientAddressController@destroy');
        $router->post('addresses/{id}/default', 'Api\V1\ClientAddressController@setDefault');
    });
});
