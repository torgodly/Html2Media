// html2media.js
// Lightweight helper: render DOM to PDF using html2canvas + jsPDF.
// - Public API: html2media().from(el).<setters>().save()/print()/open()
// - Core function: html2media.htmlToPdf(elementOrHtml, options) -> jsPDF instance
//
// Design goals:
// - Keep internal math in pixels (1 canvas px -> 1 PDF px)
// - Provide simple chainable setters for common options
// - Minimal, well-documented code for future maintenance

; (function (global) {
    // ---------- Helpers & defaults ----------
    const DEFAULTS = {
        pageBreakMode: 'none', // 'none' | 'class' | 'tag'
        selector: '',
        enableLinks: true,
        output: 'iframe', // 'iframe' | 'download' | 'print'
        format: 'a4', // jsPDF format string
        orientation: 'portrait',
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        overflow: 'cut', // 'paginate' | 'cut' - how to handle content taller than a single page
        showPageNumbers: true,
        pageNumberPosition: 'bottom-center'
    };

    // --- Enum-like frozen objects for common string options ---
    const PAGE_BREAK_MODES = Object.freeze({ NONE: 'none', CLASS: 'class', TAG: 'tag' });
    const OUTPUT_MODES = Object.freeze({ IFRAME: 'iframe', DOWNLOAD: 'download', PRINT: 'print' });
    const ORIENTATIONS = Object.freeze({ PORTRAIT: 'portrait', LANDSCAPE: 'landscape' });
    const PAGE_NUMBER_POSITIONS = Object.freeze({
        BOTTOM_CENTER: 'bottom-center',
        BOTTOM_RIGHT: 'bottom-right',
        TOP_CENTER: 'top-center',
        TOP_RIGHT: 'top-right'
    });
    const OVERFLOW_MODES = Object.freeze({ PAGINATE: 'paginate', CUT: 'cut' });

    // Render a DOM node to canvas using html2canvas.
    async function renderToCanvas(node, scale = 2) {
        return await html2canvas(node, { scale, useCORS: true, logging: false });
    }

    // Merge user options with defaults, ensuring margins are preserved
    function mergeOptions(userOptions) {
        const out = Object.assign({}, DEFAULTS, userOptions || {});
        if (userOptions && userOptions.margins) {
            out.margins = Object.assign({}, DEFAULTS.margins, userOptions.margins);
        }
        return out;
    }

    // textFromHtml removed (footer HTML support removed)

    // ---------- Core: htmlToPdf ----------
    // input: Element | string (HTML) | undefined (defaults to #invoice)
    // options: merged via mergeOptions
    async function htmlToPdf(input, options) {
        const opts = mergeOptions(options);

        // Resolve root element to render
        let rootEl = null;
        let cleanupRoot = null;
        if (typeof input === 'string') {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.innerHTML = input;
            document.body.appendChild(container);
            rootEl = container;
            cleanupRoot = container;
        } else if (input instanceof Element) {
            rootEl = input;
        } else {
            rootEl = document.getElementById('invoice');
        }
        if (!rootEl) throw new Error('No root element to render');

        // Clone the node offscreen so measurements (bounding rects) are stable
        const cloneRoot = rootEl.cloneNode(true);
        const rootRect = rootEl.getBoundingClientRect();
        cloneRoot.style.boxSizing = 'border-box';
        cloneRoot.style.width = rootRect.width + 'px';
        cloneRoot.style.position = 'fixed';
        cloneRoot.style.left = '-9999px';
        cloneRoot.style.top = '0';
        document.body.appendChild(cloneRoot);

        // Pick nodes to render depending on page-break mode
        let nodesToRender;
        if (opts.pageBreakMode === 'class') {
            const sel = opts.selector || '.pdf-page';
            const found = cloneRoot.querySelectorAll(sel);
            nodesToRender = found.length ? Array.from(found) : [cloneRoot];
        } else if (opts.pageBreakMode === 'tag') {
            const tag = opts.selector || 'section';
            const found = cloneRoot.getElementsByTagName(tag);
            nodesToRender = found.length ? Array.from(found) : [cloneRoot];
        } else {
            nodesToRender = [cloneRoot];
        }

        // Render each node to canvas and capture link bounding rects
        const rendered = [];
        for (const node of nodesToRender) {
            const links = Array.from(node.querySelectorAll('a[href]'));
            const linkRects = links.map(a => a.getBoundingClientRect());
            const nodeRect = node.getBoundingClientRect();
            const canvas = await renderToCanvas(node, 2);
            rendered.push({ node, canvas, nodeRect, links, linkRects });
        }

        // Get page size (in pixels) from jsPDF using the requested format/orientation
        const { jsPDF } = window.jspdf;
        const tempPdf = new jsPDF({ unit: 'px', format: opts.format || DEFAULTS.format, orientation: opts.orientation || DEFAULTS.orientation });
        const pageW = tempPdf.internal.pageSize.getWidth();
        const pageH = tempPdf.internal.pageSize.getHeight();

        const margins = opts.margins || DEFAULTS.margins;
        const contentWidth = pageW - margins.left - margins.right;
        const contentHeight = pageH - margins.top - margins.bottom;

        // Build page-sized canvas slices (if needed) and compute per-page scale (ratio)
        const pages = [];
        if (opts.pageBreakMode === 'none' && rendered.length === 1) {
            // Single long canvas -> slice vertically into pages
            const fullCanvas = rendered[0].canvas;
            // allow upscaling so larger paper sizes (eg. A3) actually enlarge content
            const ratio = (contentWidth / fullCanvas.width) || 1;
            const sliceHeightPx = Math.floor(contentHeight / ratio) || fullCanvas.height;
            const pageCount = (opts.overflow === 'cut' || opts.overflow === OVERFLOW_MODES.CUT) ? 1 : Math.ceil(fullCanvas.height / sliceHeightPx);
            for (let p = 0; p < pageCount; p++) {
                const slice = document.createElement('canvas');
                slice.width = fullCanvas.width;
                slice.height = Math.min(sliceHeightPx, fullCanvas.height - p * sliceHeightPx);
                const ctx = slice.getContext('2d');
                ctx.drawImage(fullCanvas, 0, p * sliceHeightPx, slice.width, slice.height, 0, 0, slice.width, slice.height);
                pages.push({ canvas: slice, renderedIndex: 0, pageIndexWithinRendered: p, ratio });
            }
        } else {
            // One page per rendered node (but allow slicing/pagination per node)
            for (let i = 0; i < rendered.length; i++) {
                const c = rendered[i].canvas;
                // allow upscaling to fit the page width
                const ratio = (contentWidth / c.width) || 1;
                const sliceHeightPx = Math.max(1, Math.floor(contentHeight / ratio));
                if (c.height <= sliceHeightPx) {
                    pages.push({ canvas: c, renderedIndex: i, pageIndexWithinRendered: 0, ratio });
                } else {
                    if (opts.overflow === 'cut' || opts.overflow === OVERFLOW_MODES.CUT) {
                        // only keep the first slice (crop)
                        const slice = document.createElement('canvas');
                        slice.width = c.width;
                        slice.height = sliceHeightPx;
                        const ctx = slice.getContext('2d');
                        ctx.drawImage(c, 0, 0, slice.width, slice.height, 0, 0, slice.width, slice.height);
                        pages.push({ canvas: slice, renderedIndex: i, pageIndexWithinRendered: 0, ratio });
                    } else {
                        // paginate (slice into multiple pages)
                        const pageCountForNode = Math.ceil(c.height / sliceHeightPx);
                        for (let p = 0; p < pageCountForNode; p++) {
                            const slice = document.createElement('canvas');
                            slice.width = c.width;
                            slice.height = Math.min(sliceHeightPx, c.height - p * sliceHeightPx);
                            const ctx = slice.getContext('2d');
                            ctx.drawImage(c, 0, p * sliceHeightPx, slice.width, slice.height, 0, 0, slice.width, slice.height);
                            pages.push({ canvas: slice, renderedIndex: i, pageIndexWithinRendered: p, ratio });
                        }
                    }
                }
            }
        }

        // Create final PDF (px units) and draw pages
        const pdf = new jsPDF({ unit: 'px', format: opts.format || DEFAULTS.format, orientation: opts.orientation || DEFAULTS.orientation });

        function drawFooterAndPageNumber(pdfDoc, pageIndex, pageCount) {
            const fontSize = 10;
            pdfDoc.setFontSize(fontSize);
            pdfDoc.setTextColor(80);
            // Ensure page numbers are positioned inside the page (respecting margins)
            const labelYBottom = pageH - Math.max(6, margins.bottom / 2);
            const labelYTop = margins.top + fontSize;
            if (opts.showPageNumbers) {
                const pageLabel = `${pageIndex + 1} / ${pageCount}`;
                const textWidth = pdfDoc.getTextWidth(pageLabel);
                let x = margins.left;
                let y = labelYBottom;
                const pos = opts.pageNumberPosition || DEFAULTS.pageNumberPosition;
                if (pos === PAGE_NUMBER_POSITIONS.BOTTOM_CENTER || pos === 'bottom-center') x = (pageW - textWidth) / 2;
                else if (pos === PAGE_NUMBER_POSITIONS.BOTTOM_RIGHT || pos === 'bottom-right') x = pageW - margins.right - textWidth;
                else if (pos === PAGE_NUMBER_POSITIONS.TOP_CENTER || pos === 'top-center') { x = (pageW - textWidth) / 2; y = labelYTop; }
                else if (pos === PAGE_NUMBER_POSITIONS.TOP_RIGHT || pos === 'top-right') { x = pageW - margins.right - textWidth; y = labelYTop; }
                pdfDoc.text(pageLabel, x, y);
            }
        }

        // Draw each page image and (optionally) add link annotations
        for (let pi = 0; pi < pages.length; pi++) {
            const page = pages[pi];
            const canvas = page.canvas;
            const ratio = page.ratio;
            const imgW = Math.round(canvas.width * ratio);
            const imgH = Math.round(canvas.height * ratio);
            const xOffset = margins.left + Math.max(0, Math.floor((contentWidth - imgW) / 2));
            const yOffset = margins.top;

            if (pi > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, imgW, imgH);

            if (opts.enableLinks) {
                const renderedEntry = rendered[page.renderedIndex];
                const nodeRect = renderedEntry.nodeRect;
                for (let li = 0; li < renderedEntry.links.length; li++) {
                    const a = renderedEntry.links[li];
                    const rect = renderedEntry.linkRects[li];

                    // Map DOM rect -> canvas coordinates
                    const relLeft = rect.left - nodeRect.left;
                    const relTop = rect.top - nodeRect.top;
                    const canvasLeft = relLeft * (canvas.width / nodeRect.width);
                    const canvasTop = relTop * (canvas.height / nodeRect.height);
                    const canvasW = rect.width * (canvas.width / nodeRect.width);
                    const canvasH = rect.height * (canvas.height / nodeRect.height);

                    // If we sliced the long canvas, account for vertical slice offset
                    let pageOffsetCanvasY = 0;
                    if (opts.pageBreakMode === 'none' && rendered.length === 1) {
                        pageOffsetCanvasY = page.pageIndexWithinRendered * Math.floor(contentHeight / ratio);
                    }

                    const linkCanvasY = canvasTop - pageOffsetCanvasY;
                    if (linkCanvasY + canvasH <= 0 || linkCanvasY >= canvas.height) continue;

                    const pdfX = xOffset + Math.round(canvasLeft * ratio);
                    const pdfY = Math.round(linkCanvasY * ratio) + yOffset;
                    const pdfW = Math.round(canvasW * ratio);
                    const pdfH = Math.round(canvasH * ratio);
                    try { pdf.link(pdfX, pdfY, pdfW, pdfH, { url: a.href }); } catch (e) { /* ignore */ }
                }
            }
        }

        // Footer & page numbers on each page
        const pageCount = pages.length;
        for (let i = 0; i < pageCount; i++) { pdf.setPage(i + 1); drawFooterAndPageNumber(pdf, i, pageCount); }

        // Output
        if (opts.output === 'download') pdf.save(opts.filename || 'document.pdf');
        else {
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            if (opts.output === 'iframe') {
                const frame = document.getElementById('pdfViewer');
                if (frame) { frame.src = url; frame.style.display = 'block'; }
            } else if (opts.output === 'print') {
                let frame = document.getElementById('pdfPrintFrame');
                if (!frame) { frame = document.createElement('iframe'); frame.id = 'pdfPrintFrame'; frame.style.display = 'none'; document.body.appendChild(frame); }
                frame.src = url; frame.onload = () => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { console.error(e); } };
            }
        }

        // Cleanup cloned nodes
        try { document.body.removeChild(cloneRoot); } catch (e) { }
        if (cleanupRoot) try { document.body.removeChild(cleanupRoot); } catch (e) { }

        return pdf;
    }

    // ---------- Chainable factory ----------
    function createFactory() {
        const state = { input: null, opts: {} };

        return {
            // set input (Element or HTML string)
            from(elOrHtml) { state.input = elOrHtml; return this; },
            // merge options object
            options(o) { state.opts = Object.assign({}, state.opts, o); return this; },
            // chainable setters
            enableLinks(val = true) { state.opts.enableLinks = !!val; return this; },

            // pageBreakMode: accepts enum value or raw string
            pageBreakMode(mode) {
                const m = String(mode || '').toLowerCase();
                if ([PAGE_BREAK_MODES.NONE, PAGE_BREAK_MODES.CLASS, PAGE_BREAK_MODES.TAG].includes(m)) state.opts.pageBreakMode = m;
                else state.opts.pageBreakMode = DEFAULTS.pageBreakMode;
                return this;
            },

            selector(sel) { state.opts.selector = sel; return this; },

            // margins: accept object {top,right,bottom,left} or numbers (1,2,3,4 args)
            margins(...args) {
                let m = {};
                if (args.length === 1 && typeof args[0] === 'object') {
                    m = Object.assign({}, state.opts.margins || {}, args[0]);
                } else if (args.length === 1 && typeof args[0] === 'number') {
                    m = { top: args[0], right: args[0], bottom: args[0], left: args[0] };
                } else if (args.length === 2) {
                    m = { top: args[0], right: args[1], bottom: args[0], left: args[1] };
                } else if (args.length === 3) {
                    m = { top: args[0], right: args[1], bottom: args[2], left: args[1] };
                } else if (args.length === 4) {
                    m = { top: args[0], right: args[1], bottom: args[2], left: args[3] };
                } else {
                    m = Object.assign({}, state.opts.margins || {});
                }
                state.opts.margins = Object.assign({}, state.opts.margins || {}, m);
                return this;
            },

            format(f) { state.opts.format = f; return this; },

            // overflow: 'paginate' | 'cut'
            overflow(o) { const v = String(o || '').toLowerCase(); if ([OVERFLOW_MODES.PAGINATE, OVERFLOW_MODES.CUT].includes(v)) state.opts.overflow = v; else state.opts.overflow = DEFAULTS.overflow; return this; },

            // orientation: accepts enum or raw
            orientation(o) {
                const v = String(o || '').toLowerCase();
                if ([ORIENTATIONS.PORTRAIT, ORIENTATIONS.LANDSCAPE].includes(v)) state.opts.orientation = v;
                else state.opts.orientation = DEFAULTS.orientation;
                return this;
            },

            // footerText and footerIsHtml removed — footer HTML support not present

            showPageNumbers(v = true) { state.opts.showPageNumbers = !!v; return this; },

            // pageNumberPosition: accept enum or raw string
            pageNumberPosition(p) {
                const v = String(p || '').toLowerCase();
                if (Object.values(PAGE_NUMBER_POSITIONS).includes(v)) state.opts.pageNumberPosition = v;
                else state.opts.pageNumberPosition = DEFAULTS.pageNumberPosition;
                return this;
            },

            // expose enums on instances for convenience
            ENUMS: { PAGE_BREAK_MODES, OUTPUT_MODES, ORIENTATIONS, PAGE_NUMBER_POSITIONS, OVERFLOW_MODES },
            async _runWithOutput(outputMode) {
                const merged = Object.assign({}, state.opts, { output: outputMode });
                return await htmlToPdf(state.input || document.getElementById('invoice'), merged);
            },
            async save(name = 'document.pdf') { state.opts.filename = name; return this._runWithOutput(OUTPUT_MODES.DOWNLOAD); },
            async print() { return this._runWithOutput(OUTPUT_MODES.PRINT); },
            async open(asBlob = false) { const pdf = await this._runWithOutput(OUTPUT_MODES.IFRAME); try { if (asBlob && pdf && pdf.output) return pdf.output('blob'); } catch (e) { } return pdf; }
        };
    }

    function html2mediaFactory() { return createFactory(); }

    // attach enums to factory for users who want to reference them
    html2mediaFactory.PAGE_BREAK_MODES = PAGE_BREAK_MODES;
    html2mediaFactory.OUTPUT_MODES = OUTPUT_MODES;
    html2mediaFactory.ORIENTATIONS = ORIENTATIONS;
    html2mediaFactory.PAGE_NUMBER_POSITIONS = PAGE_NUMBER_POSITIONS;
    html2mediaFactory.OVERFLOW_MODES = OVERFLOW_MODES;

    // expose API
    html2mediaFactory.htmlToPdf = htmlToPdf;
    html2mediaFactory.factory = createFactory;
    global.html2media = html2mediaFactory;

}(window));
//fuck js
console.log('fuck js')
