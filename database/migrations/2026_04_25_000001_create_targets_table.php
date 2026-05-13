<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Tabela de Targets (Alvos)
 *
 * Armazena os alvos que serão escaneados pelo Vulnix.
 * Cada target possui uma URL, descrição, tipo e status ativo/inativo.
 *
 * Relacionamentos:
 * - Um Target possui muitos Scans (1:N)
 * - Um Target possui muitas Vulnerabilidades (1:N)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('targets', function (Blueprint $table) {
            $table->id(); // BIGINT UNSIGNED AUTO_INCREMENT

            // ── Dados Principais ──
            $table->string('url', 2048)
                ->comment('URL do alvo a ser escaneado');

            $table->text('descricao')
                ->nullable()
                ->comment('Descrição opcional do alvo');

            $table->enum('tipo', ['web', 'api', 'network'])
                ->default('web')
                ->comment('Tipo do alvo: web, api ou network');

            // ── Status ──
            $table->boolean('ativo')
                ->default(true)
                ->comment('Se o target está ativo para scans');

            // ── Timestamps ──
            $table->timestamps(); // created_at, updated_at
            $table->softDeletes(); // deleted_at (para exclusão lógica)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('targets');
    }
};
