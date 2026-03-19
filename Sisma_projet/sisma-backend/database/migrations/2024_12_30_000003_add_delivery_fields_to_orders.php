<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddDeliveryFieldsToOrders extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            // Ajouter l'ID du livreur assigné
            $table->integer('delivery_person_id')->unsigned()->nullable()->after('delivery_date');
            $table->foreign('delivery_person_id')->references('id')->on('delivery_persons')->onDelete('set null');
            
            // Ajouter la commune pour le calcul des frais
            $table->string('commune')->nullable()->after('customer_location');
            
            // Ajouter le quartier pour plus de précision
            $table->string('quartier')->nullable()->after('commune');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['delivery_person_id']);
            $table->dropColumn(['delivery_person_id', 'commune', 'quartier']);
        });
    }
}

