<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Target;

/**
 * Componente Livewire: TargetForm
 *
 * Formulário para adicionar e editar targets.
 * Equivalente à página "Add Targets" do Acunetix.
 *
 * Suporta adicionar múltiplos targets de uma vez
 * (botão "Add another Target").
 */
class TargetForm extends Component
{
    /** ID do target sendo editado (null = criando novo) */
    public ?int $targetId = null;

    /** Lista de targets a serem criados (múltiplos) */
    public array $targets = [
        ['url' => '', 'descricao' => '', 'tipo' => 'web'],
    ];

    /** Flag para edição (modo edit vs create) */
    public bool $editing = false;

    /**
     * Inicialização: se receber ID, carrega o target para edição.
     */
    public function mount(?int $target = null): void
    {
        if ($target) {
            $this->targetId = $target;
            $this->editing = true;
            $model = Target::findOrFail($target);
            $this->targets = [[
                'url'       => $model->url,
                'descricao' => $model->descricao ?? '',
                'tipo'      => $model->tipo,
            ]];
        }
    }

    /**
     * Adiciona mais uma linha de target ao formulário.
     */
    public function addRow(): void
    {
        $this->targets[] = ['url' => '', 'descricao' => '', 'tipo' => 'web'];
    }

    /**
     * Remove uma linha do formulário.
     */
    public function removeRow(int $index): void
    {
        if (count($this->targets) > 1) {
            unset($this->targets[$index]);
            $this->targets = array_values($this->targets);
        }
    }

    /**
     * Regras de validação.
     */
    protected function rules(): array
    {
        $rules = [];
        foreach ($this->targets as $i => $t) {
            $rules["targets.{$i}.url"] = 'required|string|max:2048';
            $rules["targets.{$i}.descricao"] = 'nullable|string';
            $rules["targets.{$i}.tipo"] = 'required|in:web,api,network';
        }
        return $rules;
    }

    protected function messages(): array
    {
        return [
            'targets.*.url.required' => 'O endereço (URL) é obrigatório.',
        ];
    }

    /**
     * Salva os targets (create ou update).
     */
    public function save()
    {
        $this->validate();

        if ($this->editing && $this->targetId) {
            // Modo edição: atualiza o target existente
            $target = Target::findOrFail($this->targetId);
            $target->update($this->targets[0]);
            session()->flash('success', 'Target atualizado com sucesso.');
        } else {
            // Modo criação: cria todos os targets da lista
            foreach ($this->targets as $data) {
                Target::create([
                    'url'       => $data['url'],
                    'descricao' => $data['descricao'] ?: null,
                    'tipo'      => $data['tipo'],
                    'ativo'     => true,
                ]);
            }
            $count = count($this->targets);
            session()->flash('success', "{$count} target(s) criado(s) com sucesso.");
        }

        return $this->redirect(route('targets.index'), navigate: true);
    }

    public function render()
    {
        return view('livewire.target-form')
            ->layout('layouts.app');
    }
}
