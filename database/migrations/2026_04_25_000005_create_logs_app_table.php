<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Tabela de Logs do Aplicativo
 *
 * Registra todas as ações realizadas no sistema para auditoria.
 * Cada log contém tipo, entidade afetada, ação e criticidade.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logs_app', function (Blueprint $table) {
            $table->id();

            $table->string('tipo', 30)
                ->comment('Tipo do log: sistema, usuario, scan, etc.');

            $table->string('entidade', 100)
                ->nullable()
                ->comment('Entidade afetada: target, scan, vulnerabilidade, etc.');

            $table->unsignedBigInteger('entidade_id')
                ->nullable()
                ->comment('ID da entidade afetada');

            $table->string('acao', 50)
                ->comment('Ação realizada: criar, editar, deletar, iniciar, etc.');

            $table->text('descricao')
                ->nullable()
                ->comment('Descrição detalhada do evento');

            $table->enum('criticidade', ['debug', 'info', 'warning', 'error', 'critical'])
                ->default('info')
                ->comment('Nível de criticidade do log');

            $table->timestamp('created_at')
                ->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logs_app');
    }
};
