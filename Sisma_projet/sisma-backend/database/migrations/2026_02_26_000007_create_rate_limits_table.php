<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateRateLimitsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('rate_limits', function (Blueprint $table) {
            $table->string('key_hash', 64)->primary();
            $table->integer('count')->default(1);
            $table->timestamp('expires_at');
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('rate_limits');
    }
}
