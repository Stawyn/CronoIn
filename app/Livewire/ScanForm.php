<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Scan;
use App\Models\Target;

/**
 * Componente Livewire: ScanForm
 *
 * Formulário para criar e editar scans.
 * Permite selecionar target, tipo de scan e agendamento.
 */
class ScanForm extends Component
{
    public ?int $scanId = null;
    public bool $editing = false;

    public string $target_id = '';
    public string $tipo_scan = 'full';
    public string $agendamento = '';

    public function mount(?int $scan = null): void
    {
        if ($scan) {
            $this->scanId = $scan;
            $this->editing = true;
            $model = Scan::findOrFail($scan);
            $this->target_id = (string) $model->target_id;
            $this->tipo_scan = $model->tipo_scan;
            $this->agendamento = $model->agendamento?->format('Y-m-d\TH:i') ?? '';
        }
    }

    protected function rules(): array
    {
        return [
            'target_id' => 'required|exists:targets,id',
            'tipo_scan' => 'required|in:full,rapido,nuclei,nmap,subdomain,burp',
            'agendamento' => 'nullable|date',
        ];
    }

    protected function messages(): array
    {
        return [
            'target_id.required' => 'Selecione um target para o scan.',
            'target_id.exists'   => 'O target selecionado não existe.',
        ];
    }

    public function save()
    {
        $this->validate();

        $data = [
            'target_id'   => $this->target_id,
            'tipo_scan'   => $this->tipo_scan,
            'status'      => 'aguardando',
            'agendamento' => $this->agendamento ?: null,
        ];

        if ($this->editing && $this->scanId) {
            Scan::findOrFail($this->scanId)->update($data);
            session()->flash('success', 'Scan atualizado com sucesso.');
        } else {
            Scan::create($data);
            session()->flash('success', 'Scan criado com sucesso.');
        }

        return $this->redirect(route('scans.index'), navigate: true);
    }

    public function render()
    {
        $targets = Target::where('ativo', true)->orderBy('url')->get();

        return view('livewire.scan-form', ['targets' => $targets])
            ->layout('layouts.app');
    }
}
