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
 * Generate a PDF quote document
 * Returns a PDFDocument that can be piped to a response
 */
export function generateQuotePDF(params: QuotePDFParams): PDFDocument {
  const doc = new PDFDocument({
    size: 'letter',
    margin: 50,
  });

  // Helper function to add a section title
  const addSectionTitle = (title: string, yOffset = 20) => {
    doc.moveDown(yOffset / 12);
    doc.fontSize(14).font('Helvetica-Bold').text(title, { underline: false });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#00CCCC');
    doc.moveDown(0.5);
  };

  // Helper function to add a key-value pair
  const addKeyValue = (key: string, value: string) => {
    doc.fontSize(11);
    doc.font('Helvetica-Bold').text(key, { width: 150, continued: true });
    doc.font('Helvetica').text(value);
  };

  // Header with logo placeholder and company info
  doc.fontSize(20).font('Helvetica-Bold').text('A1 Marine Care', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Premium Boat Detailing Services', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('(705) 996-1010 | contact@a1marinecare.ca | a1marinecare.ca', { align: 'center' });
  
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#000000');
  doc.moveDown(1);

  // Quote title
  doc.fontSize(16).font('Helvetica-Bold').text('Service Quote', { align: 'center' });
  doc.moveDown(0.5);

  // Customer Information Section
  addSectionTitle('Customer Information');
  addKeyValue('Name:', params.customerName);
  addKeyValue('Email:', params.customerEmail);
  addKeyValue('Phone:', params.customerPhone);
  doc.moveDown(0.5);

  // Boat Information Section
  addSectionTitle('Vessel Information');
  addKeyValue('Boat Type:', params.boatType);
  addKeyValue('Length:', `${params.boatLength} ft`);
  addKeyValue('Service Location:', params.serviceLocation);
  doc.moveDown(0.5);

  // Services Section
  addSectionTitle('Selected Services');
  
  // Build a simple service list
  const servicesList: string[] = [];
  if (params.services.gelcoat) servicesList.push('Gelcoat Restoration');
  if (params.services.exterior) servicesList.push('Exterior Detailing');
  if (params.services.interior) servicesList.push('Interior Detailing');
  if (params.services.ceramic) servicesList.push('Ceramic Coating');
  if (params.services.graphene) servicesList.push('Graphene Nano Coating');
  if (params.services.wetSanding) servicesList.push('Wet Sanding & Paint Correction');
  if (params.services.bottomPainting) servicesList.push('Bottom Painting');
  if (params.services.vinyl) servicesList.push('Vinyl Services');

  doc.fontSize(11).font('Helvetica');
  servicesList.forEach((service) => {
    doc.text(`• ${service}`, { indent: 20 });
  });
  doc.moveDown(0.5);

  // Price Breakdown Section
  addSectionTitle('Price Breakdown');
  
  doc.fontSize(10).font('Helvetica');
  params.breakdown.forEach((line) => {
    if (line.startsWith('---')) {
      // Section header
      doc.font('Helvetica-Bold').text(line.replace(/---/g, '').trim(), { indent: 0 });
    } else if (line.includes('$')) {
      // Price line
      doc.font('Helvetica').text(line, { indent: 20 });
    } else {
      // Regular text
      doc.font('Helvetica').text(line, { indent: 20 });
    }
  });

  doc.moveDown(1);

  // Total Section
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#000000');
  doc.moveDown(0.5);
  
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Estimated Total:', { width: 150, continued: true });
  doc.fontSize(14).font('Helvetica-Bold').text(`$${(params.estimatedTotal / 100).toFixed(2)}`, { align: 'right' });
  
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica').text('Deposit Required: $250.00 (applied toward final invoice)', { align: 'center', color: '#666666' });

  doc.moveDown(1.5);

  // Footer
  doc.fontSize(9).font('Helvetica').text(
    'This quote is valid for 30 days. To proceed with your service, please contact us or visit our website to secure your appointment with a deposit.',
    { align: 'center', color: '#666666' }
  );

  doc.moveDown(0.5);
  doc.fontSize(8).font('Helvetica').text(
    `Generated on ${new Date().toLocaleDateString('en-CA')} | Quote ID: ${Date.now()}`,
    { align: 'center', color: '#999999' }
  );

  return doc;
}
