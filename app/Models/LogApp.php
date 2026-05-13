<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model: Log do Aplicativo
 *
 * Registra ações e eventos do sistema para auditoria.
 * Tabela append-only (não possui updated_at).
 */
class LogApp extends Model
{
    /**
     * Nome da tabela (não segue convenção plural do Laravel).
     */
    protected $table = 'logs_app';

    /**
     * Desabilita updated_at pois logs são append-only.
     */
    public $timestamps = false;

    protected $fillable = [
        'tipo',
        'entidade',
        'entidade_id',
        'acao',
        'descricao',
        'criticidade',
    ];
}
