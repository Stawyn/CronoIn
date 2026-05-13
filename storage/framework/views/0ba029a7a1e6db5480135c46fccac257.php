<div wire:poll.5s>
<?php $__env->startSection('title', 'Vulnix - Overview'); ?>

<div class="ax-dashboard">
    
    <div class="ax-dashboard-grid">
        <div class="ax-stat-card">
            <span class="ax-stat-icon" style="color:var(--vx-primary)"><i class="bi bi-bullseye"></i></span>
            <div class="ax-stat-value"><?php echo e($totalTargets); ?></div>
            <div class="ax-stat-label">Targets</div>
        </div>
        <div class="ax-stat-card">
            <span class="ax-stat-icon" style="color:var(--sev-info)"><i class="bi bi-broadcast"></i></span>
            <div class="ax-stat-value"><?php echo e($totalScans); ?></div>
            <div class="ax-stat-label">Total Scans</div>
        </div>
        <div class="ax-stat-card">
            <span class="ax-stat-icon" style="color:var(--sev-low)"><i class="bi bi-play-circle-fill"></i></span>
            <div class="ax-stat-value"><?php echo e($scansAtivos); ?></div>
            <div class="ax-stat-label">Running</div>
        </div>
        <div class="ax-stat-card">
            <span class="ax-stat-icon" style="color:var(--sev-critical)"><i class="bi bi-exclamation-triangle-fill"></i></span>
            <div class="ax-stat-value"><?php echo e($severidades['critical'] ?? 0); ?></div>
            <div class="ax-stat-label">Critical</div>
        </div>
        <div class="ax-stat-card">
            <span class="ax-stat-icon" style="color:var(--sev-high)"><i class="bi bi-exclamation-circle-fill"></i></span>
            <div class="ax-stat-value"><?php echo e($severidades['high'] ?? 0); ?></div>
            <div class="ax-stat-label">High</div>
        </div>
        <div class="ax-stat-card">
            <span class="ax-stat-icon" style="color:var(--sev-medium)"><i class="bi bi-exclamation-diamond-fill"></i></span>
            <div class="ax-stat-value"><?php echo e($severidades['medium'] ?? 0); ?></div>
            <div class="ax-stat-label">Medium</div>
        </div>
    </div>

    
    <div class="ax-charts-row">
        <div class="ax-chart-card">
            <h3>Vulnerabilities by Severity</h3>
            <div style="height: 180px; position: relative; width: 100%;">
                <canvas id="chartSev"></canvas>
            </div>
        </div>
        <div class="ax-chart-card">
            <h3>Scan Status</h3>
            <div style="height: 180px; position: relative; width: 100%;">
                <canvas id="chartStatus"></canvas>
            </div>
        </div>
    </div>

    
    <div class="ax-recent-card">
        <h3>Recent Scans</h3>
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($scansRecentes->isEmpty()): ?>
            <div class="ax-empty">No scans conducted.</div>
        <?php else: ?>
            <table class="ax-table">
                <thead>
                    <tr>
                        <th style="padding-left:20px">Target</th>
                        <th>Profile</th>
                        <th>Vulnerabilities</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $scansRecentes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $scan): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                        <?php $cls = match($scan->status) { 'concluido'=>'completed','em_progresso'=>'running','falhou'=>'failed','aguardando'=>'pending','cancelado'=>'cancelled',default=>'' }; ?>
                        <tr>
                            <td style="padding-left:20px">
                                <a href="<?php echo e(route('targets.index')); ?>"><?php echo e($scan->target->url ?? 'N/A'); ?></a>
                                <div class="ax-status-sub"><?php echo e(Str::limit($scan->target->descricao ?? '', 50)); ?></div>
                            </td>
                            <td><?php echo e($scan->tipo_label); ?></td>
                            <td><?php echo e($scan->total_vulnerabilidades); ?></td>
                            <td><span class="ax-status ax-status-<?php echo e($cls); ?>"><?php echo e($scan->status_label); ?></span></td>
                            <td style="color:var(--vx-text-muted)"><?php echo e($scan->created_at->format('M d, Y H:i')); ?></td>
                        </tr>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
                </tbody>
            </table>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>
</div>

<?php $__env->startPush('scripts'); ?>
<script>
window.vulnixDashboardConfig = {
    severities: [
        <?php echo e($severidades['critical'] ?? 0); ?>,
        <?php echo e($severidades['high'] ?? 0); ?>,
        <?php echo e($severidades['medium'] ?? 0); ?>,
        <?php echo e($severidades['low'] ?? 0); ?>,
        <?php echo e($severidades['info'] ?? 0); ?>,
    ],
    statuses: [
        <?php echo e(App\Models\Scan::where('status','concluido')->count()); ?>,
        <?php echo e(App\Models\Scan::where('status','em_progresso')->count()); ?>,
        <?php echo e(App\Models\Scan::where('status','falhou')->count()); ?>,
        <?php echo e(App\Models\Scan::where('status','aguardando')->count()); ?>,
        <?php echo e(App\Models\Scan::where('status','cancelado')->count()); ?>,
    ],
};

window.vulnixDashboardRender = function () {
    if (!window.Chart) return;

    const severityCanvas = document.getElementById('chartSev');
    const statusCanvas = document.getElementById('chartStatus');

    if (!severityCanvas || !statusCanvas) return;

    const getThemeColors = function () {
        const styles = getComputedStyle(document.documentElement);

        return {
            text: styles.getPropertyValue('--vx-text-dim').trim() || '#667085',
            grid: styles.getPropertyValue('--vx-border').trim() || '#eef1f6',
            primary: styles.getPropertyValue('--vx-primary').trim() || '#7c3aed',
            critical: styles.getPropertyValue('--sev-critical').trim() || '#d92d20',
            high: styles.getPropertyValue('--sev-high').trim() || '#f97316',
            medium: styles.getPropertyValue('--sev-medium').trim() || '#d49a00',
            low: styles.getPropertyValue('--sev-low').trim() || '#16a34a',
            info: styles.getPropertyValue('--sev-info').trim() || '#2563eb',
            neutral: styles.getPropertyValue('--vx-neutral-text').trim() || '#98a2b3',
        };
    };

    const themeColors = getThemeColors();

    Chart.getChart(severityCanvas)?.destroy();
    Chart.getChart(statusCanvas)?.destroy();

    const chartSev = new Chart(severityCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Critical','High','Medium','Low','Info'],
            datasets: [{ 
                data: window.vulnixDashboardConfig.severities,
                backgroundColor: [themeColors.critical, themeColors.high, themeColors.medium, themeColors.low, themeColors.info],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { family: 'Inter', size: 12 }, color: themeColors.text, padding: 14 } } } }
    });
    const chartStatus = new Chart(statusCanvas, {
        type: 'bar',
        data: {
            labels: ['Completed','Running','Failed','Pending','Cancelled'],
            datasets: [{ 
                data: window.vulnixDashboardConfig.statuses,
                backgroundColor: [themeColors.low, themeColors.primary, themeColors.critical, themeColors.medium, themeColors.neutral],
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: themeColors.text, font: { family: 'Inter', size: 11 } }, grid: { color: themeColors.grid } }, y: { beginAtZero: true, ticks: { stepSize: 1, color: themeColors.text, font: { family: 'Inter', size: 11 } }, grid: { color: themeColors.grid } } } }
    });

    window.vulnixDashboardCharts = { chartSev, chartStatus, getThemeColors };
};

window.vulnixDashboardRender();

if (!window.vulnixDashboardListenersBound) {
    window.vulnixDashboardListenersBound = true;
    document.addEventListener('DOMContentLoaded', () => window.vulnixDashboardRender?.());
    document.addEventListener('livewire:navigated', () => window.vulnixDashboardRender?.());
    window.addEventListener('vulnix-theme-change', function () {
        const dashboard = window.vulnixDashboardCharts;
        if (!dashboard) return;

        const colors = dashboard.getThemeColors();
        const { chartSev, chartStatus } = dashboard;

        chartSev.options.plugins.legend.labels.color = colors.text;
        chartStatus.options.scales.x.ticks.color = colors.text;
        chartStatus.options.scales.y.ticks.color = colors.text;
        chartStatus.options.scales.x.grid.color = colors.grid;
        chartStatus.options.scales.y.grid.color = colors.grid;
        chartSev.data.datasets[0].backgroundColor = [colors.critical, colors.high, colors.medium, colors.low, colors.info];
        chartStatus.data.datasets[0].backgroundColor = [colors.low, colors.primary, colors.critical, colors.medium, colors.neutral];

        chartSev.update();
        chartStatus.update();
    });
}
</script>
<?php $__env->stopPush(); ?>
</div>
<?php /**PATH /app/resources/views/livewire/dashboard.blade.php ENDPATH**/ ?>