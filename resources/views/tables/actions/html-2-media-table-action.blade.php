<div style="display: {{ isset($elementId) ? 'none' : 'block' }}">
    <main id="print-smart-content-{{ $elementId ?? '' }}" style="color: black;" wire:ignore>
        {!! $content !!}
        <iframe style="display: none" id="print-smart-iframe-{{ $elementId ?? '' }}"></iframe>
    </main>


</div>
