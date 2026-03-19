<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class SoftdeletesAndWallet extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Add soft deletes to existing tables
        Schema::table('products', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('marketing_campaigns', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->softDeletes();
            $table->decimal('wallet_balance', 12, 2)->default(0)->after('advertising_balance');
            $table->integer('data_retention_days')->default(730)->after('wallet_balance'); // 24 months
        });

        // Supplier wallet transactions
        Schema::create('supplier_wallet_transactions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('type'); // commission, payout_request, payout, refund, deposit, adjustment
            $table->decimal('amount', 12, 2);
            $table->string('reference_type')->nullable();
            $table->unsignedInteger('reference_id')->nullable();
            $table->string('status')->default('pending'); // pending, completed, failed, rejected
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'created_at']);
            $table->index(['type', 'status']);
        });

        // Supplier payouts
        Schema::create('supplier_payouts', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->decimal('amount', 12, 2);
            $table->string('payment_method'); // mobile_money, bank_transfer, cash
            $table->json('payment_details')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected, paid, failed
            $table->unsignedInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedInteger('rejected_by')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->string('transaction_id')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['status', 'created_at']);
        });

        // Add commission fields to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('commission_deducted')->default(false)->after('delivery_time');
            $table->decimal('commission_amount', 10, 2)->nullable()->after('commission_deducted');
            $table->decimal('commission_rate', 5, 2)->nullable()->after('commission_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['commission_deducted', 'commission_amount', 'commission_rate']);
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['wallet_balance', 'data_retention_days']);
        });

        Schema::dropIfExists('supplier_payouts');
        Schema::dropIfExists('supplier_wallet_transactions');

        Schema::table('products', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('marketing_campaigns', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}
