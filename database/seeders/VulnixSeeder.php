<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Target;
use App\Models\Scan;
use App\Models\Vulnerabilidade;
use Carbon\Carbon;

/**
 * Seeder: VulnixSeeder
 *
 * Popula o banco com dados realistas de exemplo para demonstração.
 * Inclui targets conhecidos (DVWA, Juice Shop), scans variados
 * e vulnerabilidades com diferentes severidades.
 *
 * Executar: php artisan db:seed --class=VulnixSeeder
 */
class VulnixSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════
        // TARGETS (Alvos)
        // ══════════════════════════════════════════

        $targets = [
            [
                'url'       => 'http://192.168.29.86:8082/login.php',
                'descricao' => 'DVWA - Damn Vulnerable Web Application',
                'tipo'      => 'web',
                'ativo'     => true,
            ],
            [
                'url'       => 'http://localhost:3000/#/',
                'descricao' => 'OWASP Juice Shop',
                'tipo'      => 'web',
                'ativo'     => true,
            ],
            [
                'url'       => 'http://192.168.1.100:8080',
                'descricao' => 'API Interna - Servidor de Testes',
                'tipo'      => 'api',
                'ativo'     => true,
            ],
            [
                'url'       => 'http://testphp.vulnweb.com',
                'descricao' => 'Acunetix Test Site (PHP)',
                'tipo'      => 'web',
                'ativo'     => true,
            ],
            [
                'url'       => '192.168.1.0/24',
                'descricao' => 'Rede Interna - Segmento Corporativo',
                'tipo'      => 'network',
                'ativo'     => false,
            ],
        ];

        $createdTargets = [];
        foreach ($targets as $targetData) {
            $createdTargets[] = Target::create($targetData);
        }

        // ══════════════════════════════════════════
        // SCANS (Varreduras)
        // ══════════════════════════════════════════

        $scans = [
            // DVWA — scan completo finalizado
            [
                'target_id'               => $createdTargets[0]->id,
                'tipo_scan'               => 'full',
                'status'                  => 'concluido',
                'iniciado_em'             => Carbon::now()->subDays(6)->setTime(17, 0, 0),
                'finalizado_em'           => Carbon::now()->subDays(6)->setTime(17, 18, 26),
                'total_vulnerabilidades'  => 12,
            ],
            // DVWA — scan nuclei
            [
                'target_id'               => $createdTargets[0]->id,
                'tipo_scan'               => 'nuclei',
                'status'                  => 'concluido',
                'iniciado_em'             => Carbon::now()->subDays(3)->setTime(10, 30, 0),
                'finalizado_em'           => Carbon::now()->subDays(3)->setTime(10, 45, 12),
                'total_vulnerabilidades'  => 8,
            ],
            // Juice Shop — scan completo
            [
                'target_id'               => $createdTargets[1]->id,
                'tipo_scan'               => 'full',
                'status'                  => 'concluido',
                'iniciado_em'             => Carbon::now()->subDays(6)->setTime(17, 16, 0),
                'finalizado_em'           => Carbon::now()->subDays(6)->setTime(17, 16, 33),
                'total_vulnerabilidades'  => 9,
            ],
            // API Interna — scan rápido em progresso
            [
                'target_id'               => $createdTargets[2]->id,
                'tipo_scan'               => 'rapido',
                'status'                  => 'em_progresso',
                'iniciado_em'             => Carbon::now()->subMinutes(15),
                'finalizado_em'           => null,
                'total_vulnerabilidades'  => 3,
            ],
            // Test Site — scan nmap concluído
            [
                'target_id'               => $createdTargets[3]->id,
                'tipo_scan'               => 'nmap',
                'status'                  => 'concluido',
                'iniciado_em'             => Carbon::now()->subDays(2)->setTime(14, 0, 0),
                'finalizado_em'           => Carbon::now()->subDays(2)->setTime(14, 8, 45),
                'total_vulnerabilidades'  => 5,
            ],
            // Test Site — scan nuclei falhou
            [
                'target_id'               => $createdTargets[3]->id,
                'tipo_scan'               => 'nuclei',
                'status'                  => 'falhou',
                'iniciado_em'             => Carbon::now()->subDay()->setTime(9, 0, 0),
                'finalizado_em'           => Carbon::now()->subDay()->setTime(9, 2, 10),
                'total_vulnerabilidades'  => 0,
            ],
            // Rede — scan aguardando
            [
                'target_id'               => $createdTargets[4]->id,
                'tipo_scan'               => 'subdomain',
                'status'                  => 'aguardando',
                'iniciado_em'             => null,
                'finalizado_em'           => null,
                'total_vulnerabilidades'  => 0,
            ],
            // Juice Shop — scan cancelado
            [
                'target_id'               => $createdTargets[1]->id,
                'tipo_scan'               => 'rapido',
                'status'                  => 'cancelado',
                'iniciado_em'             => Carbon::now()->subDays(4)->setTime(8, 0, 0),
                'finalizado_em'           => Carbon::now()->subDays(4)->setTime(8, 1, 30),
                'total_vulnerabilidades'  => 0,
            ],
        ];

        $createdScans = [];
        foreach ($scans as $scanData) {
            $createdScans[] = Scan::create($scanData);
        }

        // ══════════════════════════════════════════
        // VULNERABILIDADES
        // ══════════════════════════════════════════

        $vulnerabilidades = [
            // ── DVWA — Scan Full (#0) ──
            ['scan' => 0, 'target' => 0, 'nome' => 'SQL Injection', 'severidade' => 'critical',
             'cve_id' => 'CVE-2024-1234', 'descricao' => 'Injeção SQL encontrada no parâmetro id da página de login.',
             'url_afetada' => 'http://192.168.29.86:8082/vulnerabilities/sqli/'],
            ['scan' => 0, 'target' => 0, 'nome' => 'Cross-Site Scripting (XSS) - Reflected', 'severidade' => 'high',
             'cve_id' => null, 'descricao' => 'XSS refletido no campo de busca permite execução de scripts.',
             'url_afetada' => 'http://192.168.29.86:8082/vulnerabilities/xss_r/'],
            ['scan' => 0, 'target' => 0, 'nome' => 'Command Injection', 'severidade' => 'critical',
             'cve_id' => 'CVE-2023-5678', 'descricao' => 'Injeção de comandos OS no campo de ping.',
             'url_afetada' => 'http://192.168.29.86:8082/vulnerabilities/exec/'],
            ['scan' => 0, 'target' => 0, 'nome' => 'File Upload Vulnerability', 'severidade' => 'high',
             'descricao' => 'Upload de arquivo sem validação permite execução de código PHP.',
             'url_afetada' => 'http://192.168.29.86:8082/vulnerabilities/upload/'],
            ['scan' => 0, 'target' => 0, 'nome' => 'CSRF Token Missing', 'severidade' => 'medium',
             'descricao' => 'Formulário de alteração de senha não possui token CSRF.',
             'url_afetada' => 'http://192.168.29.86:8082/vulnerabilities/csrf/'],
            ['scan' => 0, 'target' => 0, 'nome' => 'Directory Listing Enabled', 'severidade' => 'low',
             'descricao' => 'Listagem de diretório habilitada expõe estrutura de arquivos.',
             'url_afetada' => 'http://192.168.29.86:8082/'],
            ['scan' => 0, 'target' => 0, 'nome' => 'Server Version Disclosure', 'severidade' => 'info',
             'descricao' => 'Header do servidor revela versão do Apache e PHP.',
             'url_afetada' => 'http://192.168.29.86:8082/'],

            // ── Juice Shop — Scan Full (#2) ──
            ['scan' => 2, 'target' => 1, 'nome' => 'Broken Authentication', 'severidade' => 'critical',
             'cve_id' => null, 'descricao' => 'Login com credenciais padrão admin/admin123.',
             'url_afetada' => 'http://localhost:3000/rest/user/login'],
            ['scan' => 2, 'target' => 1, 'nome' => 'Sensitive Data Exposure', 'severidade' => 'high',
             'descricao' => 'API expõe dados sensíveis de usuários sem autenticação.',
             'url_afetada' => 'http://localhost:3000/api/Users/'],
            ['scan' => 2, 'target' => 1, 'nome' => 'Insecure Direct Object Reference', 'severidade' => 'high',
             'cve_id' => null, 'descricao' => 'Acesso direto a objetos de outros usuários via manipulação de ID.',
             'url_afetada' => 'http://localhost:3000/api/BasketItems/'],
            ['scan' => 2, 'target' => 1, 'nome' => 'Missing Security Headers', 'severidade' => 'medium',
             'descricao' => 'Headers de segurança ausentes: X-Frame-Options, CSP.',
             'url_afetada' => 'http://localhost:3000/'],
            ['scan' => 2, 'target' => 1, 'nome' => 'Cookie Without HttpOnly Flag', 'severidade' => 'low',
             'descricao' => 'Cookie de sessão não possui flag HttpOnly.',
             'url_afetada' => 'http://localhost:3000/'],

            // ── API Interna — Scan Rápido (#3, em progresso) ──
            ['scan' => 3, 'target' => 2, 'nome' => 'Open API Documentation Exposed', 'severidade' => 'medium',
             'descricao' => 'Documentação Swagger acessível publicamente.',
             'url_afetada' => 'http://192.168.1.100:8080/swagger/'],
            ['scan' => 3, 'target' => 2, 'nome' => 'Missing Rate Limiting', 'severidade' => 'medium',
             'descricao' => 'API sem rate limiting permite ataques de força bruta.',
             'url_afetada' => 'http://192.168.1.100:8080/api/auth/login'],
            ['scan' => 3, 'target' => 2, 'nome' => 'TLS Certificate Expired', 'severidade' => 'info',
             'descricao' => 'Certificado TLS expirado há 15 dias.',
             'url_afetada' => 'http://192.168.1.100:8080'],

            // ── Test Site — Nmap (#4) ──
            ['scan' => 4, 'target' => 3, 'nome' => 'SSH Weak Cipher Suites', 'severidade' => 'medium',
             'descricao' => 'Servidor SSH aceita cipher suites fracas (arcfour, 3des).',
             'url_afetada' => 'testphp.vulnweb.com:22'],
            ['scan' => 4, 'target' => 3, 'nome' => 'FTP Anonymous Login', 'severidade' => 'high',
             'descricao' => 'Servidor FTP aceita login anônimo.',
             'url_afetada' => 'testphp.vulnweb.com:21'],
            ['scan' => 4, 'target' => 3, 'nome' => 'Open Port 3306 (MySQL)', 'severidade' => 'medium',
             'descricao' => 'Porta MySQL exposta publicamente.',
             'url_afetada' => 'testphp.vulnweb.com:3306'],
            ['scan' => 4, 'target' => 3, 'nome' => 'HTTP Methods Allowed (TRACE)', 'severidade' => 'low',
             'descricao' => 'Método HTTP TRACE habilitado no servidor.',
             'url_afetada' => 'http://testphp.vulnweb.com'],
            ['scan' => 4, 'target' => 3, 'nome' => 'ICMP Timestamp Response', 'severidade' => 'info',
             'descricao' => 'Servidor responde a requisições ICMP timestamp.',
             'url_afetada' => 'testphp.vulnweb.com'],

            // ── DVWA — Nuclei Scan (#1) ──
            ['scan' => 1, 'target' => 0, 'nome' => 'PHP Info Page Exposed', 'severidade' => 'medium',
             'descricao' => 'Página phpinfo() acessível publicamente.',
             'url_afetada' => 'http://192.168.29.86:8082/phpinfo.php'],
            ['scan' => 1, 'target' => 0, 'nome' => 'WordPress Login Page Detected', 'severidade' => 'info',
             'descricao' => 'Nuclei detectou página de login padrão.',
             'url_afetada' => 'http://192.168.29.86:8082/login.php'],
        ];

        foreach ($vulnerabilidades as $vulnData) {
            Vulnerabilidade::create([
                'scan_id'        => $createdScans[$vulnData['scan']]->id,
                'target_id'      => $createdTargets[$vulnData['target']]->id,
                'nome'           => $vulnData['nome'],
                'severidade'     => $vulnData['severidade'],
                'descricao'      => $vulnData['descricao'] ?? null,
                'cve_id'         => $vulnData['cve_id'] ?? null,
                'url_afetada'    => $vulnData['url_afetada'] ?? null,
                'falso_positivo' => false,
            ]);
        }

        $this->command->info('✅ Vulnix seeder executado com sucesso!');
        $this->command->info("   → {$createdTargets[0]->id} targets criados");
        $this->command->info("   → " . count($createdScans) . " scans criados");
        $this->command->info("   → " . count($vulnerabilidades) . " vulnerabilidades criadas");
    }
}
