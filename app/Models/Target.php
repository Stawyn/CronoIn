<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model: Target (Alvo)
 *
 * Representa um alvo a ser escaneado pelo sistema Vulnix.
 * Pode ser um site web, API ou recurso de rede.
 *
 * ┌─────────────────────────────────────────────┐
 * │ Relacionamentos:                            │
 * │ - hasMany Scan     (um target tem N scans)  │
 * │ - hasMany Vulnerabilidade (via scans)       │
 * └─────────────────────────────────────────────┘
 *
 * @property int    $id
 * @property string $url
 * @property string $descricao
 * @property string $tipo        (web|api|network)
 * @property bool   $ativo
 * @property string $created_at
 * @property string $updated_at
 * @property string $deleted_at
 */
class Target extends Model
{
    use SoftDeletes;

    /**
     * Campos que podem ser preenchidos via mass assignment.
     * Todos os outros campos são protegidos por padrão.
     */
    protected $fillable = [
        'url',
        'descricao',
        'tipo',
        'ativo',
        'cdn_info',
    ];

    /**
     * Casts automáticos para tipos PHP.
     * O Laravel converte esses campos automaticamente ao acessar.
     */
    protected $casts = [
        'ativo' => 'boolean',
        'cdn_info' => 'array',
    ];

    // ══════════════════════════════════════════
    // RELACIONAMENTOS
    // ══════════════════════════════════════════

    /**
     * Scans realizados neste target.
     */
    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }

    /**
     * Vulnerabilidades encontradas neste target (através dos scans).
     */
    public function vulnerabilidades(): HasMany
    {
        return $this->hasMany(Vulnerabilidade::class);
    }

    // ══════════════════════════════════════════
    // SCOPES (filtros reutilizáveis)
    // ══════════════════════════════════════════

    /**
     * Filtra apenas targets ativos.
     * Uso: Target::ativos()->get()
     */
    public function scopeAtivos($query)
    {
        return $query->where('ativo', true);
    }

    /**
     * Filtra por tipo de target.
     * Uso: Target::porTipo('web')->get()
     */
    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    // ══════════════════════════════════════════
    // ACCESSORS (campos computados)
    // ══════════════════════════════════════════

    /**
     * Retorna o último scan realizado neste target.
     */
    public function getUltimoScanAttribute(): ?Scan
    {
        return $this->scans()->latest()->first();
    }

    /**
     * Contagem de vulnerabilidades agrupadas por severidade.
     * Retorna array: ['critical' => 2, 'high' => 5, ...]
     */
    public function getVulnerabilidadesPorSeveridadeAttribute(): array
    {
        $contagem = $this->vulnerabilidades()
            ->selectRaw('severidade, COUNT(*) as total')
            ->groupBy('severidade')
            ->pluck('total', 'severidade')
            ->toArray();

        // Garante que todas as severidades existem no array
        return array_merge([
            'critical' => 0,
            'high'     => 0,
            'medium'   => 0,
            'low'      => 0,
            'info'     => 0,
        ], $contagem);
    }
}
