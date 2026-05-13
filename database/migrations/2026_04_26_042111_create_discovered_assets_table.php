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
        Schema::create('discovered_assets', function (Blueprint $table) {
            $table->id();
            $table->string('domain')->index();
            $table->string('subdomain')->nullable();
            $table->string('ip')->nullable();
            $table->string('port')->nullable();
            $table->string('service')->nullable();
            $table->enum('status', ['discovered', 'ignored', 'promoted'])->default('discovered');
            $table->json('metadata')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discovered_assets');
    }
};
