<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CreateSettingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->increments('id');
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, json, etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insérer les paramètres par défaut
        $now = Carbon::now();
        DB::table('settings')->insert([
            // Réseaux sociaux
            ['key' => 'social_whatsapp', 'value' => '', 'type' => 'string', 'description' => 'Lien WhatsApp', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'social_tiktok', 'value' => '', 'type' => 'string', 'description' => 'Lien TikTok', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'social_facebook', 'value' => '', 'type' => 'string', 'description' => 'Lien Facebook', 'created_at' => $now, 'updated_at' => $now],
            
            // Bannière publicitaire
            ['key' => 'banner_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Activer la bannière', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'banner_text', 'value' => 'Jusqu\'à 30% de réduction', 'type' => 'string', 'description' => 'Texte principal de la bannière', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'banner_subtext', 'value' => 'Offre limitée', 'type' => 'string', 'description' => 'Sous-texte de la bannière', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'banner_discount', 'value' => '30', 'type' => 'string', 'description' => 'Pourcentage de réduction', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'banner_cta_link', 'value' => '/products', 'type' => 'string', 'description' => 'Lien du bouton CTA', 'created_at' => $now, 'updated_at' => $now],
            
            // Autres paramètres
            ['key' => 'site_name', 'value' => 'Fashop', 'type' => 'string', 'description' => 'Nom du site', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'site_description', 'value' => 'Votre boutique de mode en ligne', 'type' => 'string', 'description' => 'Description du site', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'delivery_fee', 'value' => '2000', 'type' => 'string', 'description' => 'Frais de livraison par défaut', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('settings');
    }
}

