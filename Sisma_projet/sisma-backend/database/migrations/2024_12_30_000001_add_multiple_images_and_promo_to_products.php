<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddMultipleImagesAndPromoToProducts extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            // Ajouter la colonne images (JSON pour stocker un tableau d'URLs)
            $table->text('images')->nullable()->after('image');
            // Ajouter la colonne is_promo pour marquer les produits en promotion
            $table->boolean('is_promo')->default(false)->after('is_featured');
        });

        // Migrer les données existantes : copier image vers images
        // Note: Pour Laravel 5.2, on utilise DB::raw() ou une requête directe
        try {
            $products = DB::table('products')->whereNotNull('image')->where('image', '!=', '')->get();
            foreach ($products as $product) {
                $imagesJson = json_encode(array($product->image));
                DB::table('products')->where('id', $product->id)->update(array('images' => $imagesJson));
            }
        } catch (\Exception $e) {
            // Ignorer les erreurs de migration si la table n'existe pas encore
        }
        
        // Optionnel : supprimer l'ancienne colonne image après migration
        // Schema::table('products', function (Blueprint $table) {
        //     $table->dropColumn('image');
        // });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('images');
            $table->dropColumn('is_promo');
        });
    }
}

