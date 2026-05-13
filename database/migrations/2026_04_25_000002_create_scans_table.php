<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Tabela de Scans (Varreduras)
 *
 * Armazena os registros de varreduras executadas contra os targets.
 * Cada scan pertence a um target e possui tipo, status e resultados.
 *
 * Relacionamentos:
 * - Um Scan pertence a um Target (N:1)
 * - Um Scan possui muitas Vulnerabilidades (1:N)
 *
 * Status possíveis:
 * - aguardando: scan criado, aguardando início
 * - em_progresso: scan em execução
 * - concluido: scan finalizado com sucesso
 * - falhou: scan falhou durante execução
 * - cancelado: scan cancelado pelo usuário
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scans', function (Blueprint $table) {
            $table->id();

            // ── Relacionamento ──
            $table->foreignId('target_id')
                ->constrained('targets')
                ->cascadeOnDelete()
                ->comment('Target associado a este scan');

            // ── Configuração do Scan ──
            $table->enum('tipo_scan', ['full', 'rapido', 'nuclei', 'nmap', 'subdomain'])
                ->comment('Tipo/perfil de scan a ser executado');

            $table->enum('status', ['aguardando', 'em_progresso', 'concluido', 'falhou', 'cancelado'])
                ->default('aguardando')
                ->comment('Status atual do scan');

            $table->json('configuracoes')
                ->nullable()
                ->comment('Configurações extras em JSON (parâmetros, flags, etc.)');

            $table->dateTime('agendamento')
                ->nullable()
                ->comment('Data/hora para agendamento futuro do scan');

            // ── Resultados ──
            $table->dateTime('iniciado_em')
                ->nullable()
                ->comment('Quando o scan começou a executar');

            $table->dateTime('finalizado_em')
                ->nullable()
                ->comment('Quando o scan terminou');

            $table->unsignedInteger('total_vulnerabilidades')
                ->default(0)
                ->comment('Contagem total de vulnerabilidades encontradas');

            $table->longText('resultado_bruto')
                ->nullable()
                ->comment('Output bruto da ferramenta de scan (Nuclei, Nmap, etc.)');

            // ── Timestamps ──
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scans');
    }
};
