<div>
<?php $__env->startSection('title', $editing ? 'Vulnix - Edit Target' : 'Vulnix - New Target'); ?>


<div class="ax-toolbar">
    <h1 class="ax-toolbar-title">
        <a href="<?php echo e(route('targets.index')); ?>" class="ax-toolbar-back"><i class="bi bi-chevron-left"></i></a>
        <?php echo e($editing ? 'Edit Target' : 'New Target'); ?>

    </h1>
    <div class="ax-toolbar-actions">
        <button class="ax-btn ax-btn-purple" wire:click="save" wire:loading.attr="disabled" wire:target="save">
            <span wire:loading.remove wire:target="save"><i class="bi bi-check-lg"></i> Save Target</span>
            <span wire:loading wire:target="save"><span class="disc-spinner"></span> Saving...</span>
        </button>
        <a href="<?php echo e(route('targets.index')); ?>" class="ax-btn">Cancel</a>
    </div>
</div>


<div class="ax-form-section">
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($errors->any()): ?>
        <div class="ax-alert ax-alert-danger" style="margin-bottom: 20px;">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $e): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?><div><?php echo e($e); ?></div><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?></div>
        </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="ax-form-group">
        <label>Target Address</label>
        <input type="text" class="ax-form-control <?php $__errorArgs = ['targets.0.url'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>"
               wire:model="targets.0.url"
               style="padding: 14px; font-size: 15px;"
               placeholder="http://example.com/">
        <div style="margin-top: 10px; font-size: 13px; color: var(--vx-text-dim); line-height: 1.6;">
            <code>http://example.com/</code> will scan all of <code>http://example.com/</code><br>
            <code>http://example.com/dir/</code> will only scan paths under <code>http://example.com/dir/</code>
        </div>
    </div>

    <div class="ax-form-group" style="margin-bottom: 0;">
        <label>Description</label>
        <input type="text" class="ax-form-control"
               wire:model="targets.0.descricao"
               style="padding: 14px; font-size: 15px;"
               placeholder="Optional description to identify this target">
    </div>
</div>
</div>
<?php /**PATH /app/resources/views/livewire/target-form.blade.php ENDPATH**/ ?>