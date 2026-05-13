<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithPagination;
use App\Models\Scan;

/**
 * Componente Livewire: ScanIndex
 *
 * Listagem de scans com filtro, paginação e ações.
 * Equivalente à página "Scans" do Acunetix.
 */
class ScanIndex extends Component
{
    use WithPagination;

    public string $search = '';
    public array $selected = [];
    public bool $selectAll = false;
    public ?int $deletingId = null;

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function updatedSelectAll($value): void
    {
        if ($value) {
            $this->selected = $this->getScansQuery()->pluck('id')->map(fn($id) => (string) $id)->toArray();
        } else {
            $this->selected = [];
        }
    }

    public function confirmDelete(int $id): void
    {
        $this->deletingId = $id;
    }

    public function deleteScan(): void
    {
        if ($this->deletingId) {
            Scan::find($this->deletingId)?->delete();
            $this->deletingId = null;
            session()->flash('success', 'Scan removido com sucesso.');
        }
    }

    public function deleteSelected(): void
    {
        if (!empty($this->selected)) {
            Scan::whereIn('id', $this->selected)->delete();
            $this->selected = [];
            $this->selectAll = false;
            session()->flash('success', 'Scans selecionados foram removidos.');
        }
    }

    private function getScansQuery()
    {
        return Scan::with('target')
            ->when($this->search, function ($q) {
                $q->whereHas('target', function ($tq) {
                    $tq->where('url', 'like', "%{$this->search}%")
                       ->orWhere('descricao', 'like', "%{$this->search}%");
                });
            })
            ->orderByDesc('created_at');
    }

    public function render()
    {
        $scans = $this->getScansQuery()->paginate(20);

        return view('livewire.scan-index', ['scans' => $scans])
            ->layout('layouts.app');
    }
}
