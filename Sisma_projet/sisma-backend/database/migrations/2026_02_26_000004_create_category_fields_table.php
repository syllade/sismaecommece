<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateCategoryFieldsTable extends Migration
{
    /**
     * Run the migrations.
     * Dynamic fields for product categories (e.g., brand, material, size guide)
     */
    public function up()
    {
        Schema::create('category_fields', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('category_id');
            $table->string('name'); // Field name (e.g., "Marque", "Matière")
            $table->string('slug'); // Field identifier (e.g., "brand", "material")
            $table->string('type'); // text, number, select, multi_select, boolean, file
            $table->text('options')->nullable(); // JSON for select options
            $table->boolean('is_required')->default(false);
            $table->boolean('is_filterable')->default(false);
            $table->integer('position')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('cascade');

            $table->unique(['category_id', 'slug']);
            $table->index(['category_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('category_fields');
    }
}
