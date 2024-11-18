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
            ->hasViews();

    }

    public function packageBooted()
    {
        FilamentAsset::register([
            Js::make('html2pdf', 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js'),
            Js::make('html2pdf-script', __DIR__ . '/../resources/js/html2pdf.js'),
        ], 'html2media');
    }
}
