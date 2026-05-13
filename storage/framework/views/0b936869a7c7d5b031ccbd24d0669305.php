<div>
<?php $__env->startSection('title', 'Vulnix - Scans'); ?>


<div class="ax-toolbar">
    <h1 class="ax-toolbar-title">
        <a href="<?php echo e(route('dashboard')); ?>" class="ax-toolbar-back"><i class="bi bi-chevron-left"></i></a>
        Scans
    </h1>
    <div class="ax-toolbar-actions">
        <a href="<?php echo e(route('scans.create')); ?>" class="ax-btn ax-btn-purple"><i class="bi bi-broadcast"></i> New Scan</a>
        <button class="ax-btn" wire:click="deleteSelected" onclick="return confirm('Remover?')"
            <?php if(empty($selected)): ?> disabled style="opacity:0.4;pointer-events:none" <?php endif; ?>>
            <i class="bi bi-trash3"></i> Delete Scans
        </button>
    </div>
</div>


<div class="ax-filter">
    <div class="ax-filter-input-wrap">
        <span class="ax-filter-icon"><i class="bi bi-funnel-fill"></i></span>
        <input type="text" class="ax-filter-input" placeholder="Filter" wire:model.live.debounce.300ms="search">
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($search): ?>
            <button class="ax-filter-clear" wire:click="$set('search', '')"><i class="bi bi-x"></i></button>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>
    <button class="ax-filter-columns" title="Columns"><i class="bi bi-layout-three-columns"></i></button>
</div>


<div class="ax-table-wrap">
    <table class="ax-table">
        <thead>
            <tr>
                <th><input type="checkbox" wire:model.live="selectAll"></th>
                <th>Target</th>
                <th>Target Description</th>
                <th>Scan Profile</th>
                <th>Schedule</th>
                <th>Vulnerabilities</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $scans; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $scan): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                <?php
                    $cls = match($scan->status) { 'concluido'=>'completed','em_progresso'=>'running','falhou'=>'failed','aguardando'=>'pending','cancelado'=>'cancelled',default=>'' };
                    $sv = $scan->vulnerabilidades()->selectRaw('severidade, COUNT(*) as total')->groupBy('severidade')->pluck('total','severidade')->toArray();
                    $sv = array_merge(['critical'=>0,'high'=>0,'medium'=>0,'low'=>0,'info'=>0], $sv);
                ?>
                <tr <?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::$currentLoop['key'] = 's-'.e($scan->id).''; ?>wire:key="s-<?php echo e($scan->id); ?>">
                    <td><input type="checkbox" value="<?php echo e($scan->id); ?>" wire:model.live="selected"></td>
                    <td><a href="<?php echo e(route('targets.edit', $scan->target_id)); ?>"><?php echo e($scan->target->url ?? 'N/A'); ?></a></td>
                    <td class="col-desc"><?php echo e($scan->target->descricao ?? ''); ?></td>
                    <td><?php echo e($scan->tipo_label); ?></td>
                    <td><?php echo e($scan->agendamento ? $scan->agendamento->format('M d, Y H:i') : '—'); ?></td>
                    <td>
                        <span class="ax-sevs">
                            <span class="ax-sev ax-sev-critical <?php echo e($sv['critical']==0?'zero':''); ?>"><?php echo e($sv['critical']); ?></span>
                            <span class="ax-sev ax-sev-high <?php echo e($sv['high']==0?'zero':''); ?>"><?php echo e($sv['high']); ?></span>
                            <span class="ax-sev ax-sev-medium <?php echo e($sv['medium']==0?'zero':''); ?>"><?php echo e($sv['medium']); ?></span>
                            <span class="ax-sev ax-sev-low <?php echo e($sv['low']==0?'zero':''); ?>"><?php echo e($sv['low']); ?></span>
                            <span class="ax-sev ax-sev-info <?php echo e($sv['info']==0?'zero':''); ?>"><?php echo e($sv['info']); ?></span>
                        </span>
                    </td>
                    <td>
                        <div class="ax-status ax-status-<?php echo e($cls); ?>"><?php echo e($scan->status_label); ?></div>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($scan->finalizado_em): ?>
                            <div class="ax-status-sub"><?php echo e($scan->finalizado_em->format('M d, Y, g:i:s A')); ?></div>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </td>
                </tr>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
                <tr><td colspan="7"><div class="ax-empty">No scans found.</div></td></tr>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </tbody>
    </table>

    <div class="ax-pagination">
        <span class="ax-page-info"><?php echo e($scans->total() > 0 ? $scans->firstItem().' to '.$scans->lastItem().' of '.$scans->total() : '0 of 0 of 0'); ?></span>
        <div class="ax-page-nav">
            <button class="ax-page-arrow" <?php if(!$scans->onFirstPage()): ?> wire:click="previousPage" <?php endif; ?>><i class="bi bi-chevron-left"></i></button>
            <span class="ax-page-num"><?php echo e($scans->currentPage()); ?></span>
            <button class="ax-page-arrow" <?php if(!$scans->hasMorePages()): ?> wire:click="nextPage" <?php endif; ?>><i class="bi bi-chevron-right"></i></button>
        </div>
        <span class="ax-page-size">20 <i class="bi bi-caret-down-fill" style="font-size:10px"></i></span>
    </div>
</div>
</div>
<?php /**PATH /app/resources/views/livewire/scan-index.blade.php ENDPATH**/ ?>