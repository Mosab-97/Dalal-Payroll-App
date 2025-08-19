import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export async function performOCR(file: File): Promise<OCRResult> {
  try {
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (file.type.startsWith('image/')) {
      return await extractTextFromImage(file);
    } else {
      throw new Error('Unsupported file type for OCR');
    }
  } catch (error) {
    console.error('OCR Error:', error);
    return { text: '', confidence: 0 };
  }
}

async function extractTextFromImage(file: File): Promise<OCRResult> {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: m => console.log(m)
  });
  
  return {
    text: result.data.text,
    confidence: result.data.confidence
  };
}

async function extractTextFromPDF(file: File): Promise<OCRResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  let totalConfidence = 0;
  let pageCount = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Try to extract text directly first
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    if (pageText.trim()) {
      fullText += pageText + '\n';
      totalConfidence += 95; // High confidence for direct text extraction
      pageCount++;
    } else {
      // If no text found, render page and perform OCR
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert canvas to blob for OCR
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(resolve as any, 'image/png');
      });

      const result = await Tesseract.recognize(blob!, 'eng');
      fullText += result.data.text + '\n';
      totalConfidence += result.data.confidence;
      pageCount++;
    }
  }

  return {
    text: fullText,
    confidence: pageCount > 0 ? totalConfidence / pageCount : 0
  };
}

export function parseOCRTextToData(text: string, type: 'employees' | 'payroll' | 'advances' | 'expenses'): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  const data: any[] = [];

  // Simple parsing logic - in production, this would be more sophisticated
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    switch (type) {
      case 'employees':
        if (parts.length >= 4) {
          data.push({
            name: parts[0] + ' ' + (parts[1] || ''),
            employee_id: parts[2] || '',
            role: parts[3] || '',
            date_of_join: new Date().toISOString().split('T')[0]
          });
        }
        break;
      case 'payroll':
        if (parts.length >= 3) {
          data.push({
            employee_id: parts[0],
            hours_worked: parseFloat(parts[1]) || 0,
            month: new Date().toISOString().slice(0, 7) + '-01'
          });
        }
        break;
      case 'advances':
        if (parts.length >= 3) {
          data.push({
            employee_id: parts[0],
            amount: parseFloat(parts[1]) || 0,
            description: parts.slice(2).join(' '),
            date: new Date().toISOString().split('T')[0]
          });
        }
        break;
      case 'expenses':
        if (parts.length >= 3) {
          data.push({
            category: parts[0],
            amount: parseFloat(parts[1]) || 0,
            notes: parts.slice(2).join(' '),
            date: new Date().toISOString().split('T')[0]
          });
        }
        break;
    }
  }

  return data;
}