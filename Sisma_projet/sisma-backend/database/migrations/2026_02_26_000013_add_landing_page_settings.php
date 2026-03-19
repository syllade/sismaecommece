<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AddLandingPageSettings extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        $now = Carbon::now();
        
        // Landing page settings
        $settings = [
            // Hero Section
            ['key' => 'hero_title', 'value' => 'Bienvenue sur SISMA', 'type' => 'string', 'description' => 'Titre principal hero', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hero_subtitle', 'value' => 'Votre plateforme e-commerce de confiance', 'type' => 'string', 'description' => 'Sous-titre hero', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hero_cta_text', 'value' => 'Découvrir', 'type' => 'string', 'description' => 'Texte du bouton CTA', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hero_cta_link', 'value' => '/shop', 'type' => 'string', 'description' => 'Lien du bouton CTA', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hero_image', 'value' => '', 'type' => 'string', 'description' => 'Image hero URL', 'created_at' => $now, 'updated_at' => $now],
            
            // About Section
            ['key' => 'about_title', 'value' => 'À propos de nous', 'type' => 'string', 'description' => 'Titre section à propos', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'about_text', 'value' => 'SISMA est votre plateforme e-commerce de confiance.', 'type' => 'text', 'description' => 'Texte à propos', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'about_image', 'value' => '', 'type' => 'string', 'description' => 'Image à propos URL', 'created_at' => $now, 'updated_at' => $now],
            
            // Contact Info
            ['key' => 'contact_phone', 'value' => '+225 00 000 000', 'type' => 'string', 'description' => 'Téléphone de contact', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'contact_email', 'value' => 'contact@sisma.com', 'type' => 'string', 'description' => 'Email de contact', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'contact_address', 'value' => 'Abidjan, Côte d\'Ivoire', 'type' => 'string', 'description' => 'Adresse physique', 'created_at' => $now, 'updated_at' => $now],
            
            // Social Links
            ['key' => 'facebook_url', 'value' => '', 'type' => 'string', 'description' => 'Lien Facebook', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'instagram_url', 'value' => '', 'type' => 'string', 'description' => 'Lien Instagram', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'tiktok_url', 'value' => '', 'type' => 'string', 'description' => 'Lien TikTok', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'whatsapp_url', 'value' => '', 'type' => 'string', 'description' => 'Lien WhatsApp', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'youtube_url', 'value' => '', 'type' => 'string', 'description' => 'Lien YouTube', 'created_at' => $now, 'updated_at' => $now],
            
            // Footer
            ['key' => 'footer_text', 'value' => '© 2024 SISMA. Tous droits réservés.', 'type' => 'string', 'description' => 'Texte footer', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'footer_logo', 'value' => '', 'type' => 'string', 'description' => 'Logo footer URL', 'created_at' => $now, 'updated_at' => $now],
            
            // Branding Colors
            ['key' => 'primary_color', 'value' => '#3B82F6', 'type' => 'string', 'description' => 'Couleur primaire (hex)', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'secondary_color', 'value' => '#10B981', 'type' => 'string', 'description' => 'Couleur secondaire (hex)', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'accent_color', 'value' => '#F59E0B', 'type' => 'string', 'description' => 'Couleur d\'accent (hex)', 'created_at' => $now, 'updated_at' => $now],
            
            // Features Section
            ['key' => 'features_title', 'value' => 'Nos services', 'type' => 'string', 'description' => 'Titre section fonctionnalités', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'features_subtitle', 'value' => 'Découvrez ce qui nous distingue', 'type' => 'string', 'description' => 'Sous-titre fonctionnalités', 'created_at' => $now, 'updated_at' => $now],
            
            // CTA Banner
            ['key' => 'cta_title', 'value' => 'Commencez maintenant', 'type' => 'string', 'description' => 'Titre CTA banner', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'cta_text', 'value' => 'Rejoignez des milliers de fournisseurs et clients satisfaits', 'type' => 'string', 'description' => 'Texte CTA banner', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'cta_button_text', 'value' => 'S\'inscrire', 'type' => 'string', 'description' => 'Texte bouton CTA', 'created_at' => $now, 'updated_at' => $now],
            
            // SEO
            ['key' => 'seo_title', 'value' => 'SISMA - Votre plateforme e-commerce', 'type' => 'string', 'description' => 'Titre SEO', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'seo_description', 'value' => 'Plateforme e-commerce de confiance en Côte d\'Ivoire', 'type' => 'string', 'description' => 'Meta description', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'seo_keywords', 'value' => 'e-commerce, achat en ligne, Côte d\'Ivoire', 'type' => 'string', 'description' => 'Meta keywords', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'seo_image', 'value' => '', 'type' => 'string', 'description' => 'Image OG', 'created_at' => $now, 'updated_at' => $now],
            
            // Maintenance Mode
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'description' => 'Mode maintenance', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'maintenance_message', 'value' => 'Le site est en maintenance. Revenez bientôt!', 'type' => 'string', 'description' => 'Message maintenance', 'created_at' => $now, 'updated_at' => $now],
        ];
        
        // Fix the accent_color array syntax
        $settings[17] = ['key' => 'accent_color', 'value' => '#F59E0B', 'type' => 'string', 'description' => 'Couleur d\'accent (hex)', 'created_at' => $now, 'updated_at' => $now];
        
        // Check which settings don't exist yet and insert them
        $existingKeys = DB::table('settings')->pluck('key')->toArray();
        
        foreach ($settings as $setting) {
            if (!in_array($setting['key'], $existingKeys)) {
                DB::table('settings')->insert($setting);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        $keys = [
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
        
        DB::table('settings')->whereIn('key', $keys)->delete();
    }
}
