<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddVariantsToProducts extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'colors')) {
                $table->text('colors')->nullable()->after('images');
            }
            if (!Schema::hasColumn('products', 'sizes')) {
                $table->text('sizes')->nullable()->after('colors');
            }
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'colors')) {
                $table->dropColumn('colors');
            }
            if (Schema::hasColumn('products', 'sizes')) {
                $table->dropColumn('sizes');
            }
        });
    }
}
