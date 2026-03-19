<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateReviewsTables extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Reviews table
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('user_name');
            $table->tinyInteger('rating')->between(1, 5);
            $table->text('comment')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('product_id');
            $table->index('supplier_id');
            $table->index('user_id');
            $table->index('order_id');
        });

        // Product reviews summary (cache)
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->unique();
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->integer('five_stars')->default(0);
            $table->integer('four_stars')->default(0);
            $table->integer('three_stars')->default(0);
            $table->integer('two_stars')->default(0);
            $table->integer('one_star')->default(0);
            $table->timestamps();
            
            $table->index('avg_rating');
        });

        // Supplier reviews summary (cache)
        Schema::create('supplier_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id')->unique();
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->timestamps();
            
            $table->index('avg_rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('supplier_reviews');
        Schema::dropIfExists('product_reviews');
        Schema::dropIfExists('reviews');
    }
}
