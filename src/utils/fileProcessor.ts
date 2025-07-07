// File processing utilities for portfolio analysis

export interface ProcessedFile {
  text: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'text';
  success: boolean;
  error?: string;
}

// Extract text from PDF file
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // For now, we'll use a simplified approach
        // In a production environment, you'd want to use a proper PDF parsing library
        // Since we're in a browser environment, we'll convert to text and try to extract meaningful content
        
        const text = new TextDecoder().decode(arrayBuffer);
        
        // Look for common portfolio patterns in the binary data
        const portfolioKeywords = [
          'RELIANCE', 'TCS', 'HDFC', 'ICICI', 'INFY', 'ITC', 'SBIN', 
          'BAJFINANCE', 'HCLTECH', 'WIPRO', 'BHARTIARTL', 'ASIANPAINT',
          'MARUTI', 'KOTAKBANK', 'LT', 'TITAN', 'shares', 'equity',
          'portfolio', 'investment', 'stock', 'NSE', 'BSE'
        ];
        
        let extractedContent = '';
        
        // Extract readable text that contains portfolio-relevant information
        const lines = text.split('\n');
        for (const line of lines) {
          const hasPortfolioKeyword = portfolioKeywords.some(keyword => 
            line.toUpperCase().includes(keyword.toUpperCase())
          );
          
          if (hasPortfolioKeyword || /[A-Z]{3,6}/.test(line)) {
            extractedContent += line + '\n';
          }
        }
        
        if (extractedContent.trim().length < 50) {
          // Fallback: try to extract any readable text
          extractedContent = text.replace(/[^\x20-\x7E\n]/g, '').replace(/\s+/g, ' ').trim();
        }
        
        resolve(extractedContent || 'Could not extract readable text from PDF');
      } catch (error) {
        reject(new Error(`PDF processing failed: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

// Extract text from image using OCR
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // Dynamic import to avoid issues with SSR
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng');
    
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    
    if (!text || text.trim().length < 10) {
      // Fallback to manual input instructions if OCR fails
      return `
OCR could not extract sufficient text from the image. Please manually enter your portfolio data:

Example format:
RELIANCE 100 shares ₹2500
TCS 50 shares ₹3200
HDFC 75 shares ₹1650

Or try uploading a clearer image or a text/CSV file instead.
      `.trim();
    }
    
    return text.trim();
  } catch (error) {
    console.error('OCR processing failed:', error);
    
    // Fallback to manual input instructions
    return `
OCR processing failed. Please manually enter your portfolio data:

Example format:
RELIANCE 100 shares ₹2500
TCS 50 shares ₹3200
HDFC 75 shares ₹1650

Or try uploading a text/CSV file instead.
    `.trim();
  }
}

// Main file processing function
export async function processPortfolioFile(file: File): Promise<ProcessedFile> {
  try {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    let text = '';
    let fileType: 'pdf' | 'image' | 'text' = 'text';
    
    // Determine file type and process accordingly
    if (fileExtension === 'pdf') {
      fileType = 'pdf';
      text = await extractTextFromPDF(file);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
      fileType = 'image';
      text = await extractTextFromImage(file);
    } else if (['txt', 'csv'].includes(fileExtension || '')) {
      fileType = 'text';
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}. Please upload PDF, image, or text files.`);
    }
    
    // Validate extracted text
    if (!text || text.trim().length < 10) {
      throw new Error('Could not extract sufficient text from the file. Please ensure the file contains readable portfolio information.');
    }
    
    return {
      text: text.trim(),
      fileName,
      fileType,
      success: true
    };
    
  } catch (error) {
    return {
      text: '',
      fileName: file.name,
      fileType: 'text',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Validate if the extracted text contains portfolio-relevant information
export function validatePortfolioContent(text: string): { isValid: boolean; reason?: string } {
  const stockPatterns = [
    /[A-Z]{3,6}/, // Stock symbols
    /shares?/i,
    /equity/i,
    /portfolio/i,
    /investment/i,
    /₹\s*\d+/,
    /RELIANCE|TCS|HDFC|ICICI|INFY|ITC|SBIN/i
  ];
  
  const hasStockPatterns = stockPatterns.some(pattern => pattern.test(text));
  
  if (!hasStockPatterns) {
    return {
      isValid: false,
      reason: 'The document does not appear to contain portfolio or stock information. Please upload a document with stock symbols, share quantities, or portfolio details.'
    };
  }
  
  if (text.length < 50) {
    return {
      isValid: false,
      reason: 'The extracted text is too short. Please ensure your document contains sufficient portfolio information.'
    };
  }
  
  return { isValid: true };
}

// Sample portfolio text for demo purposes
export const SAMPLE_PORTFOLIO_TEXT = `
Portfolio Holdings Summary

RELIANCE INDUSTRIES LTD
Shares: 100
Purchase Price: ₹2,450
Current Price: ₹2,850

TATA CONSULTANCY SERVICES
Shares: 50
Purchase Price: ₹3,200
Current Price: ₹3,890

HDFC BANK LIMITED
Shares: 75
Purchase Price: ₹1,650
Current Price: ₹1,795

ICICI BANK LIMITED
Shares: 60
Purchase Price: ₹950
Current Price: ₹1,125

INFOSYS LIMITED
Shares: 40
Purchase Price: ₹1,800
Current Price: ₹1,950

Total Investment Value: ₹8,75,000
Current Market Value: ₹10,23,750
Gain/Loss: +₹1,48,750 (+17.0%)
`.trim(); 