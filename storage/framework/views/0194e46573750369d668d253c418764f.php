<div>
    <?php $__env->startSection('title', 'Vulnix - Discovery'); ?>
    <?php
        $progressValue = max(0, min(100, (float) $scanProgress));
        if ($progressValue >= 100) {
            $progressLabel = '100';
        } elseif ($progressValue > 0 && $progressValue < 10) {
            $progressLabel = number_format($progressValue, 1);
        } else {
            $progressLabel = (string) floor($progressValue);
        }
    ?>
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($isScanning): ?><div wire:poll.2s="pollProgress"></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="ax-toolbar"><div class="ax-toolbar-left"><h2 class="ax-page-title">Discovery</h2></div></div>

    
    <div class="disc-search-bar">
        <form wire:submit="startDiscovery" class="disc-search-form">
            <div class="disc-input-wrap">
                <i class="bi bi-globe2" style="color:var(--vx-primary)"></i>
                <input type="text" wire:model="domainInput" placeholder="Enter a domain or IP to scan (e.g. example.com, 192.168.1.1)" class="disc-search-input" <?php if($isScanning): ?> disabled <?php endif; ?>>
            </div>
            <div class="disc-toggle-wrap">
                <label class="disc-toggle-label" title="Find subdomains before scanning ports">
                    <input type="checkbox" wire:model="useSubfinder" <?php if($isScanning): ?> disabled <?php endif; ?>>
                    <span>Subdomains</span>
                </label>
            </div>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($isScanning): ?>
                <button type="button" wire:click="cancelScan" class="disc-scan-btn disc-scan-btn-cancel">
                    <i class="bi bi-x-octagon-fill"></i> Cancel Scan
                </button>
            <?php else: ?>
                <button type="submit" class="disc-scan-btn" wire:loading.attr="disabled">
                    <span wire:loading wire:target="startDiscovery" class="disc-btn-loading">
                        <span class="disc-spinner"></span> Scanning server...
                    </span>
                    <span wire:loading.remove wire:target="startDiscovery">
                        <i class="bi bi-radar"></i> Scan Ports
                    </span>
                </button>
            <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </form>
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($isScanning): ?>
        <div class="disc-progress-wrap">
            <div style="font-weight:600; color:var(--text-main); margin-bottom: 8px;">Scan in progress...</div>
            <div class="disc-progress-bar"><div class="disc-progress-fill" style="width:<?php echo e($progressValue); ?>%"></div></div>
            <div class="disc-progress-info">
                <span class="disc-progress-pct"><?php echo e($progressLabel); ?>%</span>
                <span class="disc-progress-msg"><?php echo e($scanMessage); ?></span>
            </div>
        </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!$isScanning): ?>
        <div wire:loading.block wire:target="startDiscovery" class="disc-progress-wrap" style="width:100%">
            <div class="disc-progress-bar is-indeterminate"><div class="disc-progress-fill"></div></div>
            <div class="disc-progress-info">
                <span class="disc-progress-pct">0%</span>
                <span class="disc-progress-msg">Connecting to the scan service...</span>
            </div>
        </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($scanError): ?>
    <div class="disc-alert disc-alert-error"><i class="bi bi-exclamation-triangle-fill"></i><span><?php echo e($scanError); ?></span>
        <button wire:click="$set('scanError', '')" class="disc-alert-close"><i class="bi bi-x-lg"></i></button></div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!$isScanning && $scanProgress >= 100 && $scanMessage): ?>
    <div class="disc-alert disc-alert-success">
        <i class="bi bi-check2-circle"></i><span><?php echo e($scanMessage); ?></span>
        <button wire:click="$set('scanMessage', '')" class="disc-alert-close"><i class="bi bi-x-lg"></i></button>
    </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $tree; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $domain => $hosts): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
    <?php
        $firstAsset = $hosts->flatten()->first();
        $hostInfo = $firstAsset && $firstAsset->host_info ? json_decode($firstAsset->host_info) : null;
    ?>
    <div class="disc-domain-card" <?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::$currentLoop['key'] = 'domain-'.e($domain).''; ?>wire:key="domain-<?php echo e($domain); ?>">
        <div class="disc-domain-header" wire:click="toggleDomain('<?php echo e($domain); ?>')" style="cursor:pointer">
            <div class="disc-domain-left">
                <i class="bi <?php echo e(in_array($domain, $expandedDomains) ? 'bi-chevron-down' : 'bi-chevron-right'); ?>" style="font-size:12px;color:var(--vx-text-dim)"></i>
                <span class="disc-domain-icon"><i class="bi bi-globe2"></i></span>
                <span class="disc-domain-name"><?php echo e($domain); ?></span>
                <span class="disc-count-badge"><?php echo e($hosts->flatten()->count()); ?> services</span>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($hostInfo && !empty($hostInfo->is_cdn) && $hostInfo->is_cdn): ?>
                    <span class="disc-badge disc-badge-cdn"><i class="bi bi-shield-exclamation"></i> <?php echo e($hostInfo->cdn_name ?? 'CDN/Proxy'); ?></span>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($hostInfo && !empty($hostInfo->country_code) && $hostInfo->country_code !== 'LO'): ?>
                    <span class="disc-badge disc-badge-country"><?php echo \App\Livewire\DiscoveryIndex::countryFlag($hostInfo->country_code); ?> <?php echo e($hostInfo->country_code); ?></span>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
            <div class="disc-domain-actions" onclick="event.stopPropagation()">
                <button wire:click="openDeleteModal('<?php echo e($domain); ?>')" class="disc-delete-btn" title="Delete"><i class="bi bi-trash3"></i></button>
            </div>
        </div>

        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(in_array($domain, $expandedDomains)): ?>
        <div class="disc-domain-body">
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $hosts; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $hostName => $ports): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
            <?php
                $hInfo = $ports->first() && $ports->first()->host_info ? json_decode($ports->first()->host_info) : null;
            ?>
            <div class="disc-host-block" <?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::$currentLoop['key'] = 'host-'.e($domain).'-'.e($loop->index).''; ?>wire:key="host-<?php echo e($domain); ?>-<?php echo e($loop->index); ?>">
                
                <div class="disc-host-header">
                    <div class="disc-host-left">
                        <i class="bi bi-hdd-network" style="color:var(--vx-text-muted);font-size:13px"></i>
                        <span class="disc-host-name"><?php echo e($hostName); ?></span>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($hInfo && !empty($hInfo->ip)): ?>
                            <span class="disc-host-ip"><?php echo e($hInfo->ip); ?></span>
                        <?php else: ?>
                            <span class="disc-host-ip"><?php echo e($ports->first()->ip); ?></span>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </div>
                </div>

                
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($hInfo): ?>
                <div class="disc-host-info-panel">
                    <div class="disc-info-grid">
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->ip)): ?><div class="disc-info-item"><span class="disc-info-label">IP</span><span class="disc-info-value mono"><?php echo e($hInfo->ip); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->hostname)): ?><div class="disc-info-item"><span class="disc-info-label">Hostname</span><span class="disc-info-value mono"><?php echo e($hInfo->hostname); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->country)): ?><div class="disc-info-item"><span class="disc-info-label">Country</span><span class="disc-info-value"><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->country_code)): ?><?php echo \App\Livewire\DiscoveryIndex::countryFlag($hInfo->country_code); ?> <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?><?php echo e($hInfo->country); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->asn)): ?><div class="disc-info-item"><span class="disc-info-label">ASN</span><span class="disc-info-value mono"><?php echo e($hInfo->asn); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->isp)): ?><div class="disc-info-item"><span class="disc-info-label">ISP</span><span class="disc-info-value"><?php echo e($hInfo->isp); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->os_name)): ?><div class="disc-info-item"><span class="disc-info-label">OS</span><span class="disc-info-value"><i class="bi bi-pc-display"></i> <?php echo e($hInfo->os_name); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->org)): ?><div class="disc-info-item"><span class="disc-info-label">Organization</span><span class="disc-info-value"><?php echo e($hInfo->org); ?></span></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <div class="disc-info-item">
                            <span class="disc-info-label">CDN/Proxy</span>
                            <span class="disc-info-value">
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($hInfo->is_cdn) && $hInfo->is_cdn): ?>
                                    <span class="disc-badge disc-badge-cdn" style="font-size:10px"><i class="bi bi-shield-exclamation"></i> <?php echo e($hInfo->cdn_name); ?></span>
                                <?php else: ?>
                                    <span style="color:var(--sev-low-text)">✓ Direct</span>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </span>
                        </div>
                        <div class="disc-info-item">
                            <span class="disc-info-label">External Tools</span>
                            <div class="disc-info-value" style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
                                <a href="https://check-host.net/ip-info?host=<?php echo e($hInfo->ip ?? $hostName); ?>" target="_blank" class="disc-ext-link" title="Check-Host Info"><i class="bi bi-info-circle"></i> Check-Host</a>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

                
                
                <?php
                    $webPorts = $ports->filter(function($p) { return \App\Livewire\DiscoveryIndex::isWebService($p->service ?? ''); });
                    $tcpPorts = $ports->filter(function($p) { return !\App\Livewire\DiscoveryIndex::isWebService($p->service ?? ''); });
                    $categories = [
                        ['title' => 'WEB SERVICES', 'badge' => 'disc-badge-web', 'ports' => $webPorts, 'isWeb' => true],
                        ['title' => 'TCP SERVICES', 'badge' => 'disc-badge-tcp', 'ports' => $tcpPorts, 'isWeb' => false],
                    ];
                ?>

                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $categories; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $cat): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($cat['ports']->count() > 0): ?>
                <div class="disc-category-section" x-data="{ open: true }">
                    <div class="disc-category-header" @click="open = !open">
                        <i class="bi" :class="open ? 'bi-chevron-down' : 'bi-chevron-right'" style="font-size:12px"></i>
                        <span class="disc-badge <?php echo e($cat['badge']); ?>"><?php echo e($cat['title']); ?></span>
                        <span class="disc-count-badge"><?php echo e($cat['ports']->count()); ?></span>
                    </div>
                    <div x-show="open" x-collapse>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $cat['ports']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $port): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                        <?php $isWeb = $cat['isWeb']; ?>
                        <div class="disc-port-row" <?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::$currentLoop['key'] = 'port-'.e($port->id).''; ?>wire:key="port-<?php echo e($port->id); ?>">
                            <div class="disc-port-left">
                                <div class="disc-port-line"></div>
                                <span class="disc-port-badge-lg">
                                    <span class="disc-pnum"><?php echo e($port->port); ?></span>
                                    <span class="disc-psvc"><?php echo e(strtoupper($port->service)); ?></span>
                                </span>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($isWeb): ?><span class="disc-badge disc-badge-web">WEB</span><?php else: ?><span class="disc-badge disc-badge-tcp">TCP</span><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                <span class="disc-port-url">
                                    <?php
                                        $host = $port->subdomain ?: $port->domain;
                                        $svc = strtolower($port->service);
                                        $proto = in_array($svc, ['https','https-alt','ssl','ssl/http','ssl/https']) ? 'https' : 'http';
                                        $isStd = ($proto==='http' && $port->port==80) || ($proto==='https' && $port->port==443);
                                        $url = $isStd ? "{$proto}://{$host}/" : "{$proto}://{$host}:{$port->port}/";
                                    ?>
                                    <?php echo e($url); ?>

                                </span>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($port->metadata): ?>
                                    <?php $meta = json_decode($port->metadata); ?>
                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!empty($meta->service_detail) && $meta->service_detail !== $port->service): ?>
                                        <span class="disc-svc-detail"><?php echo e($meta->service_detail); ?></span>
                                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </div>
                            <div class="disc-port-right">
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(in_array($url, $targetUrls)): ?>
                                    <span class="disc-promoted-tag"><i class="bi bi-check2-circle"></i> Promoted</span>
                                <?php else: ?>
                                    <button wire:click="openPromoteModal(<?php echo e($port->id); ?>)" class="disc-add-btn"><i class="bi bi-plus-lg"></i> Add as Target</button>
                                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                <button wire:click="deleteAsset(<?php echo e($port->id); ?>)" class="disc-delete-sm"><i class="bi bi-x-lg"></i></button>
                            </div>
                        </div>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
                    </div>
                </div>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
            </div>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
        </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
    <div class="disc-empty">
        <div class="disc-empty-icon"><i class="bi bi-radar"></i></div>
        <p class="disc-empty-title">No discovered assets yet</p>
        <p class="disc-empty-sub">Enter a domain or IP above and click <b>Scan Ports</b> to discover services.</p>
    </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showSubfinderModal): ?>
    <div class="disc-modal-overlay" wire:click.self="cancelSubfinder">
        <div class="disc-modal disc-modal-lg" wire:click.stop>
            <div class="disc-modal-header">
                <h3><i class="bi bi-diagram-3" style="color:var(--vx-primary)"></i> Subdomains Found</h3>
                <button wire:click="cancelSubfinder" class="disc-modal-close"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="disc-modal-body">
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($subfinderLoading): ?>
                <div style="text-align:center;padding:40px 20px">
                    <div class="disc-spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 16px"></div>
                    <p style="color:var(--vx-text-dim);font-size:13px;margin:0">Enumerating subdomains for <strong style="color:var(--vx-text)"><?php echo e($subfinderDomain); ?></strong>...</p>
                    <p style="color:var(--vx-text-muted);font-size:11px;margin-top:6px">This can take up to 2 minutes</p>
                </div>
                <?php else: ?>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <span style="color:var(--vx-text);font-size:13px">
                        <strong><?php echo e(count($subfinderResults)); ?></strong> subdomains found for <strong style="color:var(--vx-text)"><?php echo e($subfinderDomain); ?></strong>
                    </span>
                    <div style="display:flex;gap:6px">
                        <button wire:click="selectAllSubdomains" class="disc-modal-cancel-btn" style="font-size:11px;padding:4px 10px">Select All</button>
                        <button wire:click="deselectAllSubdomains" class="disc-modal-cancel-btn" style="font-size:11px;padding:4px 10px">Deselect All</button>
                    </div>
                </div>
                <div style="color:var(--vx-text-muted);font-size:11px;margin-bottom:8px">
                    <i class="bi bi-info-circle"></i> Max 50 targets per scan. Selected: <strong style="color:var(--vx-primary)"><?php echo e(count($subfinderSelected)); ?></strong>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(count($existingSubdomainsList ?? []) > 0): ?>
                        · <span style="color:var(--sev-medium-text)"><?php echo e(count($existingSubdomainsList)); ?> already scanned</span>
                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
                <div class="disc-subfinder-list">
                    
                    <label class="disc-sub-item disc-sub-main">
                        <input type="checkbox" value="<?php echo e($subfinderDomain); ?>" wire:model="subfinderSelected">
                        <span><?php echo e($subfinderDomain); ?></span>
                        <span class="disc-badge disc-badge-web" style="font-size:9px">MAIN</span>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(in_array($subfinderDomain, $existingSubdomainsList ?? [])): ?>
                            <span class="disc-badge disc-badge-tcp" style="font-size:8px">SCANNED</span>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </label>
                    
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__currentLoopData = $subfinderResults; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sub): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                    <label class="disc-sub-item" <?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::$currentLoop['key'] = 'sub-'.e($loop->index).''; ?>wire:key="sub-<?php echo e($loop->index); ?>">
                        <input type="checkbox" value="<?php echo e($sub); ?>" wire:model="subfinderSelected">
                        <span><?php echo e($sub); ?></span>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(in_array($sub, $existingSubdomainsList ?? [])): ?>
                            <span class="disc-badge disc-badge-tcp" style="font-size:8px">SCANNED</span>
                        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </label>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(empty($subfinderResults)): ?>
                    <div style="text-align:center;padding:30px;color:var(--vx-text-dim)">
                        <i class="bi bi-search" style="font-size:24px;display:block;margin-bottom:8px;opacity:.3"></i>
                        No subdomains found. Only the main domain will be scanned.
                    </div>
                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </div>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
            <div class="disc-modal-footer">
                <button wire:click="cancelSubfinder" class="disc-modal-cancel-btn">Cancel</button>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(!$subfinderLoading): ?>
                <button wire:click="scanSelectedSubdomains" class="disc-confirm-btn">
                    <i class="bi bi-radar"></i> Scan <?php echo e(count($subfinderSelected)); ?> target(s)
                </button>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
        </div>
    </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showPromoteModal): ?>
    <div class="disc-modal-overlay" wire:click.self="cancelPromotion">
        <div class="disc-modal" wire:click.stop>
            <div class="disc-modal-header">
                <h3><i class="bi bi-plus-circle" style="color:var(--vx-primary)"></i> Add as Target</h3>
                <button wire:click="cancelPromotion" class="disc-modal-close"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="disc-modal-body">
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($promoteHostInfo && !empty($promoteHostInfo->is_cdn) && $promoteHostInfo->is_cdn): ?>
                <div class="disc-modal-cdn-warn">
                    <i class="bi bi-shield-exclamation"></i>
                    <span>This target is behind <strong><?php echo e($promoteHostInfo->cdn_name); ?></strong>. Vulnerability scans will hit the CDN, not the origin server.</span>
                </div>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                <label class="disc-modal-label">TARGET URL</label>
                <div class="disc-modal-url"><?php echo e($promoteUrl); ?></div>
                <label class="disc-modal-label" style="margin-top:16px">DESCRIPTION</label>
                <input type="text" wire:model="promoteDescription" placeholder="e.g. Main webserver, API gateway..." class="disc-modal-input">
            </div>
            <div class="disc-modal-footer">
                <button wire:click="cancelPromotion" class="disc-modal-cancel-btn">Cancel</button>
                <button wire:click="confirmPromotion" class="disc-confirm-btn"><i class="bi bi-check2"></i> Confirm</button>
            </div>
        </div>
    </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showDeleteModal): ?>
    <div class="disc-modal-overlay" wire:click.self="cancelDelete">
        <div class="disc-modal" wire:click.stop>
            <div class="disc-modal-header">
                <h3><i class="bi bi-trash3" style="color:var(--sev-critical-text)"></i> Delete Discovery</h3>
                <button wire:click="cancelDelete" class="disc-modal-close"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="disc-modal-body">
                <p style="color:var(--vx-text);font-size:14px;margin:0">Delete all discovered assets for <strong style="color:var(--vx-text)"><?php echo e($deleteDomainName); ?></strong>?</p>
                <p style="color:var(--vx-text-dim);font-size:12px;margin-top:8px">This will remove all port scan results. Promoted targets will not be affected.</p>
            </div>
            <div class="disc-modal-footer">
                <button wire:click="cancelDelete" class="disc-modal-cancel-btn">Cancel</button>
                <button wire:click="confirmDelete" class="disc-delete-confirm-btn"><i class="bi bi-trash3"></i> Delete</button>
            </div>
        </div>
    </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    
    <div class="disc-terminal-section" x-data="{
        autoScroll: true,
        scrollToBottom() {
            if (this.autoScroll) {
                this.$nextTick(() => {
                    const el = this.$refs.termBody;
                    if (el) el.scrollTop = el.scrollHeight;
                });
            }
        }
    }" x-init="$watch('$wire.scanLogs', () => scrollToBottom())">

        
        <div class="disc-term-bar">
            <div class="disc-term-bar-left">
                <div class="disc-status-dot <?php echo e($isScanning ? 'active' : ''); ?>"></div>
                <span><?php echo e($isScanning ? 'SCANNING' : 'READY'); ?></span>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($isScanning): ?>
                    <span style="color:var(--vx-border-strong)">|</span>
                    <span style="color:var(--vx-primary-hover);font-family:'JetBrains Mono',monospace"><?php echo e($progressLabel); ?>%</span>
                    <span style="color:var(--vx-text-muted)"><?php echo e($scanMessage); ?></span>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
            <button wire:click="toggleTerminal" class="disc-terminal-toggle <?php echo e($showTerminal ? 'active' : ''); ?>">
                <i class="bi bi-terminal-fill"></i>
                <?php echo e($showTerminal ? 'Hide Terminal' : 'Show Terminal'); ?>

            </button>
        </div>

        
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showTerminal): ?>
        <div class="disc-term-window-inline">
            <div class="disc-term-header">
                <span><i class="bi bi-terminal"></i> Scan Engine Output</span>
                <div style="display:flex; align-items:center; gap:12px;">
                    <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; color:#8b949e;">
                        <input type="checkbox" x-model="autoScroll" style="width:12px; height:12px;"> Auto-scroll
                    </label>
                    <span style="color:var(--vx-primary-hover); font-size:11px;"><?php echo e(count($scanLogs)); ?> lines</span>
                </div>
            </div>
            <div class="disc-term-body" x-ref="termBody">
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::openLoop(); ?><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $scanLogs; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $log): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::startLoopIteration(); ?><?php endif; ?>
                    <div class="disc-term-line"><span class="term-prompt">$</span><?php echo e($log); ?></div>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::endLoop(); ?><?php endif; ?><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><?php \Livewire\Features\SupportCompiledWireKeys\SupportCompiledWireKeys::closeLoop(); ?><?php endif; ?>
                    <div class="disc-term-line" style="color:#484f58"><span class="term-prompt">$</span> Waiting for scan output...</div>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
        </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>

    <?php echo $__env->make('livewire.partials.discovery-styles', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
</div>
<?php /**PATH /app/resources/views/livewire/discovery-index.blade.php ENDPATH**/ ?>