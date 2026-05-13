<div>
<?php $__env->startSection('title', 'Vulnix - Targets'); ?>


<div class="ax-toolbar">
    <h1 class="ax-toolbar-title">
        <a href="<?php echo e(route('dashboard')); ?>" class="ax-toolbar-back"><i class="bi bi-chevron-left"></i></a>
        Targets
    </h1>
    <div class="ax-toolbar-actions">
        <button class="ax-btn" wire:click="deleteSelected" onclick="return confirm('Remover selecionados?')"
            <?php if(empty($selected)): ?> disabled style="opacity:0.4;pointer-events:none" <?php endif; ?>>
            <i class="bi bi-trash3"></i> Delete
        </button>
        <a href="<?php echo e(route('scans.create')); ?>" class="ax-btn ax-btn-purple"><i class="bi bi-broadcast"></i> Scan</a>
    </div>
</div>


<div class="ax-filter">
    <div class="ax-filter-input-wrap">
        <span class="ax-filter-icon"><i class="bi bi-funnel-fill"></i></span>
        <input type="text" class="ax-filter-input" placeholder="Filter"
               wire:model.live.debounce.300ms="search">
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
                <th>Address</th>
                <th>Description</th>
                <th>Type</th>
                <th>Vulnerabilities</th>
                <th>Last Scan Status</th>
            </tr>
        </thead>
        <tbody>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $targets; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $target): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                <?php
                    $v = $target->vulnerabilidades_por_severidade;
                    $last = $target->ultimo_scan;
                ?>
                <tr <?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::$currentLoop['key'] = 't-'.e($target->id).''; ?>wire:key="t-<?php echo e($target->id); ?>">
                    <td><input type="checkbox" value="<?php echo e($target->id); ?>" wire:model.live="selected"></td>
                    <td>
                        <a href="<?php echo e(route('targets.edit', $target->id)); ?>"><?php echo e($target->url); ?></a>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($target->cdn_info && !empty($target->cdn_info['is_cdn'])): ?>
                            <span class="disc-badge disc-badge-cdn" style="font-size: 9px; vertical-align: middle; margin-left: 5px;">
                                <i class="bi bi-shield-exclamation"></i> <?php echo e($target->cdn_info['cdn_name'] ?? 'CDN'); ?>

                            </span>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </td>
                    <td class="col-desc"><?php echo e($target->descricao ?? ''); ?></td>
                    <td><?php echo e(ucfirst($target->tipo)); ?>/Network</td>
                    <td>
                        <span class="ax-sevs">
                            <span class="ax-sev ax-sev-critical <?php echo e($v['critical'] == 0 ? 'zero' : ''); ?>"><?php echo e($v['critical']); ?></span>
                            <span class="ax-sev ax-sev-high <?php echo e($v['high'] == 0 ? 'zero' : ''); ?>"><?php echo e($v['high']); ?></span>
                            <span class="ax-sev ax-sev-medium <?php echo e($v['medium'] == 0 ? 'zero' : ''); ?>"><?php echo e($v['medium']); ?></span>
                            <span class="ax-sev ax-sev-low <?php echo e($v['low'] == 0 ? 'zero' : ''); ?>"><?php echo e($v['low']); ?></span>
                            <span class="ax-sev ax-sev-info <?php echo e($v['info'] == 0 ? 'zero' : ''); ?>"><?php echo e($v['info']); ?></span>
                        </span>
                    </td>
                    <td>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($last): ?>
                            <?php $cls = match($last->status) { 'concluido'=>'completed','em_progresso'=>'running','falhou'=>'failed','aguardando'=>'pending','cancelado'=>'cancelled',default=>'' }; ?>
                            <div class="ax-status ax-status-<?php echo e($cls); ?>"><?php echo e($last->status_label); ?></div>
                            <div class="ax-status-sub">Last Scanned on <?php echo e($last->created_at->format('M d, Y, g:i:s A')); ?></div>
                        <?php else: ?>
                            <span style="color:var(--vx-text-muted)">—</span>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </td>
                </tr>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
                <tr><td colspan="6"><div class="ax-empty">No targets found. <a href="<?php echo e(route('targets.create')); ?>">Add a target</a>.</div></td></tr>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </tbody>
    </table>

    
    <div class="ax-pagination">
        <span class="ax-page-info"><?php echo e($targets->total() > 0 ? $targets->firstItem().' to '.$targets->lastItem().' of '.$targets->total() : '0 of 0 of 0'); ?></span>
        <div class="ax-page-nav">
            <button class="ax-page-arrow" <?php if(!$targets->onFirstPage()): ?> wire:click="previousPage" <?php endif; ?>><i class="bi bi-chevron-left"></i></button>
            <span class="ax-page-num"><?php echo e($targets->currentPage()); ?></span>
            <button class="ax-page-arrow" <?php if(!$targets->hasMorePages()): ?> wire:click="nextPage" <?php endif; ?>><i class="bi bi-chevron-right"></i></button>
        </div>
        <span class="ax-page-size">20 <i class="bi bi-caret-down-fill" style="font-size:10px"></i></span>
    </div>
    <?php echo $__env->make('livewire.partials.discovery-styles', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
</div>
<?php /**PATH /app/resources/views/livewire/target-index.blade.php ENDPATH**/ ?>