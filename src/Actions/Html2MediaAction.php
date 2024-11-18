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
}
