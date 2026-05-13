<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     * Executa o VulnixSeeder para popular dados de demonstração.
     */
    public function run(): void
    {
        $this->call([
            VulnixSeeder::class,
        ]);
    }
}
