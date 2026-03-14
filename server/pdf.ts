import PDFDocument from 'pdfkit';
import type { ServiceSelections } from '../client/src/lib/pricing';

interface QuotePDFParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  boatLength: number;
  boatType: string;
  serviceLocation: string;
  services: ServiceSelections;
  estimatedTotal: number;
  breakdown: string[];
}

/**
 * Generate a professional, on-brand PDF quote document
 * Returns a PDFDocument that can be piped to a response
 */
export function generateQuotePDF(params: QuotePDFParams): PDFDocument {
  const doc = new PDFDocument({
    size: 'letter',
    margin: 0, // We'll handle margins manually for full-width elements
  });

  const primaryColor = '#00FFFF'; // Cyan accent
  const secondaryColor = '#2B2B2B'; // Dark gray
  const textColor = '#333333';
  const lightGray = '#F5F5F5';
  const white = '#FFFFFF';
  const black = '#000000';

  const marginX = 50;
  let currentY = 0;

  // --- Header Section (Black Background) ---
  doc.rect(0, 0, 612, 120).fill(black);
  
  // Company Name / Logo Text
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(28)
     .text('A1 MARINE CARE', marginX, 40);
  
  doc.fillColor(white)
     .font('Helvetica')
     .fontSize(10)
     .text('PREMIUM BOAT DETAILING & PROTECTION', marginX, 75);

  // Quote Label
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('ESTIMATE', 450, 45, { align: 'right', width: 112 });
  
  doc.fillColor(white)
     .font('Helvetica')
     .fontSize(9)
     .text(`DATE: ${new Date().toLocaleDateString('en-CA')}`, 450, 65, { align: 'right', width: 112 });
  
  doc.text(`QUOTE ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 450, 78, { align: 'right', width: 112 });

  currentY = 140;

  // --- Customer & Vessel Info Grid ---
  doc.fillColor(secondaryColor).rect(marginX, currentY, 512, 80).stroke();
  
  // Vertical divider
  doc.moveTo(306, currentY).lineTo(306, currentY + 80).stroke();

  // Left side: Customer
  doc.fillColor(black).font('Helvetica-Bold').fontSize(10).text('CLIENT', marginX + 15, currentY + 15);
  doc.font('Helvetica').fontSize(11).text(params.customerName, marginX + 15, currentY + 30);
  doc.fontSize(9).text(params.customerEmail, marginX + 15, currentY + 45);
  doc.text(params.customerPhone, marginX + 15, currentY + 58);

  // Right side: Vessel
  doc.font('Helvetica-Bold').fontSize(10).text('VESSEL & LOCATION', 321, currentY + 15);
  doc.font('Helvetica').fontSize(11).text(`${params.boatLength}ft ${params.boatType}`, 321, currentY + 30);
  doc.fontSize(9).text(`Location: ${params.serviceLocation}`, 321, currentY + 45);

  currentY += 110;

  // --- Services Table Header ---
  doc.fillColor(secondaryColor).rect(marginX, currentY, 512, 25).fill();
  doc.fillColor(white).font('Helvetica-Bold').fontSize(10);
  doc.text('DESCRIPTION OF SERVICES', marginX + 10, currentY + 8);
  doc.text('ESTIMATED PRICE', 450, currentY + 8, { align: 'right', width: 100 });

  currentY += 35;

  // --- Dynamic Service Rows ---
  doc.fillColor(black).font('Helvetica').fontSize(10);

  params.breakdown.forEach((line) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage({ size: 'letter', margin: 0 });
      currentY = 50;
    }

    if (line.startsWith('---')) {
      // Section Header
      currentY += 10;
      doc.font('Helvetica-Bold').fontSize(11).text(line.replace(/---/g, '').trim(), marginX + 5, currentY);
      currentY += 18;
      doc.moveTo(marginX, currentY - 2).lineTo(562, currentY - 2).strokeColor('#EEEEEE').stroke();
    } else if (line.includes('$')) {
      // Service with Price
      const parts = line.split('$');
      const description = parts[0].trim().replace(/^•\s*/, '');
      const price = `$${parts[1].trim()}`;

      doc.font('Helvetica').fontSize(10).text(description, marginX + 15, currentY, { width: 350 });
      doc.font('Helvetica-Bold').text(price, 450, currentY, { align: 'right', width: 100 });
      
      currentY += 20;
    } else if (line.trim()) {
      // Detail line
      doc.font('Helvetica').fontSize(9).fillColor('#666666').text(line.trim(), marginX + 25, currentY, { width: 340 });
      currentY += 15;
      doc.fillColor(black);
    }
  });

  // --- Totals Section ---
  currentY += 20;
  if (currentY > 650) {
    doc.addPage({ size: 'letter', margin: 0 });
    currentY = 50;
  }

  doc.moveTo(marginX, currentY).lineTo(562, currentY).strokeColor(black).lineWidth(1).stroke();
  currentY += 15;

  doc.font('Helvetica-Bold').fontSize(12).text('ESTIMATED TOTAL', marginX + 300, currentY);
  doc.fillColor(primaryColor).fontSize(16).text(`$${(params.estimatedTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, currentY - 3, { align: 'right', width: 100 });
  
  currentY += 30;
  doc.fillColor('#666666').font('Helvetica').fontSize(9).text('Deposit Required to Secure Booking: $250.00', marginX + 300, currentY, { align: 'right', width: 250 });

  // --- Footer / Terms ---
  doc.rect(0, 742, 612, 50).fill(black);
  doc.fillColor(white).fontSize(8).font('Helvetica');
  doc.text('A1 MARINE CARE | (705) 996-1010 | contact@a1marinecare.ca | a1marinecare.ca', 0, 762, { align: 'center', width: 612 });
  
  doc.fillColor('#999999').text('This estimate is valid for 30 days. Final price may vary based on actual vessel condition upon arrival.', 0, 720, { align: 'center', width: 612 });

  return doc;
}
