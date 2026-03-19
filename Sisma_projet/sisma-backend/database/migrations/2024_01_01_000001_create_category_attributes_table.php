<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('category_attributes', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('category_id');
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('type', ['text', 'number', 'select', 'multiselect', 'textarea', 'date', 'boolean', 'file'])->default('text');
            $table->boolean('required')->default(false);
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable();
            $table->json('options')->nullable();
            $table->json('validation')->nullable();
            $table->string('default_value')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['category_id', 'slug']);
            $table->index(['category_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_attributes');
    }
};
