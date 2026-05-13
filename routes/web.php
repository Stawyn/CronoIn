<?php

use Illuminate\Support\Facades\Route;
use App\Livewire\Dashboard;
use App\Livewire\TargetIndex;
use App\Livewire\TargetForm;
use App\Livewire\ScanIndex;
use App\Livewire\ScanForm;

/*
|--------------------------------------------------------------------------
| Vulnix — Rotas Web
|--------------------------------------------------------------------------
|
| Dashboard (Overview): /
| Targets CRUD:         /targets, /targets/create, /targets/{id}/edit
| Scans CRUD:           /scans, /scans/create, /scans/{id}/edit
|
*/

// ══ Dashboard ══
Route::get('/', Dashboard::class)->name('dashboard');

// ══ Targets ══
Route::get('/targets', TargetIndex::class)->name('targets.index');
Route::get('/targets/create', TargetForm::class)->name('targets.create');
Route::get('/targets/{target}/edit', TargetForm::class)->name('targets.edit');

// ══ Scans ══
Route::get('/scans', ScanIndex::class)->name('scans.index');
Route::get('/scans/create', ScanForm::class)->name('scans.create');
Route::get('/scans/{scan}/edit', ScanForm::class)->name('scans.edit');

// ══ Discovery ══
use App\Livewire\DiscoveryIndex;
Route::get('/discovery', DiscoveryIndex::class)->name('discovery');
