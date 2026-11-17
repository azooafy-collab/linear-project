// ============================================================================
// OCR AND PDF EXTRACTION HELPER (js/fileReader.js)
// ============================================================================
// Keeps image (Tesseract.js) and PDF (PDF.js) parsing separate from math operations.

const FR = {
  // Executes Tesseract OCR engine on image source
  ocr: async function(src, onStatus) {
    const workerResult = await Tesseract.recognize(src, 'eng', {
      logger: function(m) {
        if (m.status && onStatus) {
          let progressPercent = Math.round((m.progress || 0) * 100);
          onStatus(m.status + ' ' + progressPercent + '%');
        }
      }
    });
    return workerResult.data.text;
  },

  // Reads uploaded PDF or Image file
  read: async function(file, onStatus) {
    let isPdf = (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));

    if (isPdf) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let p = 1; p <= pdfDocument.numPages; p++) {
        const page = await pdfDocument.getPage(p);
        const textContent = await page.getTextContent();

        let pageText = '';
        for (let i = 0; i < textContent.items.length; i++) {
          let item = textContent.items[i];
          pageText += item.str + (item.hasEOL ? '\n' : ' ');
        }

        // Fallback to image OCR if PDF contains scanned image page
        if (pageText.replace(/\s/g, '').length < 5) {
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({ canvasContext: ctx, viewport: viewport }).promise;
          pageText = await FR.ocr(canvas, onStatus);
        }

        fullText += pageText + '\n';
      }
      return fullText;
    }

    return FR.ocr(file, onStatus);
  },

  // Filters lines containing "=" and cleans OCR dashes/symbols
  clean: function(text) {
    let lines = text.split('\n');
    let cleanedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let sanitized = line.replace(/[−–—]/g, '-').replace(/×/g, '*').trim();

      if (sanitized.includes('=')) {
        cleanedLines.push(sanitized);
      }
    }

    return cleanedLines.join('\n');
  }
};