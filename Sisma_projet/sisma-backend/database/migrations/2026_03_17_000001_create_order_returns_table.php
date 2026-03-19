<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_returns', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('order_id');
            $table->unsignedInteger('order_item_id')->nullable();
            $table->unsignedInteger('user_id')->nullable(); // Client
            $table->unsignedInteger('supplier_id')->nullable();
            $table->string('reason'); // Motif du retour
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'refunded', 'completed'])
                  ->default('pending');
            $table->text('admin_notes')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');

            $table->index(['order_id']);
            $table->index(['status']);
            $table->index(['supplier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_returns');
    }
};
