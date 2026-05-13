<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Target;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class DiscoveryIndex extends Component
{
    // Input
    public $domainInput = '';
    public $useSubfinder = false;
    public $isScanning = false;
    public $scanError = '';
    public $activeJobId = null;
    public $scanProgress = 0;
    public $scanMessage = '';
    public $scanTargetsTotal = 0;
    public $scanTargetsDone = 0;
    public $scanCurrentTarget = '';
    public $scanResultCount = 0;
    public $scanLogs = [];
    public $showTerminal = false;
    public $maxScanTargets = 50;

    // Tree state
    public $expandedDomains = [];
    public $domainHostLimits = [];

    // Subfinder modal
    public $showSubfinderModal = false;
    public $subfinderLoading = false;
    public $subfinderResults = [];
    public $subfinderSelected = [];
    public $subfinderDomain = '';
    public $existingSubdomainsList = [];
    public $subfinderFilter = '';
    public $subfinderVisibleLimit = 200;

    // Promotion modal
    public $showPromoteModal = false;
    public $promoteAssetId = null;
    public $promoteUrl = '';
    public $promoteDescription = '';
    public $promoteHostInfo = null;

    // Delete confirmation
    public $showDeleteModal = false;
    public $deleteDomainName = '';

    /**
     * On mount, restore any active scan from cache so progress
     * survives page navigation.
     */
    public function mount()
    {
        $activeJob = Cache::get('discovery_active_job');
        if ($activeJob) {
            $this->activeJobId = $activeJob['job_id'];
            $this->isScanning = true;
            $this->domainInput = $activeJob['domain'] ?? '';
            $this->scanProgress = $activeJob['progress'] ?? 0;
            $this->scanMessage = $activeJob['message'] ?? 'Resuming scan...';
            $this->scanTargetsTotal = $activeJob['targets_total'] ?? 0;
            $this->scanTargetsDone = $activeJob['targets_done'] ?? 0;
            $this->scanCurrentTarget = $activeJob['current_target'] ?? '';
            $this->scanResultCount = $activeJob['results_count'] ?? 0;
        }
    }

    private function getApiUrl(): string
    {
        return rtrim(env('VULNIX_API_URL', 'http://host.docker.internal:8001'), '/');
    }

    private function cleanDomain(string $input): string
    {
        $input = trim($input);
        if (preg_match('#^https?://#i', $input)) {
            $parsed = parse_url($input);
            return $parsed['host'] ?? $input;
        }
        $input = explode('/', $input)[0];
        $input = explode('?', $input)[0];
        $input = explode('#', $input)[0];
        if (preg_match('/^(.+):(\d+)$/', $input, $m)) {
            return $m[1];
        }
        return $input;
    }

    public function toggleDomain($domain)
    {
        if (in_array($domain, $this->expandedDomains)) {
            $this->expandedDomains = array_values(array_diff($this->expandedDomains, [$domain]));
        } else {
            $this->expandedDomains[] = $domain;
            $this->domainHostLimits[$domain] = $this->domainHostLimits[$domain] ?? 50;
        }
    }

    public function loadMoreHosts($domain)
    {
        $this->domainHostLimits[$domain] = ($this->domainHostLimits[$domain] ?? 50) + 50;
    }

    public function startDiscovery()
    {
        $this->validate([
            'domainInput' => 'required|string|min:3',
        ]);

        $cleanedDomain = $this->cleanDomain($this->domainInput);
        $this->domainInput = $cleanedDomain;
        $this->scanError = '';
        $this->scanProgress = 0;
        $this->scanMessage = '';
        $this->scanTargetsTotal = 0;
        $this->scanTargetsDone = 0;
        $this->scanCurrentTarget = '';
        $this->scanResultCount = 0;

        if ($this->useSubfinder) {
            $this->runSubfinder($cleanedDomain);
            $this->dispatch('discovery-done');
            return;
        }

        // Direct scan (no subfinder)
        $this->launchScan($cleanedDomain, []);
    }

    public function runSubfinder(string $domain)
    {
        $this->subfinderLoading = true;
        $this->subfinderDomain = $domain;
        $this->subfinderResults = [];
        $this->subfinderSelected = [];
        $this->existingSubdomainsList = [];
        $this->subfinderFilter = '';
        $this->subfinderVisibleLimit = 200;
        $this->showSubfinderModal = true;

        try {
            $apiUrl = $this->getApiUrl();
            $response = Http::timeout(130)->post("{$apiUrl}/api/v1/discovery/subfinder", [
                'domain' => $domain,
            ]);

            if (!$response->successful()) {
                $this->scanError = 'Subdomain enumeration failed: ' . ($response->json('detail') ?? 'Unknown error');
                $this->showSubfinderModal = false;
                $this->subfinderLoading = false;
                return;
            }

            $data = $response->json();
            $rawSubdomains = $data['subdomains'] ?? [];

            // 1. Clean and unique
            $cleanedRaw = array_values(array_unique(array_map(function($s) {
                return strtolower(trim($s));
            }, $rawSubdomains)));

            // 2. Remove redundant www. variants
            $filtered = [];
            foreach ($cleanedRaw as $sub) {
                if (empty($sub) || $sub === $domain) continue;

                if (str_starts_with($sub, 'www.')) {
                    $base = substr($sub, 4);
                    if ($base === $domain || in_array($base, $cleanedRaw)) {
                        continue;
                    }
                }
                $filtered[] = $sub;
            }

            // 3. Check which are already in DB (mark, don't block)
            $existingInDb = DB::table('discovered_assets')
                ->where('domain', $domain)
                ->whereNotNull('subdomain')
                ->pluck('subdomain')
                ->unique()
                ->map(fn($s) => strtolower($s))
                ->toArray();

            $mainDomainExists = DB::table('discovered_assets')
                ->where('domain', $domain)
                ->whereNull('subdomain')
                ->exists();

            // Build list of already-scanned items for badges
            $this->existingSubdomainsList = $existingInDb;
            if ($mainDomainExists) {
                $this->existingSubdomainsList[] = $domain;
            }

            $this->subfinderResults = $filtered;

            // Auto-select: new subdomains + main domain (always include main)
            $allTargets = array_merge([$domain], $filtered);
            $this->subfinderSelected = array_slice($allTargets, 0, $this->maxScanTargets);
            $this->subfinderLoading = false;

        } catch (\Exception $e) {
            $this->scanError = 'Failed to enumerate subdomains: ' . $e->getMessage();
            $this->showSubfinderModal = false;
            $this->subfinderLoading = false;
        }
    }

    public function selectAllSubdomains()
    {
        $allTargets = array_merge([$this->subfinderDomain], $this->subfinderResults);
        $this->subfinderSelected = array_slice($allTargets, 0, $this->maxScanTargets);
    }

    public function deselectAllSubdomains()
    {
        $this->subfinderSelected = [$this->subfinderDomain]; // Always keep main
    }

    public function scanSelectedSubdomains()
    {
        if (empty($this->subfinderSelected)) {
            $this->scanError = 'Select at least one target to scan.';
            return;
        }

        $this->subfinderSelected = array_slice(array_values(array_unique($this->subfinderSelected)), 0, $this->maxScanTargets);
        $this->showSubfinderModal = false;
        $this->existingSubdomainsList = [];
        $this->launchScan($this->subfinderDomain, $this->subfinderSelected);
    }

    public function cancelSubfinder()
    {
        $this->showSubfinderModal = false;
        $this->subfinderLoading = false;
        $this->subfinderResults = [];
        $this->subfinderSelected = [];
        $this->existingSubdomainsList = [];
        $this->subfinderFilter = '';
        $this->subfinderVisibleLimit = 200;
        $this->dispatch('discovery-done');
    }

    public function updatedSubfinderFilter()
    {
        $this->subfinderVisibleLimit = 200;
    }

    public function loadMoreSubdomains()
    {
        $this->subfinderVisibleLimit += 200;
    }

    private function launchScan(string $domain, array $targets)
    {
        try {
            $targetCount = max(count($targets), 1);
            $this->scanTargetsTotal = $targetCount;
            $this->scanTargetsDone = 0;
            $this->scanCurrentTarget = $domain;
            $this->scanResultCount = 0;
            $this->scanProgress = 0;
            $this->scanMessage = "Starting scan on {$targetCount} target(s)...";

            $apiUrl = $this->getApiUrl();
            $response = Http::timeout(10)->post("{$apiUrl}/api/v1/discovery/start", [
                'domain' => $domain,
                'targets' => $targets,
            ]);

            if (!$response->successful()) {
                $this->scanError = 'Scan failed: ' . ($response->json('detail') ?? 'Unknown error');
                $this->dispatch('discovery-done');
                return;
            }

            $data = $response->json();
            $this->activeJobId = $data['job_id'];
            $this->isScanning = true;
            $this->scanProgress = 0;
            $this->scanTargetsTotal = (int) ($data['targets_count'] ?? $targetCount);
            $this->scanMessage = "Scan initiated for {$this->scanTargetsTotal} target(s)...";

            Cache::put('discovery_active_job', [
                'job_id' => $this->activeJobId,
                'domain' => $this->domainInput,
                'progress' => 0,
                'message' => $this->scanMessage,
                'targets_total' => $this->scanTargetsTotal,
                'targets_done' => 0,
                'current_target' => $this->scanCurrentTarget,
                'results_count' => 0,
            ], now()->addMinutes(30));

        } catch (\Exception $e) {
            $this->scanError = 'Connection error: Could not reach the scanning server.';
            $this->dispatch('discovery-done');
        }
    }

    public function cancelScan()
    {
        if (!$this->activeJobId || !$this->isScanning) return;

        try {
            $apiUrl = $this->getApiUrl();
            Http::timeout(5)->delete("{$apiUrl}/api/v1/discovery/{$this->activeJobId}/cancel");

            $this->isScanning = false;
            $this->scanMessage = '';
            $this->scanProgress = 100;
            $this->scanError = 'Scan was manually cancelled.';
            Cache::forget('discovery_active_job');
            $this->dispatch('discovery-done');
        } catch (\Exception $e) {
            // Ignore error if backend is unreachable during cancel
            $this->isScanning = false;
        }
    }

    public function pollProgress()
    {
        if (!$this->activeJobId || !$this->isScanning) return;

        try {
            $apiUrl = $this->getApiUrl();
            $response = Http::timeout(5)->get("{$apiUrl}/api/v1/discovery/{$this->activeJobId}/status");

            if (!$response->successful()) return;

            $data = $response->json();
            $incomingProgress = (float) ($data['progress'] ?? $this->scanProgress);
            $this->scanProgress = max((float) $this->scanProgress, $incomingProgress);
            $this->scanMessage = $data['message'] ?? '';
            $this->scanLogs = $data['logs'] ?? [];

            Cache::put('discovery_active_job', [
                'job_id' => $this->activeJobId,
                'domain' => $this->domainInput,
                'progress' => $this->scanProgress,
                'message' => $this->scanMessage,
            ], now()->addMinutes(30));

            if ($data['status'] === 'cancelled') {
                $this->isScanning = false;
                $this->scanMessage = '';
                $this->scanProgress = 100;
                $this->scanError = 'Scan was manually cancelled.';
                $this->activeJobId = null;
                Cache::forget('discovery_active_job');
                return;
            }

            if ($data['status'] === 'completed') {
                $this->isScanning = false;
                $results = $data['results'] ?? [];
                $domain = $data['domain'] ?? $this->domainInput;

                if (!empty($results)) {
                    $this->persistResults($domain, $results);
                    if (!in_array($domain, $this->expandedDomains)) {
                        $this->expandedDomains[] = $domain;
                    }
                    $this->scanMessage = count($results) . ' services discovered';
                } else {
                    $this->scanMessage = 'No open ports found';
                }
                $this->activeJobId = null;
                Cache::forget('discovery_active_job');

            } elseif ($data['status'] === 'failed') {
                $this->isScanning = false;
                $this->scanMessage = '';
                $this->scanError = $data['message'] ?? 'Scan failed';
                $this->activeJobId = null;
                Cache::forget('discovery_active_job');
            }

        } catch (\Exception $e) {
            // Silently retry on next poll
        }
    }

    private function persistResults(string $domain, array $results)
    {
        foreach ($results as $port) {
            $subdomain = ($port['host'] !== $domain) ? $port['host'] : null;

            // Extract host_info if present
            $hostInfo = $port['host_info'] ?? null;

            $exists = DB::table('discovered_assets')
                ->where('domain', $domain)
                ->where('subdomain', $subdomain)
                ->where('port', $port['port'])
                ->exists();

            if (!$exists) {
                DB::table('discovered_assets')->insert([
                    'domain' => $domain,
                    'subdomain' => $subdomain,
                    'ip' => $port['ip'],
                    'port' => $port['port'],
                    'service' => $port['service'],
                    'status' => 'discovered',
                    'metadata' => json_encode([
                        'protocol' => $port['protocol'],
                        'service_detail' => $port['service_detail'],
                    ]),
                    'host_info' => $hostInfo ? json_encode($hostInfo) : null,
                    'last_seen' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('discovered_assets')
                    ->where('domain', $domain)
                    ->where('subdomain', $subdomain)
                    ->where('port', $port['port'])
                    ->update([
                        'ip' => $port['ip'],
                        'service' => $port['service'],
                        'host_info' => $hostInfo ? json_encode($hostInfo) : null,
                        'last_seen' => now(),
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    public function openPromoteModal($id)
    {
        $asset = DB::table('discovered_assets')->where('id', $id)->first();
        if (!$asset) {
            $this->scanError = 'Asset not found.';
            return;
        }

        $host = $asset->subdomain ?: $asset->domain;
        $port = $asset->port;
        $service = strtolower($asset->service ?? '');

        $protocol = 'http';
        if (in_array($service, ['https', 'https-alt', 'ssl', 'ssl/http', 'ssl/https'])) {
            $protocol = 'https';
        }

        $isStandard = ($protocol === 'http' && $port == 80) || ($protocol === 'https' && $port == 443);
        $this->promoteUrl = $isStandard ? "{$protocol}://{$host}/" : "{$protocol}://{$host}:{$port}/";
        $this->promoteAssetId = $id;
        $this->promoteDescription = '';
        $this->promoteHostInfo = $asset->host_info ? json_decode($asset->host_info) : null;
        $this->showPromoteModal = true;
    }

    public function confirmPromotion()
    {
        if (!$this->promoteAssetId) return;

        $exists = Target::where('url', $this->promoteUrl)->exists();
        if ($exists) {
            $this->scanError = "Target {$this->promoteUrl} already exists!";
            $this->showPromoteModal = false;
            return;
        }

        // Get host_info from the asset to persist on target
        $asset = DB::table('discovered_assets')->where('id', $this->promoteAssetId)->first();
        $cdnInfo = null;
        if ($asset && $asset->host_info) {
            $cdnInfo = json_decode($asset->host_info, true);
        }

        Target::create([
            'url' => $this->promoteUrl,
            'descricao' => $this->promoteDescription ?: "Discovered via port scan",
            'tipo' => 'web',
            'ativo' => true,
            'cdn_info' => $cdnInfo,
        ]);

        DB::table('discovered_assets')
            ->where('id', $this->promoteAssetId)
            ->update(['status' => 'promoted']);

        $this->showPromoteModal = false;
        $this->promoteAssetId = null;
        $this->promoteHostInfo = null;
        $this->scanMessage = "Target {$this->promoteUrl} created successfully!";
    }

    public function cancelPromotion()
    {
        $this->showPromoteModal = false;
        $this->promoteAssetId = null;
        $this->promoteHostInfo = null;
    }

    public function openDeleteModal($domain)
    {
        $this->deleteDomainName = $domain;
        $this->showDeleteModal = true;
    }

    public function confirmDelete()
    {
        if (!$this->deleteDomainName) return;

        DB::table('discovered_assets')
            ->where('domain', $this->deleteDomainName)
            ->delete();

        $this->expandedDomains = array_values(array_diff($this->expandedDomains, [$this->deleteDomainName]));
        $this->showDeleteModal = false;
        $this->deleteDomainName = '';
        $this->scanMessage = 'Discovery results deleted';
    }

    public function cancelDelete()
    {
        $this->showDeleteModal = false;
        $this->deleteDomainName = '';
    }

    public function deleteAsset($id)
    {
        DB::table('discovered_assets')->where('id', $id)->delete();
    }

    /**
     * Helper: check if a service name is web-related.
     */
    public static function isWebService(string $service): bool
    {
        $webServices = ['http', 'https', 'https-alt', 'ssl/http', 'ssl/https', 'http-proxy', 'http-alt'];
        return in_array(strtolower($service), $webServices);
    }

    /**
     * Helper: get country flag emoji from country code.
     */
    public static function countryFlag(string $code): string
    {
        if (strlen($code) !== 2) return '';
        $code = strtolower($code);
        if ($code === 'lo') {
            return '<i class="bi bi-hdd-network" style="color:var(--vx-text-muted); margin-right:4px;"></i>';
        }
        return "<img src=\"https://flagcdn.com/w20/{$code}.png\" width=\"16\" alt=\"{$code}\" style=\"vertical-align: middle; margin-right: 4px; border-radius: 2px; margin-bottom: 2px;\">";
    }

    public function toggleTerminal()
    {
        $this->showTerminal = !$this->showTerminal;
    }

    public function render()
    {
        $assets = DB::table('discovered_assets')
            ->whereNotNull('port')
            ->orderBy('domain')
            ->orderBy('subdomain')
            ->orderBy('port')
            ->get();

        $tree = $assets->groupBy('domain')->map(function ($domainAssets) {
            return $domainAssets->groupBy(function ($asset) {
                return $asset->subdomain ?: $asset->domain;
            });
        });

        $targetUrls = Target::pluck('url')->toArray();

        return view('livewire.discovery-index', [
            'tree' => $tree,
            'targetUrls' => $targetUrls,
        ]);
    }
}
