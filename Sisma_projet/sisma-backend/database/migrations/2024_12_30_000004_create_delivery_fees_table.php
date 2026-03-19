<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class CreateDeliveryFeesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('delivery_fees', function (Blueprint $table) {
            $table->increments('id');
            $table->string('commune'); // Nom de la commune
            $table->string('quartier')->nullable(); // Quartier spécifique (optionnel)
            $table->decimal('fee', 10, 2); // Frais de livraison en FCFA
            $table->integer('estimated_distance_km')->nullable(); // Distance estimée en km
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        
        // Insérer les frais par défaut pour les communes d'Abidjan
        $now = date('Y-m-d H:i:s');
        $communes = array(
            'Abobo' => 2000,
            'Adjamé' => 1500,
            'Attécoubé' => 2000,
            'Cocody' => 2500,
            'Koumassi' => 2000,
            'Marcory' => 2000,
            'Plateau' => 1500,
            'Port-Bouët' => 2500,
            'Treichville' => 1500,
            'Yopougon' => 3000,
        );
        
        foreach ($communes as $commune => $fee) {
            DB::table('delivery_fees')->insert(array(
                'commune' => $commune,
                'quartier' => null,
                'fee' => $fee,
                'estimated_distance_km' => null,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ));
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('delivery_fees');
    }
}

