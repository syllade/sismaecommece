<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateDriverRateLimitsTable extends Migration
{
    public function up()
    {
        Schema::create('rate_limits', function (Blueprint $table) {
            $table->increments('id');
            $table->string('key', 255)->unique();
            $table->timestamps();
            
            $table->index('key');
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('rate_limits');
    }
}
