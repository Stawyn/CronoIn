<div>
<?php $__env->startSection('title', $editing ? 'Vulnix - Edit Scan' : 'Vulnix - New Scan'); ?>


<div class="ax-toolbar">
    <h1 class="ax-toolbar-title">
        <a href="<?php echo e(route('scans.index')); ?>" class="ax-toolbar-back"><i class="bi bi-chevron-left"></i></a>
        <?php echo e($editing ? 'Edit Scan' : 'New Scan'); ?>

    </h1>
    <div class="ax-toolbar-actions">
        <button class="ax-btn ax-btn-green" wire:click="save" wire:loading.attr="disabled" wire:target="save">
            <span wire:loading.remove wire:target="save"><i class="bi bi-check-lg"></i> Save</span>
            <span wire:loading wire:target="save"><span class="disc-spinner"></span> Saving...</span>
        </button>
        <a href="<?php echo e(route('scans.index')); ?>" class="ax-btn">Cancel</a>
    </div>
</div>


<div class="ax-form-section">
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($errors->any()): ?>
        <div class="ax-alert ax-alert-danger" style="margin-bottom: 20px;">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $e): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?><div><?php echo e($e); ?></div><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?></div>
        </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="ax-form-row">
        <div class="ax-form-group" style="flex: 2;">
            <label>Target</label>
            <select class="ax-form-control <?php $__errorArgs = ['target_id'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" wire:model="target_id">
                <option value="">Select a target</option>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $targets; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $t): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                    <option value="<?php echo e($t->id); ?>"><?php echo e($t->url); ?> <?php echo e($t->descricao ? "({$t->descricao})" : ''); ?></option>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
            </select>
        </div>
        <div class="ax-form-group" style="flex: 1;">
            <label>Scan Profile</label>
            <select class="ax-form-control" wire:model="tipo_scan">
                <option value="full">Full Scan</option>
                <option value="rapido">Quick Scan</option>
                <option value="nuclei">Nuclei Scan</option>
                <option value="nmap">Nmap Scan</option>
                <option value="burp">Burp Suite Scan</option>
                <option value="subdomain">Subdomain Discovery</option>
            </select>
        </div>
        <div class="ax-form-group" style="flex: 1;">
            <label>Scheduled Scan (optional)</label>
            <input type="datetime-local" class="ax-form-control" wire:model="agendamento">
        </div>
    </div>
</div>
</div>
<?php /**PATH /app/resources/views/livewire/scan-form.blade.php ENDPATH**/ ?>