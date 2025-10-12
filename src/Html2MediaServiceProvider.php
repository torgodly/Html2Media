<?php

namespace Torgodly\Html2Media;

use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class Html2MediaServiceProvider extends PackageServiceProvider
{

    public function configurePackage(Package $package): void
    {
        $package
            ->name('html2media')
            ->hasAssets();

    }

    public function packageBooted(): void
    {
        FilamentAsset::register([
            Js::make('jspdf-script', __DIR__ . '/../resources/js/jspdf.umd.min.js'),
            Js::make('html2canvas-pro-script', __DIR__ . '/../resources/js/html2canvas-pro.min.js'),
            Js::make('html2media', __DIR__ . '/../resources/js/html2media-main.js'),
            Js::make('html2media-script', __DIR__ . '/../resources/js/html2media-script.js'),
        ], 'html2media');
    }
}
