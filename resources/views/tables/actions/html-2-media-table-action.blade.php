<div style="display: {{ isset($elementId) ? 'none' : 'block' }}">
    <main id="print-smart-content-{{ $elementId ?? '' }}" wire:ignore>
        {!! $content !!}
        <iframe style="display: none" id="print-smart-iframe-{{ $elementId ?? '' }}"></iframe>
    </main>


</div>
