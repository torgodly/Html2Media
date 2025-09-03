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
            ->hasViews()
            ->hasAssets();

    }

    public function packageBooted(): void
    {
        FilamentAsset::register([
            Js::make('es6-promise-script', __DIR__ . '/../resources/js/es6-promise.min.js'),
            Js::make('jspdf-script', __DIR__ . '/../resources/js/jspdf.umd.min.js'),
            Js::make('html2canvas-script', __DIR__ . '/../resources/js/html2canvas.min.js'),
            Js::make('html2pdf-lib', __DIR__ . '/../resources/js/html2pdf.min.js'),
            Js::make('html2media-script', __DIR__ . '/../resources/js/html2media.js'),
        ], 'html2media');
    }
}
