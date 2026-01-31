<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\modrinthbrowser\PluginController;

Route::post('/download', [PluginController::class, 'download'])->name('extension.modrinthbrowser.download');
