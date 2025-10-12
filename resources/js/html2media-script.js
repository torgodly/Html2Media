document.addEventListener('triggerPrint', event => {
    // The new PHP trait sends an object with 'element' and 'options' keys.
    const { element, options } = event.detail[0];

    if (!element) {
        console.error('Html2Media: No element content was provided to print.');
        return;
    }

    if (!options) {
        console.error('Html2Media: No options were provided.');
        return;
    }

    console.log('Html2Media: Generating PDF with options:', options);

    // Chain the methods to configure and generate the PDF.
    const instance = html2media()
        .from(element)         // 1. Set the HTML content
        .options(options);     // 2. Apply all options from the backend at once

    // 3. Execute the final action based on the 'output' option.
    switch (options.output) {
        case 'download':
            instance.save(options.filename);
            break;
        case 'print':
            instance.print();
            break;
        case 'iframe':
            // This is used for the modal preview.
            instance.open();
            break;
        default:
            // Fallback to iframe if the output mode is unknown.
            console.warn(`Html2Media: Unknown output mode '${options.output}'. Defaulting to iframe preview.`);
            instance.open();
            break;
    }
});
