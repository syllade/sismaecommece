<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddZoneToDeliveryPersonsTable extends Migration
{
    public function up()
    {
        Schema::table('delivery_persons', function (Blueprint $table) {
            $table->string('zone', 100)->nullable()->after('vehicle_type');
            $table->index('zone');
        });
    }

    public function down()
    {
        Schema::table('delivery_persons', function (Blueprint $table) {
            $table->dropIndex(['zone']);
            $table->dropColumn('zone');
        });
    }
}
