<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Target;
use App\Models\Scan;
use App\Models\Vulnerabilidade;

/**
 * Componente Livewire: Dashboard (Overview)
 *
 * Exibe métricas gerais, gráfico de vulnerabilidades por severidade,
 * e lista de scans recentes. Equivalente à página "Overview" do Acunetix.
 */
class Dashboard extends Component
{
    public function render()
    {
        // Contagens gerais
        $totalTargets = Target::count();
        $totalScans = Scan::count();
        $totalVulns = Vulnerabilidade::count();
        $scansAtivos = Scan::where('status', 'em_progresso')->count();

        // Vulnerabilidades por severidade (para gráfico)
        $vulnsPorSeveridade = Vulnerabilidade::selectRaw('severidade, COUNT(*) as total')
            ->groupBy('severidade')
            ->pluck('total', 'severidade')
            ->toArray();

        $severidades = array_merge([
            'critical' => 0, 'high' => 0, 'medium' => 0, 'low' => 0, 'info' => 0,
        ], $vulnsPorSeveridade);

        // Scans recentes (últimos 10)
        $scansRecentes = Scan::with('target')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return view('livewire.dashboard', compact(
            'totalTargets', 'totalScans', 'totalVulns', 'scansAtivos',
            'severidades', 'scansRecentes'
        ))->layout('layouts.app');
    }
}
