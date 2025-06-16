document.addEventListener('DOMContentLoaded', function () {
    Livewire.on('triggerPrint', function (options = {}) {
        console.log('triggerPrint', options);

        performAction(options);
    });

    Livewire.on('switchContent', function (args) {
        const elementId  = args[0];
        const newContent = args[1];

        console.log('Switching content for element:', elementId);
        console.log(newContent);

        const element = document.getElementById(`print-smart-content-${elementId}`);
        if (element) {
            // Replace the content of the element
            element.innerHTML = newContent;

            // Optional: Replace spaces in text nodes
            replaceSpacesInTextNodes(element);

            console.log('Content updated successfully.');
        } else {
            console.error(`Element with ID "print-smart-content-${elementId}" not found.`);
        }
    });
});


function performAction({ action = 'print', element, ...customOptions } = {}) {
    const printElement = document.getElementById(`print-smart-content-${element}`);

    // Enhanced default options for html2pdf
    const defaultOptions = {
        filename: 'document.pdf',
        pagebreak: {
            mode: ['css'],
            avoid: '.invoice-section'
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: true
        },
        html2canvas: {
            scale: 0.75, // Crucial for proper scaling
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0
        },
        margin: [10, 10, 10, 10], // Top, Right, Bottom, Left
        imageType: 'image/jpeg',
        imageQuality: 0.95
    };

    // Merge custom options with defaults
    const options = {
        ...defaultOptions,
        ...customOptions,
        pagebreak: {
            ...defaultOptions.pagebreak,
            ...(customOptions.pagebreak || {})
        },
        jsPDF: {
            ...defaultOptions.jsPDF,
            ...(customOptions.jsPDF || {})
        },
        html2canvas: {
            ...defaultOptions.html2canvas,
            ...(customOptions.html2canvas || {})
        }
    };

    if (printElement) {
        // Temporary fix for content measurement
        const originalDisplay = printElement.style.display;
        printElement.style.display = 'block';

        switch (action) {
            case 'savePdf':
                html2pdf()
                    .set(options)
                    .from(printElement)
                    .toPdf()
                    .get('pdf')
                    .then((pdf) => {
                        const totalPages = pdf.internal.getNumberOfPages();
                        for (let i = 1; i <= totalPages; i++) {
                            pdf.setPage(i);
                            pdf.setFontSize(8);
                            pdf.text(`Page ${i} of ${totalPages}`,
                                pdf.internal.pageSize.width - 25,
                                pdf.internal.pageSize.height - 10
                            );
                        }
                    })
                    .save();
                break;

            case 'print':
                html2pdf()
                    .set(options)
                    .from(printElement)
                    .toPdf()
                    .get('pdf')
                    .then((pdf) => {
                        const blob = pdf.output('blob');
                        const url = URL.createObjectURL(blob);
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        document.body.appendChild(iframe);

                        iframe.onload = function () {
                            setTimeout(() => {
                                iframe.contentWindow.focus();
                                iframe.contentWindow.print();
                                URL.revokeObjectURL(url);
                                document.body.removeChild(iframe);
                            }, 500);
                        };
                        iframe.src = url;
                    });
                break;

            default:
                console.error('Unsupported action:', action);
        }

        // Reset display property
        setTimeout(() => {
            printElement.style.display = originalDisplay;
        }, 1000);
    } else {
        console.error(`Element with ID "print-smart-content-${element}" not found.`);
    }
}
function replaceSpacesInTextNodes(element) {
    element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
            // Replace spaces and hyphens with non-breaking equivalents
            node.textContent = node.textContent
                .replace(/\s/g, "\u00a0") // Non-breaking space
                .replace(/-/g, "\u2011"); // Non-breaking hyphen
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Add RTL direction for all elements
            node.style.direction = 'rtl';
            node.style.unicodeBidi = 'embed';
            replaceSpacesInTextNodes(node);
        }
    });
}
