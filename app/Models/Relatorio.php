<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model: Relatório
 *
 * Relatórios gerados a partir dos resultados dos scans.
 */
class Relatorio extends Model
{
    protected $fillable = [
        'scan_id',
        'titulo',
        'formato',
        'caminho_arquivo',
    ];

    public function scan(): BelongsTo
    {
        return $this->belongsTo(Scan::class);
    }
}
