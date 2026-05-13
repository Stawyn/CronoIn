<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model: Vulnerabilidade
 *
 * Representa uma vulnerabilidade encontrada durante um scan.
 * Segue o padrão CVSS para classificação de severidade.
 *
 * @property int    $id
 * @property int    $scan_id
 * @property int    $target_id
 * @property string $nome
 * @property string $descricao
 * @property string $severidade   (critical|high|medium|low|info)
 * @property string $cve_id
 * @property string $evidencia
 * @property string $url_afetada
 * @property string $sugestao_ia
 * @property bool   $falso_positivo
 */
class Vulnerabilidade extends Model
{
    protected $fillable = [
        'scan_id',
        'target_id',
        'nome',
        'descricao',
        'severidade',
        'cve_id',
        'evidencia',
        'url_afetada',
        'sugestao_ia',
        'falso_positivo',
    ];

    protected $casts = [
        'falso_positivo' => 'boolean',
    ];

    /**
     * Cores para badges de severidade na UI.
     * Seguem o padrão visual do Acunetix.
     */
    public const SEVERIDADE_CORES = [
        'critical' => '#c62828', // vermelho escuro
        'high'     => '#e53935', // vermelho
        'medium'   => '#f57c00', // laranja
        'low'      => '#fdd835', // amarelo
        'info'     => '#90a4ae', // cinza azulado
    ];

    public const SEVERIDADE_LABELS = [
        'critical' => 'Crítico',
        'high'     => 'Alto',
        'medium'   => 'Médio',
        'low'      => 'Baixo',
        'info'     => 'Info',
    ];

    // ══════════════════════════════════════════
    // RELACIONAMENTOS
    // ══════════════════════════════════════════

    public function scan(): BelongsTo
    {
        return $this->belongsTo(Scan::class);
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(Target::class);
    }

    // ══════════════════════════════════════════
    // ACCESSORS
    // ══════════════════════════════════════════

    public function getSeveridadeCorAttribute(): string
    {
        return self::SEVERIDADE_CORES[$this->severidade] ?? '#90a4ae';
    }

    public function getSeveridadeLabelAttribute(): string
    {
        return self::SEVERIDADE_LABELS[$this->severidade] ?? $this->severidade;
    }
}
