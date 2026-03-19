<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrderNotificationsTable extends Migration
{
    public function up()
    {
        Schema::create('order_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('type'); // whatsapp, email, sms
            $table->string('status'); // pending, sent, failed
            $table->text('message')->nullable();
            $table->string('recipient')->nullable(); // phone or email
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->index(['order_id', 'type']);
            $table->index(['status', 'sent_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('order_notifications');
    }
}
