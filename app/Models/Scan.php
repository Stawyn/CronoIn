<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model: Scan (Varredura)
 *
 * Representa uma varredura de segurança executada contra um target.
 * Cada scan usa uma ferramenta específica (Nuclei, Nmap, etc).
 *
 * ┌──────────────────────────────────────────────────────┐
 * │ Relacionamentos:                                     │
 * │ - belongsTo Target  (cada scan pertence a 1 target)  │
 * │ - hasMany Vulnerabilidade (1 scan = N vulns)         │
 * └──────────────────────────────────────────────────────┘
 *
 * @property int      $id
 * @property int      $target_id
 * @property string   $tipo_scan       (full|rapido|nuclei|nmap|subdomain)
 * @property string   $status          (aguardando|em_progresso|concluido|falhou|cancelado)
 * @property array    $configuracoes
 * @property DateTime $agendamento
 * @property DateTime $iniciado_em
 * @property DateTime $finalizado_em
 * @property int      $total_vulnerabilidades
 * @property string   $resultado_bruto
 */
class Scan extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'target_id',
        'tipo_scan',
        'status',
        'configuracoes',
        'agendamento',
        'iniciado_em',
        'finalizado_em',
        'total_vulnerabilidades',
        'resultado_bruto',
    ];

    protected $casts = [
        'configuracoes'  => 'array',
        'agendamento'    => 'datetime',
        'iniciado_em'    => 'datetime',
        'finalizado_em'  => 'datetime',
    ];

    // ══════════════════════════════════════════
    // CONSTANTES — Mapeamento de status → cor CSS
    // ══════════════════════════════════════════

    /**
     * Cores para cada status (usadas nos badges da UI).
     * Mapeia status → classe CSS Bootstrap.
     */
    public const STATUS_CORES = [
        'aguardando'   => 'warning',    // amarelo
        'em_progresso' => 'primary',    // azul
        'concluido'    => 'success',    // verde
        'falhou'       => 'danger',     // vermelho
        'cancelado'    => 'secondary',  // cinza
    ];

    /**
     * Labels legíveis para cada status.
     */
    public const STATUS_LABELS = [
        'aguardando'   => 'Aguardando',
        'em_progresso' => 'Em Progresso',
        'concluido'    => 'Concluído',
        'falhou'       => 'Falhou',
        'cancelado'    => 'Cancelado',
    ];

    /**
     * Labels legíveis para tipos de scan.
     */
    public const TIPO_LABELS = [
        'full'      => 'Full Scan',
        'rapido'    => 'Quick Scan',
        'nuclei'    => 'Nuclei Scan',
        'nmap'      => 'Nmap Scan',
        'subdomain' => 'Subdomain Discovery',
    ];

    // ══════════════════════════════════════════
    // RELACIONAMENTOS
    // ══════════════════════════════════════════

    public function target(): BelongsTo
    {
        return $this->belongsTo(Target::class);
    }

    public function vulnerabilidades(): HasMany
    {
        return $this->hasMany(Vulnerabilidade::class);
    }

    // ══════════════════════════════════════════
    // ACCESSORS
    // ══════════════════════════════════════════

    /**
     * Retorna a classe CSS Bootstrap para o badge de status.
     * Uso no Blade: <span class="badge bg-{{ $scan->status_cor }}">
     */
    public function getStatusCorAttribute(): string
    {
        return self::STATUS_CORES[$this->status] ?? 'secondary';
    }

    /**
     * Retorna o label legível do status.
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    /**
     * Retorna o label legível do tipo de scan.
     */
    public function getTipoLabelAttribute(): string
    {
        return self::TIPO_LABELS[$this->tipo_scan] ?? $this->tipo_scan;
    }

    /**
     * Calcula a duração do scan em formato legível.
     * Retorna null se o scan ainda não terminou.
     */
    public function getDuracaoAttribute(): ?string
    {
        if (!$this->iniciado_em || !$this->finalizado_em) {
            return null;
        }

        $diff = $this->iniciado_em->diff($this->finalizado_em);

        if ($diff->h > 0) {
            return $diff->format('%hh %im %ss');
        }

        return $diff->format('%im %ss');
    }

    // ══════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════

    public function scopeRecentes($query, int $limit = 10)
    {
        return $query->orderByDesc('created_at')->limit($limit);
    }

    public function scopePorStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
