<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSponsoredCampaignsTable extends Migration
{
    public function up()
    {
        Schema::create('sponsored_campaigns', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('supplier_id');
            $table->unsignedInteger('product_id');
            $table->string('name');
            $table->decimal('budget', 12, 2)->default(0);
            $table->decimal('daily_budget', 12, 2)->nullable();
            $table->decimal('cost_per_click', 10, 2)->default(50); // Coût par clic en FCA
            $table->decimal('spent', 12, 2)->default(0);
            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->integer('conversions')->default(0);
            $table->enum('status', ['active', 'paused', 'completed', 'expired'])->default('active');
            $table->timestamp('start_date')->useCurrent();
            $table->timestamp('end_date')->nullable();
            $table->integer('priority')->default(0); // Priorité d'affichage (plus haut = plus visible)
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['supplier_id', 'status']);
            $table->index(['product_id', 'status']);
            $table->index(['status', 'priority']);
            
            // Clés étrangères
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // Ajouter colonne is_sponsored aux produits
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_sponsored')->default(false);
            $table->integer('sponsored_priority')->default(0);
        });

        // Ajouter colonne is_sponsored aux fournisseurs
        Schema::table('suppliers', function (Blueprint $table) {
            $table->boolean('is_sponsored')->default(false);
            $table->integer('sponsored_priority')->default(0);
        });
    }

    public function down()
    {
        Schema::dropIfExists('sponsored_campaigns');
        
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_sponsored', 'sponsored_priority']);
        });
        
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['is_sponsored', 'sponsored_priority']);
        });
    }
}
