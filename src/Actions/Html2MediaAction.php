<?php

namespace Torgodly\Html2Media\Actions;

use Filament\Actions\Action;
use Torgodly\Html2Media\Traits\HasHtml2MediaActionBase;

class Html2MediaAction extends Action
{
    use HasHtml2MediaActionBase;

    public function getElementId(): string
    {
        return $this->name;
    }

    
    public function savePdfAction(): Action
    {
        return Action::make('SavePdfs')
            ->translateLabel()
            ->visible(fn() => $this->isSavePdf())
            ->label('Save as PDF')
            ->action(fn($record, $livewire) => $livewire->dispatch('triggerPrint', ...$this->getDispatchOptions('savePdf')));
    }

    public function printAction(): Action
    {
        return Action::make('Print')
            ->translateLabel()
            ->visible(fn() => $this->isPrint())
            ->label('Print')
            ->action(fn($record, $livewire) => $livewire->dispatch('triggerPrint', ...$this->getDispatchOptions('print')));
    }

    
}
