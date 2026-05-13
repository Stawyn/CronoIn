<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Vulnix - Plataforma de Análise de Vulnerabilidades">
    <meta name="color-scheme" content="light dark">
    <title><?php echo $__env->yieldContent('title', 'Vulnix'); ?></title>

    <script>
        (function () {
            const savedTheme = localStorage.getItem('vulnix-theme');
            document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
        })();
    </script>

    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.js']); ?>

    <?php echo \Livewire\Mechanisms\FrontendAssets\FrontendAssets::styles(); ?>

</head>
<body>

    
    <nav class="ax-topbar">
        <div class="ax-topbar-left">
            <a href="<?php echo e(route('dashboard')); ?>" class="ax-brand-link">
                <img src="<?php echo e(\Illuminate\Support\Facades\Vite::asset('resources/images/logo.png')); ?>" alt="Vulnix Logo" class="ax-brand-logo">
                <div class="ax-brand-text-wrap">
                    <span class="ax-brand-name">VULNIX</span>
                    <span class="ax-brand-sub">Advanced Security Scanner</span>
                </div>
            </a>
        </div>
        <div class="ax-topbar-right">
            <button type="button" class="ax-theme-toggle" data-theme-toggle title="Alternar tema" aria-label="Alternar tema">
                <i class="bi bi-moon-stars" data-theme-icon></i>
                <span data-theme-label>Dark</span>
            </button>
        </div>
    </nav>

    
    <div class="ax-layout">

        
        <aside class="ax-sidebar" x-data="{ openTargets: <?php echo e(request()->routeIs('targets.*') ? 'true' : 'false'); ?> }">
            <nav class="ax-nav">
                <ul class="ax-nav-list">
                    
                    <li class="ax-nav-item">
                        <a href="<?php echo e(route('dashboard')); ?>" class="ax-nav-link <?php echo e(request()->routeIs('dashboard') ? 'active' : ''); ?>">
                            <i class="bi bi-grid-3x3-gap"></i> <span>Overview</span>
                        </a>
                    </li>

                    
                    <li class="ax-nav-item">
                        <a href="<?php echo e(route('discovery')); ?>" class="ax-nav-link <?php echo e(request()->routeIs('discovery') ? 'active' : ''); ?>">
                            <i class="bi bi-search"></i> <span>Discovery</span>
                        </a>
                    </li>

                    
                    <li class="ax-nav-item" style="position: relative;">
                        <a href="<?php echo e(route('targets.index')); ?>" class="ax-nav-link <?php echo e(request()->routeIs('targets.*') ? 'active' : ''); ?>">
                            <i class="bi bi-bullseye"></i> <span>Targets</span>
                        </a>
                        <a href="<?php echo e(route('targets.create')); ?>" class="ax-nav-plus" title="New Target" style="position: absolute; right: 25px; top: 12px; font-size: 16px; color: var(--vx-text-muted); z-index: 10;">
                            <i class="bi bi-plus"></i>
                        </a>
                    </li>


                    
                    <li class="ax-nav-item">
                        <a href="<?php echo e(route('scans.index')); ?>" class="ax-nav-link <?php echo e(request()->routeIs('scans.*') ? 'active' : ''); ?>">
                            <i class="bi bi-broadcast"></i> <span>Scans</span>
                        </a>
                    </li>

                    
                    <li class="ax-nav-item">
                        <a href="#" class="ax-nav-link">
                            <i class="bi bi-shield-exclamation"></i> <span>Vulnerabilities</span>
                        </a>
                    </li>

                    
                    <li class="ax-nav-item">
                        <a href="#" class="ax-nav-link">
                            <i class="bi bi-file-earmark-text"></i> <span>Reports</span>
                        </a>
                    </li>

                </ul>
            </nav>


        </aside>

        
        <main class="ax-content">
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('success')): ?>
                <div class="ax-alert ax-alert-success" x-data="{ show: true }" x-show="show">
                    <i class="bi bi-check-circle-fill"></i>
                    <?php echo e(session('success')); ?>

                    <button class="ax-alert-dismiss" @click="show = false">&times;</button>
                </div>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

            <?php echo e($slot); ?>

        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <?php echo \Livewire\Mechanisms\FrontendAssets\FrontendAssets::scripts(); ?>

    <script>
        (function () {
            const root = document.documentElement;
            const toggle = document.querySelector('[data-theme-toggle]');
            const icon = document.querySelector('[data-theme-icon]');
            const label = document.querySelector('[data-theme-label]');

            function applyTheme(theme) {
                const nextTheme = theme === 'dark' ? 'dark' : 'light';
                root.dataset.theme = nextTheme;
                localStorage.setItem('vulnix-theme', nextTheme);

                if (icon) {
                    icon.className = nextTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
                }

                if (label) {
                    label.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
                }

                window.dispatchEvent(new CustomEvent('vulnix-theme-change', {
                    detail: { theme: nextTheme },
                }));
            }

            applyTheme(root.dataset.theme || 'light');

            toggle?.addEventListener('click', function () {
                applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
            });
        })();
    </script>
    <?php echo $__env->yieldPushContent('scripts'); ?>
</body>
</html>
<?php /**PATH /app/resources/views/layouts/app.blade.php ENDPATH**/ ?>