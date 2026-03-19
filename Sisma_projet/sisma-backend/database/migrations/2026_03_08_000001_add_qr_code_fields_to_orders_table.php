<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddQrCodeFieldsToOrdersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            // QR Code fields
            $table->string('qr_code', 255)->nullable()->after('total');
            $table->string('qr_code_security', 64)->nullable()->after('qr_code');
            $table->timestamp('qr_code_scanned_at')->nullable()->after('qr_code_security');
            $table->string('qr_code_scanned_by', 50)->nullable()->after('qr_code_scanned_at');
            $table->enum('delivery_confirmation_method', ['qr_scan', 'manual', 'auto'])->nullable()->after('qr_code_scanned_by');
            
            // Indexes pour performance
            $table->index('qr_code');
            $table->index('qr_code_security');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['qr_code']);
            $table->dropIndex(['qr_code_security']);
            $table->dropColumn([
                'qr_code',
                'qr_code_security',
                'qr_code_scanned_at',
                'qr_code_scanned_by',
                'delivery_confirmation_method'
            ]);
        });
    }
}
