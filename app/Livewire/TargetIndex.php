<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithPagination;
use App\Models\Target;
use Illuminate\Support\Facades\DB;

/**
 * Componente Livewire: TargetIndex
 *
 * Listagem de targets com filtro, paginação e ações em massa.
 * Equivalente à página "Targets" do Acunetix.
 *
 * Funcionalidades:
 * - Busca por URL ou descrição
 * - Paginação (20 por página)
 * - Seleção em massa com checkbox
 * - Exclusão individual e em massa
 */
class TargetIndex extends Component
{
    use WithPagination;

    /** Termo de busca para filtro */
    public string $search = '';

    /** IDs selecionados para ações em massa */
    public array $selected = [];

    /** Controle do select-all */
    public bool $selectAll = false;

    /** ID do target sendo deletado (para modal) */
    public ?int $deletingId = null;

    /**
     * Reset da paginação quando o filtro muda.
     */
    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    /**
     * Seleciona/deseleciona todos os targets da página.
     */
    public function updatedSelectAll($value): void
    {
        if ($value) {
            $this->selected = $this->getTargetsQuery()->pluck('id')->map(fn($id) => (string) $id)->toArray();
        } else {
            $this->selected = [];
        }
    }

    /**
     * Confirma exclusão de um target específico.
     */
    public function confirmDelete(int $id): void
    {
        $this->deletingId = $id;
        $this->dispatch('open-modal', id: 'delete-confirm');
    }

    /**
     * Executa a exclusão do target.
     */
    public function deleteTarget(): void
    {
        if ($this->deletingId) {
            $target = Target::find($this->deletingId);
            if ($target) {
                // Reset promoted status in discovered_assets
                DB::table('discovered_assets')
                    ->where('status', 'promoted')
                    ->where(function ($q) use ($target) {
                        $url = $target->url;
                        // Match by domain extracted from URL
                        $parsed = parse_url($url);
                        $host = $parsed['host'] ?? '';
                        if ($host) {
                            $q->where('domain', $host)
                              ->orWhere('subdomain', $host);
                        }
                    })
                    ->update(['status' => 'discovered']);

                $target->delete();
            }
            $this->deletingId = null;
            session()->flash('success', 'Target removido com sucesso.');
        }
    }

    /**
     * Exclui os targets selecionados em massa.
     */
    public function deleteSelected(): void
    {
        if (!empty($this->selected)) {
            // Get URLs before deleting to reset promoted status
            $targets = Target::whereIn('id', $this->selected)->get();
            foreach ($targets as $target) {
                $parsed = parse_url($target->url);
                $host = $parsed['host'] ?? '';
                if ($host) {
                    DB::table('discovered_assets')
                        ->where('status', 'promoted')
                        ->where(function ($q) use ($host) {
                            $q->where('domain', $host)
                              ->orWhere('subdomain', $host);
                        })
                        ->update(['status' => 'discovered']);
                }
            }

            Target::whereIn('id', $this->selected)->delete();
            $this->selected = [];
            $this->selectAll = false;
            session()->flash('success', 'Targets selecionados foram removidos.');
        }
    }

    /**
     * Query base para listar targets com filtro.
     */
    private function getTargetsQuery()
    {
        return Target::query()
            ->when($this->search, function ($q) {
                $q->where('url', 'like', "%{$this->search}%")
                  ->orWhere('descricao', 'like', "%{$this->search}%");
            })
            ->orderByDesc('created_at');
    }

    public function render()
    {
        $targets = $this->getTargetsQuery()->paginate(20);

        return view('livewire.target-index', ['targets' => $targets])
            ->layout('layouts.app');
    }
}
