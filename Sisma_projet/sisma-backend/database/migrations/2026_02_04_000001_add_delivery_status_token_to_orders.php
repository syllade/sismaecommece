<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddDeliveryStatusTokenToOrders extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_status_token', 64)->nullable()->after('status');
            $table->timestamp('delivery_status_token_expires_at')->nullable()->after('delivery_status_token');
            $table->timestamp('delivery_status_token_used_at')->nullable()->after('delivery_status_token_expires_at');
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
            $table->dropColumn([
                'delivery_status_token',
                'delivery_status_token_expires_at',
                'delivery_status_token_used_at',
            ]);
        });
    }
}
