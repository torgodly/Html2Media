<?php

namespace Torgodly\Html2Media\Traits;

use Closure;
use Filament\Actions\MountableAction;
use Filament\Support\Enums\Alignment;
use Filament\Support\Enums\MaxWidth;
use Filament\Support\Facades\FilamentIcon;
use Filament\Tables\Actions\Action;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Contracts\View\View;
use Illuminate\Support\HtmlString;

/**
 * Trait HasHtml2MediaActionBase
 * @package Torgodly\Html2Media\Traits
 * @mixin Action
 */
trait  HasHtml2MediaActionBase
{
    protected View|Htmlable|Closure|null $content = null;
    protected bool|Closure $preview = false;
    protected bool|Closure $print = true;
    protected bool|Closure $savePdf = false;
    protected string|Closure $filename = 'document.pdf';
    protected array|Closure $pagebreak = ['mode' => ['css', 'legacy'], 'after' => 'section'];
    protected string|Closure $orientation = 'portrait';  // Separate variable for orientation
    protected string|array|Closure $format = 'a4';  // Separate variable for format
    protected string|Closure $unit = 'mm';  // Separate variable for unit
    protected int|Closure $scale = 2;  // Separate variable for scale
    protected int|Closure|array $margin = 0; // Margin setting,
    protected bool|Closure $enableLinks = false; // Enable links PDF hyperlinks are automatically added ontop of all anchor tags.

    public function enableLinks(bool|Closure $enableLinks = true): static
    {
        $this->enableLinks = $enableLinks;
        return $this;
    }

    public function isEnableLinks(): bool
    {
        return $this->evaluate($this->enableLinks);
    }

    public function filename(string|Closure $filename = 'document'): static
    {
        $this->filename = $filename;
        return $this;
    }

    public function getFilename(): string
    {
        // Evaluate the filename (handle Closure if necessary)
        $filename = $this->evaluate($this->filename);

        // Extract the base name (remove all extensions)
        $baseName = pathinfo($filename, PATHINFO_FILENAME);

        // Return the cleaned filename with a single .pdf extension
        return $baseName . '.pdf';
    }

    public function pagebreak(string|Closure|null $after = 'section', array|Closure|null $mode = ['css', 'legacy'], string|Closure|null $avoid = null): static
    {
        $this->pagebreak = ['mode' => $mode, 'after' => $after, ...($avoid !== null ? ['avoid' => $avoid] : [])];
        return $this;
    }

    public function getPageBreak(): array
    {
        return $this->evaluate($this->pagebreak);
    }

    public function orientation(string|Closure|null $orientation = 'portrait'): static
    {
        $this->orientation = $orientation;
        return $this;
    }

    public function getOrientation(): string
    {
        return $this->evaluate($this->orientation);
    }

    public function format(string|array|Closure|null $format = 'a4', string|Closure|null $unit = 'mm'): static
    {
        $this->format = $format;
        $this->unit = $unit;
        return $this;
    }

    public function getFormat(): string|array
    {
        return $this->evaluate($this->format);
    }

    public function getUnit(): string
    {
        return $this->evaluate($this->unit);
    }

    public
    function scale(int|Closure|null $scale = 2): static
    {
        $this->scale = $scale;
        return $this;
    }

    public
    function getScale(): int
    {
        return $this->evaluate($this->scale);
    }


    public
    function margin(int|Closure|array|null $margin = 0): static
    {
        $this->margin = $margin;
        return $this;
    }

    public
    function getMargin(): int|array
    {
        return $this->evaluate($this->margin);
    }

    public
    function print(bool|Closure $print = true): static
    {
        $this->print = $print;

        return $this;
    }

    public function isPrint(): bool
    {
        return $this->evaluate($this->print);
    }

    public function savePdf(bool|Closure $savePdf = true): static
    {
        $this->savePdf = $savePdf;

        return $this;
    }

    public function isSavePdf(): bool
    {
        return $this->evaluate($this->savePdf);
    }

    public function preview(bool|Closure $preview = true): static
    {
        $this->preview = $preview;
        $this->modalContent(fn(MountableAction $action): ?Htmlable => $action->evaluate($preview) ? view('html2media::tables.actions.html-2-media-table-action', ['content' => $this->getContent()?->toHtml()]) : null);
        return $this;
    }

    public function isPreview()
    {
        return $this->evaluate($this->preview);
    }

    public function content(View|Htmlable|Closure|null $content = null): static
    {
        $this->content = $content;

        return $this;
    }

    public function getContent(): ?Htmlable
    {
        return $this->evaluate($this->content);
    }

    public function requiresConfirmation(bool|Closure $condition = true): static
    {
        $this->modalAlignment(fn(MountableAction $action): ?Alignment => $action->evaluate($condition) ? Alignment::Center : null);
        $this->modalFooterActionsAlignment(fn(MountableAction $action): ?Alignment => $action->evaluate($condition) ? Alignment::Center : null);
        $this->modalIcon(fn(MountableAction $action): ?string => $action->evaluate($condition) ? (FilamentIcon::resolve('actions::modal.confirmation') ?? 'heroicon-o-exclamation-triangle') : null);
        $this->modalHeading ??= fn(MountableAction $action): string|Htmlable|null => $action->evaluate($condition) ? $action->getLabel(true) : null;
        $this->modalDescription(fn(MountableAction $action): ?string => $action->evaluate($condition) ? __('filament-actions::modal.confirmation') : null);
        $this->modalSubmitActionLabel(fn(MountableAction $action): ?string => $action->evaluate($condition) ? __('filament-actions::modal.actions.confirm.label') : null);
        $this->modalWidth(fn(MountableAction $action): ?MaxWidth => $action->evaluate($condition) ? MaxWidth::Medium : null);


        return $this;
    }

    public function getLabel(bool|null $getOriginalLabel = false): string|Htmlable|null
    {
        $label = $this->evaluate($this->label) ?? (string)str($this->getName())
            ->before('.')
            ->kebab()
            ->replace(['-', '_'], ' ')
            ->ucfirst();

        $label = is_string($label) && $this->shouldTranslateLabel
            ? __($label)
            : $label;

        $OriginalLabel = $label;
        $label = new HtmlString($label . view('html2media::tables.actions.html-2-media-table-action', ['content' => $this->getContent()?->toHtml(), 'elementId' => $this->getElementId()]));
        return $getOriginalLabel ? $OriginalLabel : $label;

    }


    public function getElementId(): string
    {
        return $this->evaluate(fn($record) => $record->id.'-'.$this->name);
    }


    protected function setUp(): void
    {
        parent::setUp();
        $this->action(fn($record, $livewire) => !$this->shouldOpenModal() ?: $livewire->dispatch('triggerPrint', ...$this->getDispatchOptions()));

        $this->modalSubmitAction(false);
        $this->extraModalFooterActions([


            Action::make('SavePdf')
                ->translateLabel()
                ->visible(fn() => $this->isSavePdf())
                ->label('Save as PDF')
                ->action(fn($record, $livewire) => $livewire->dispatch('triggerPrint', ...$this->getDispatchOptions('savePdf'))),


            Action::make('Print')
                ->translateLabel()
                ->visible(fn() => $this->isPrint())
                ->label('Print')
                ->action(fn($record, $livewire) => $livewire->dispatch('triggerPrint', ...$this->getDispatchOptions('print'))),

        ]);

    }

    private function getDispatchOptions(string|null $action = null): array
    {
        return [
            'action' => $action ?: ($this->isSavePdf() ? 'savePdf' : ($this->isPrint() ? 'print' : null)),
            'element' => $this->getElementId(),
            'filename' => $this->getFilename(),
            'pagebreak' => [
                'mode' => $this->getPageBreak(),
            ],
            'jsPDF' => [
                'orientation' => $this->getOrientation(),
                'format' => $this->getFormat(),
                'unit' => $this->getUnit(),
            ],
            'html2canvas' => [
                'scale' => $this->getScale(),
                'useCORS' => true,
            ],
            'margin' => $this->getMargin(),
            'enableLinks' => $this->isEnableLinks(),
        ];
    }
}
