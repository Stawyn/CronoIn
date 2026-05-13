<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds host_info JSON column to discovered_assets for IP intelligence
 * (country, ASN, ISP, CDN detection, hostname).
 * Adds cdn_info JSON column to targets to carry CDN badge info.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discovered_assets', function (Blueprint $table) {
            $table->json('host_info')->nullable()->after('metadata')
                ->comment('IP intelligence: country, ASN, ISP, CDN, hostname');
        });

        Schema::table('targets', function (Blueprint $table) {
            $table->json('cdn_info')->nullable()->after('tipo')
                ->comment('CDN/proxy detection info from discovery');
        });
    }

    public function down(): void
    {
        Schema::table('discovered_assets', function (Blueprint $table) {
            $table->dropColumn('host_info');
        });
        Schema::table('targets', function (Blueprint $table) {
            $table->dropColumn('cdn_info');
        });
    }
};
