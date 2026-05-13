<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Tabela de Relatórios
 *
 * Armazena relatórios gerados a partir dos scans.
 * Cada relatório pode estar vinculado a um scan específico.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relatorios', function (Blueprint $table) {
            $table->id();

            $table->foreignId('scan_id')
                ->nullable()
                ->constrained('scans')
                ->nullOnDelete();

            $table->string('titulo', 255)
                ->comment('Título do relatório');

            $table->enum('formato', ['pdf', 'html', 'json', 'csv'])
                ->default('pdf')
                ->comment('Formato do arquivo do relatório');

            $table->string('caminho_arquivo', 500)
                ->comment('Caminho do arquivo no filesystem');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relatorios');
    }
};
