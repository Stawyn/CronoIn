<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Tabela de Vulnerabilidades
 *
 * Armazena as vulnerabilidades encontradas durante os scans.
 * Cada vulnerabilidade está vinculada a um scan e a um target.
 *
 * Severidades (seguindo padrão CVSS):
 * - critical: CVSS 9.0-10.0 (vermelho escuro)
 * - high: CVSS 7.0-8.9 (vermelho)
 * - medium: CVSS 4.0-6.9 (laranja)
 * - low: CVSS 0.1-3.9 (amarelo)
 * - info: CVSS 0.0 (azul/cinza)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vulnerabilidades', function (Blueprint $table) {
            $table->id();

            // ── Relacionamentos ──
            $table->foreignId('scan_id')
                ->constrained('scans')
                ->cascadeOnDelete();

            $table->foreignId('target_id')
                ->constrained('targets')
                ->cascadeOnDelete();

            // ── Dados da Vulnerabilidade ──
            $table->string('nome', 500)
                ->comment('Nome/título da vulnerabilidade');

            $table->text('descricao')
                ->nullable()
                ->comment('Descrição detalhada da vulnerabilidade');

            $table->enum('severidade', ['critical', 'high', 'medium', 'low', 'info'])
                ->comment('Nível de severidade seguindo padrão CVSS');

            $table->string('cve_id', 20)
                ->nullable()
                ->comment('Identificador CVE (ex: CVE-2024-1234)');

            $table->text('evidencia')
                ->nullable()
                ->comment('Evidência técnica (request/response, payload, etc.)');

            $table->string('url_afetada', 2048)
                ->nullable()
                ->comment('URL específica onde a vulnerabilidade foi encontrada');

            $table->text('sugestao_ia')
                ->nullable()
                ->comment('Sugestão de correção gerada pela IA (Ollama)');

            $table->boolean('falso_positivo')
                ->default(false)
                ->comment('Marcado como falso positivo pelo usuário');

            // ── Timestamps ──
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vulnerabilidades');
    }
};
