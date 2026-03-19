<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddInvoiceNumberToOrdersTable extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('invoice_number', 50)->nullable()->unique()->after('order_number');
            $table->boolean('is_locked')->default(false)->after('invoice_number');
            $table->timestamp('locked_at')->nullable()->after('is_locked');
            $table->string('lock_reason')->nullable()->after('locked_at');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['invoice_number', 'is_locked', 'locked_at', 'lock_reason']);
        });
    }
}
