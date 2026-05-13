<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DiscoveredAssetsSeeder extends Seeder
{
    public function run(): void
    {
        \Illuminate\Support\Facades\DB::table('discovered_assets')->insert([
            // vulnix.com :80
            [
                'domain' => 'vulnix.com',
                'subdomain' => null,
                'ip' => '1.1.1.1',
                'port' => '80',
                'service' => 'http',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // vulnix.com :8080
            [
                'domain' => 'vulnix.com',
                'subdomain' => null,
                'ip' => '1.1.1.1',
                'port' => '8080',
                'service' => 'http-proxy',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // api.vulnix.com :80
            [
                'domain' => 'vulnix.com',
                'subdomain' => 'api.vulnix.com',
                'ip' => '1.1.1.2',
                'port' => '80',
                'service' => 'http',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // api.vulnix.com :7070
            [
                'domain' => 'vulnix.com',
                'subdomain' => 'api.vulnix.com',
                'ip' => '1.1.1.2',
                'port' => '7070',
                'service' => 'http',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // dev.vulnix.com :443
            [
                'domain' => 'vulnix.com',
                'subdomain' => 'dev.vulnix.com',
                'ip' => '1.1.1.3',
                'port' => '443',
                'service' => 'https',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // dev.vulnix.com :22 (SSH)
            [
                'domain' => 'vulnix.com',
                'subdomain' => 'dev.vulnix.com',
                'ip' => '1.1.1.3',
                'port' => '22',
                'service' => 'ssh',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // target-lab.io :443
            [
                'domain' => 'target-lab.io',
                'subdomain' => null,
                'ip' => '2.2.2.1',
                'port' => '443',
                'service' => 'https',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // vpn.target-lab.io :1194
            [
                'domain' => 'target-lab.io',
                'subdomain' => 'vpn.target-lab.io',
                'ip' => '2.2.2.5',
                'port' => '1194',
                'service' => 'openvpn',
                'status' => 'discovered',
                'metadata' => null, 'last_seen' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }
}
