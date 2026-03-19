<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddOrderWorkflowAndProofFields extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'customer_user_id')) {
                $table->integer('customer_user_id')->unsigned()->nullable()->after('customer_phone');
            }
            if (!Schema::hasColumn('orders', 'supplier_status')) {
                $table->string('supplier_status', 20)->default('pending')->after('status');
            }
            if (!Schema::hasColumn('orders', 'delivery_status')) {
                $table->string('delivery_status', 20)->default('pending')->after('supplier_status');
            }
            if (!Schema::hasColumn('orders', 'delivered_at')) {
                $table->dateTime('delivered_at')->nullable()->after('delivery_status');
            }
            if (!Schema::hasColumn('orders', 'delivery_proof_photo')) {
                $table->string('delivery_proof_photo')->nullable()->after('delivered_at');
            }
            if (!Schema::hasColumn('orders', 'delivery_proof_signature')) {
                $table->text('delivery_proof_signature')->nullable()->after('delivery_proof_photo');
            }
            if (!Schema::hasColumn('orders', 'delivery_notes')) {
                $table->text('delivery_notes')->nullable()->after('delivery_proof_signature');
            }
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'delivery_notes')) {
                $table->dropColumn('delivery_notes');
            }
            if (Schema::hasColumn('orders', 'delivery_proof_signature')) {
                $table->dropColumn('delivery_proof_signature');
            }
            if (Schema::hasColumn('orders', 'delivery_proof_photo')) {
                $table->dropColumn('delivery_proof_photo');
            }
            if (Schema::hasColumn('orders', 'delivered_at')) {
                $table->dropColumn('delivered_at');
            }
            if (Schema::hasColumn('orders', 'delivery_status')) {
                $table->dropColumn('delivery_status');
            }
            if (Schema::hasColumn('orders', 'supplier_status')) {
                $table->dropColumn('supplier_status');
            }
            if (Schema::hasColumn('orders', 'customer_user_id')) {
                $table->dropColumn('customer_user_id');
            }
        });
    }
}
