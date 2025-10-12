<?php

namespace Torgodly\Html2Media\Traits;

use Closure;
use Filament\Actions\Action;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Contracts\View\View;
use Illuminate\Support\HtmlString;
use InvalidArgumentException;

/**
 * Trait HasHtml2MediaActionBase
 * @package Torgodly\Html2Media\Traits
 * @mixin Action
 */
trait HasHtml2MediaActionBase
{
    // Core Properties
    protected View|Htmlable|Closure|null $content = null;
    protected bool|Closure $preview = false;
    protected bool|Closure $print = true;
    protected bool|Closure $savePdf = false;
    protected string|Closure $filename = 'document.pdf';

    // PDF Generation Options
    protected string|Closure $pageBreakMode = 'none';
    protected string|Closure $selector = '';
    protected bool|Closure $enableLinks = true;
    protected string|array|Closure $format = 'a4';
    protected string|Closure $orientation = 'portrait';
    protected array|Closure $margins = ['top' => 20, 'right' => 20, 'bottom' => 20, 'left' => 20];
    protected string|Closure $overflow = 'paginate';
    protected bool|Closure $showPageNumbers = true;
    protected string|Closure $pageNumberPosition = 'bottom-center';

    // --- Fluent Methods for Configuration ---

    public function content(View|Htmlable|Closure|null $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function filename(string|Closure $filename): static
    {
        $this->filename = $filename;
        return $this;
    }

    public function pageBreakMode(string|Closure $mode): static
    {
        // Valid modes: 'none', 'class', 'tag'
        $this->pageBreakMode = $mode;
        return $this;
    }

    public function selector(string|Closure $selector): static
    {
        $this->selector = $selector;
        return $this;
    }

    public function enableLinks(bool|Closure $enable = true): static
    {
        $this->enableLinks = $enable;
        return $this;
    }

    public function format(string|array|Closure $format): static
    {
        $this->format = $format;
        return $this;
    }

    public function orientation(string|Closure $orientation): static
    {
        // Valid orientations: 'portrait', 'landscape'
        $this->orientation = $orientation;
        return $this;
    }

    /**
     * Set the PDF margins, similar to CSS shorthand.
     *
     * @param mixed ...$margins Can be a single number (all sides), two numbers (top/bottom, left/right),
     *                          four numbers (top, right, bottom, left), or an associative array.
     * @return $this
     */
    public function margins(...$margins): static
    {
        if (count($margins) === 1) {
            if (is_array($margins[0])) {
                $this->margins = array_merge($this->evaluate($this->margins), $margins[0]);
            } elseif (is_numeric($margins[0])) {
                $m = $margins[0];
                $this->margins = ['top' => $m, 'right' => $m, 'bottom' => $m, 'left' => $m];
            } else {
                throw new InvalidArgumentException('Invalid margin format.');
            }
        } elseif (count($margins) === 2) {
            $this->margins = ['top' => $margins[0], 'right' => $margins[1], 'bottom' => $margins[0], 'left' => $margins[1]];
        } elseif (count($margins) === 4) {
            $this->margins = ['top' => $margins[0], 'right' => $margins[1], 'bottom' => $margins[2], 'left' => $margins[3]];
        }

        return $this;
    }

    public function overflow(string|Closure $overflow): static
    {
        // Valid modes: 'paginate', 'cut'
        $this->overflow = $overflow;
        return $this;
    }

    public function showPageNumbers(bool|Closure $show = true): static
    {
        $this->showPageNumbers = $show;
        return $this;
    }

    public function pageNumberPosition(string|Closure $position): static
    {
        // e.g., 'bottom-center', 'bottom-right', 'top-center', 'top-right'
        $this->pageNumberPosition = $position;
        return $this;
    }

    // --- Action Behavior ---

    public function print(bool|Closure $print = true): static
    {
        $this->print = $print;
        return $this;
    }

    public function savePdf(bool|Closure $savePdf = true): static
    {
        $this->savePdf = $savePdf;
        return $this;
    }

    public function preview(bool|Closure $preview = true): static
    {
        $this->preview = $preview;
        $this->modalContent(fn(Action $action): ?HtmlString => $action->evaluate($preview)
            ? new HtmlString($this->getContent()?->toHtml())
            : null
        );
        return $this;
    }

    // --- Getters for Evaluation ---

    public function getContent(): ?Htmlable
    {
        return $this->evaluate($this->content);
    }

    public function getFilename(): string
    {
        $filename = pathinfo($this->evaluate($this->filename), PATHINFO_FILENAME);
        return $filename . '.pdf';
    }

    // --- Core Action Setup ---

    protected function setUp(): void
    {
        parent::setUp();
        $this->action(fn(Action $action) => !$action->shouldOpenModal() ? $action->getLivewire()->dispatch('triggerPrint', $this->getDispatchOptions()) : null);

        $this->modalSubmitAction(false);
        $this->extraModalFooterActions([
            $this->savePdfAction(),
            $this->printAction(),
        ]);
    }

    public function savePdfAction(): Action
    {
        return Action::make('SavePdf')
            ->label(__('Save as PDF'))
            ->visible(fn() => $this->evaluate($this->savePdf))
            ->action(fn(Action $action) => $action->getLivewire()->dispatch('triggerPrint', $this->getDispatchOptions('download')));
    }

    public function printAction(): Action
    {
        return Action::make('Print')
            ->label(__('Print'))
            ->visible(fn() => $this->evaluate($this->print))
            ->action(fn(Action $action) => $action->getLivewire()->dispatch('triggerPrint', $this->getDispatchOptions('print')));
    }

    /**
     * Consolidates all settings into a single array for the JavaScript front-end.
     */
    private function getDispatchOptions(?string $output = null): array
    {
        // Determine the primary action if not explicitly provided
        if ($output === null) {
            $output = $this->evaluate($this->savePdf) ? 'download' : ($this->evaluate($this->print) ? 'print' : 'iframe');
        }

        return [
            'element' => $this->getContent()?->toHtml(),
            'options' => [
                'pageBreakMode' => $this->evaluate($this->pageBreakMode),
                'selector' => $this->evaluate($this->selector),
                'enableLinks' => $this->evaluate($this->enableLinks),
                'output' => $output,
                'filename' => $this->getFilename(),
                'format' => $this->evaluate($this->format),
                'orientation' => $this->evaluate($this->orientation),
                'margins' => $this->evaluate($this->margins),
                'overflow' => $this->evaluate($this->overflow),
                'showPageNumbers' => $this->evaluate($this->showPageNumbers),
                'pageNumberPosition' => $this->evaluate($this->pageNumberPosition),
            ],
        ];
    }
}
