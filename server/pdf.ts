import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ServiceSelections } from '../client/src/lib/pricing';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuotePDFParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  boatLength: number;
  boatType: string;
  serviceLocation: string;
  services: ServiceSelections;
  estimatedTotal: number; // in cents
  breakdown: string[];
}

/* ── Boat type display names ─────────────────────────────────────── */
const BOAT_TYPE_NAMES: Record<string, string> = {
  bowrider: 'Bowrider',
  cuddy: 'Cuddy Cabin',
  cruiser: 'Cruiser',
  express: 'Express Cruiser',
  yacht: 'Yacht / Multi-Cabin',
  sailboat: 'Sailboat',
  pontoon: 'Pontoon',
  other: 'Other',
};

/* ── Service display names ───────────────────────────────────────── */
const SERVICE_NAMES: Record<string, string> = {
  gelcoat: 'Gelcoat Restoration',
  exterior: 'Exterior Detailing',
  interior: 'Interior Detailing',
  ceramic: 'Ceramic Coating',
  graphene: 'Graphene Nano Coating',
  wetSanding: 'Wet Sanding & Correction',
  bottomPainting: 'Bottom Painting',
  vinyl: 'Vinyl Removal & Installation',
};

/* ── Color palette ───────────────────────────────────────────────── */
const C = {
  black: '#000000',
  darkGray: '#1A1A1A',
  cardGray: '#2B2B2B',
  cyan: '#00CED1',      // Slightly darker cyan for print readability
  cyanLight: '#E0FFFE',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  tableBg: '#F8F8F8',
  headerBg: '#111111',
};

/**
 * Generate a professional, on-brand PDF quote.
 * Returns a Promise<Buffer> for instant delivery.
 */
export function generateQuotePDF(params: QuotePDFParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'letter', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 612; // letter width
    const MX = 48; // horizontal margin
    const CW = W - MX * 2; // content width (516)
    let y = 0;

    const quoteId = `A1-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const boatTypeName = BOAT_TYPE_NAMES[params.boatType] || params.boatType;
    const totalDollars = params.estimatedTotal / 100;

    /* ════════════════════════════════════════════════════════════════
       HEADER — Black bar with branding
       ════════════════════════════════════════════════════════════════ */
    const headerH = 100;
    doc.rect(0, 0, W, headerH).fill(C.headerBg);

    // Left: Company logo
    const logoPath = path.join(__dirname, '..', 'server', 'assets', 'logo.png');
    try {
      doc.image(logoPath, MX, 12, { height: 52 });
    } catch {
      // Fallback to text if logo file not found
      doc.fillColor(C.cyan).font('Helvetica-Bold').fontSize(24)
         .text('A1 MARINE CARE', MX, 28);
    }
    doc.fillColor(C.white).font('Helvetica').fontSize(9)
       .text('Premium Boat Detailing & Protection', MX, 68);
    doc.fillColor(C.textMuted).fontSize(8)
       .text('(705) 996-1010  |  contact@a1marinecare.ca  |  a1marinecare.ca', MX, 82);

    // Right: Quote label
    doc.fillColor(C.cyan).font('Helvetica-Bold').fontSize(12)
       .text('ESTIMATE', 0, 30, { align: 'right', width: W - MX });
    doc.fillColor(C.white).font('Helvetica').fontSize(8)
       .text(dateStr, 0, 48, { align: 'right', width: W - MX });
    doc.fillColor(C.textMuted).fontSize(8)
       .text(`Quote #${quoteId}`, 0, 60, { align: 'right', width: W - MX });

    y = headerH + 24;

    /* ════════════════════════════════════════════════════════════════
       CUSTOMER & VESSEL INFO — Two-column grid
       ════════════════════════════════════════════════════════════════ */
    const infoBoxH = 80;
    const halfW = CW / 2 - 6;

    // Left box: Client
    doc.roundedRect(MX, y, halfW, infoBoxH, 4).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.fillColor(C.cyan).font('Helvetica-Bold').fontSize(7)
       .text('CLIENT', MX + 14, y + 12);
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(11)
       .text(params.customerName, MX + 14, y + 26);
    doc.fillColor(C.textLight).font('Helvetica').fontSize(8.5)
       .text(params.customerEmail, MX + 14, y + 42);
    doc.text(params.customerPhone, MX + 14, y + 55);

    // Right box: Vessel
    const rx = MX + halfW + 12;
    doc.roundedRect(rx, y, halfW, infoBoxH, 4).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.fillColor(C.cyan).font('Helvetica-Bold').fontSize(7)
       .text('VESSEL', rx + 14, y + 12);
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(11)
       .text(`${params.boatLength}' ${boatTypeName}`, rx + 14, y + 26);
    doc.fillColor(C.textLight).font('Helvetica').fontSize(8.5)
       .text(`Location: ${params.serviceLocation || 'TBD'}`, rx + 14, y + 42);

    // Selected services summary
    const activeServices = Object.keys(params.services)
      .filter((k) => params.services[k as keyof ServiceSelections])
      .map((k) => SERVICE_NAMES[k] || k);
    if (activeServices.length > 0) {
      doc.fontSize(7.5).fillColor(C.textMuted)
         .text(`${activeServices.length} service${activeServices.length > 1 ? 's' : ''} selected`, rx + 14, y + 55);
    }

    y += infoBoxH + 20;

    /* ════════════════════════════════════════════════════════════════
       SERVICES TABLE
       ════════════════════════════════════════════════════════════════ */
    // Table header
    const tableHeaderH = 24;
    doc.roundedRect(MX, y, CW, tableHeaderH, 3).fill(C.headerBg);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
    doc.text('SERVICE DESCRIPTION', MX + 14, y + 8);
    doc.text('AMOUNT', 0, y + 8, { align: 'right', width: W - MX - 14 });
    y += tableHeaderH;

    // Table rows
    let rowIndex = 0;
    let currentSection = '';

    for (const line of params.breakdown) {
      // Page break check
      if (y > 680) {
        doc.addPage({ size: 'letter', margin: 0 });
        y = 40;
        // Re-draw table header on new page
        doc.roundedRect(MX, y, CW, tableHeaderH, 3).fill(C.headerBg);
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
        doc.text('SERVICE DESCRIPTION', MX + 14, y + 8);
        doc.text('AMOUNT', 0, y + 8, { align: 'right', width: W - MX - 14 });
        y += tableHeaderH;
      }

      if (line.startsWith('---')) {
        // ── Section header ──
        currentSection = line.replace(/^-+\s*/, '').replace(/\s*-+$/, '').trim();
        const sectionH = 28;
        // Cyan left accent bar
        doc.rect(MX, y, 3, sectionH).fill(C.cyan);
        doc.rect(MX + 3, y, CW - 3, sectionH).fill('#F0FFFE');
        doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9.5)
           .text(currentSection, MX + 16, y + 9);
        y += sectionH;
        rowIndex = 0;
      } else if (line.includes('$')) {
        // ── Price line ──
        const rowH = 22;
        if (rowIndex % 2 === 1) {
          doc.rect(MX, y, CW, rowH).fill(C.tableBg);
        }

        // Split description from price
        // Handle formats like "Hull: 30ft × $21/ft = $630.00" or "Teak Cleaning: $225.00"
        const dollarParts = line.split(/\$(?=[0-9])/);
        let description = line;
        let price = '';

        if (dollarParts.length >= 2) {
          // Get the last dollar amount as the price
          const lastAmount = dollarParts[dollarParts.length - 1].trim();
          price = `$${lastAmount}`;
          // Description is everything before the last "= $" or ": $"
          const eqIdx = line.lastIndexOf('= $');
          const colonIdx = line.lastIndexOf(': $');
          if (eqIdx > -1 && eqIdx > colonIdx) {
            description = line.substring(0, eqIdx).trim();
          } else if (colonIdx > -1) {
            description = line.substring(0, colonIdx).trim();
          } else {
            description = dollarParts.slice(0, -1).join('$').trim();
          }
        }

        // Handle range format: "$X – $Y" or "$X,XXX – $X,XXX"
        const rangeMatch = line.match(/\$([0-9,]+)\s*[–-]\s*\$([0-9,]+)/);
        if (rangeMatch) {
          price = `$${rangeMatch[1]} – $${rangeMatch[2]}`;
          const rangeIdx = line.indexOf('$');
          description = line.substring(0, rangeIdx).replace(/:\s*$/, '').trim();
        }

        doc.fillColor(C.textLight).font('Helvetica').fontSize(8.5)
           .text(description, MX + 16, y + 6, { width: 340 });
        doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9)
           .text(price, 0, y + 6, { align: 'right', width: W - MX - 14 });

        y += rowH;
        rowIndex++;
      } else if (line.trim()) {
        // ── Detail / note line ──
        const rowH = 18;
        doc.fillColor(C.textMuted).font('Helvetica').fontSize(7.5)
           .text(line.trim(), MX + 24, y + 5, { width: 380 });
        y += rowH;
      }
    }

    /* ════════════════════════════════════════════════════════════════
       TOTALS SECTION
       ════════════════════════════════════════════════════════════════ */
    y += 12;
    // Divider line
    doc.moveTo(MX, y).lineTo(MX + CW, y).lineWidth(1).strokeColor(C.border).stroke();
    y += 16;

    // Estimated Total
    const totalsX = MX + CW - 240;
    doc.fillColor(C.textLight).font('Helvetica').fontSize(9)
       .text('Estimated Total', totalsX, y);
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(18)
       .text(
         `$${totalDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
         0, y - 2, { align: 'right', width: W - MX }
       );
    y += 28;

    // Deposit line
    doc.moveTo(totalsX, y).lineTo(MX + CW, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 10;
    doc.fillColor(C.textLight).font('Helvetica').fontSize(8.5)
       .text('Deposit Required', totalsX, y);
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(12)
       .text('$250.00', 0, y, { align: 'right', width: W - MX });

    /* ════════════════════════════════════════════════════════════════
       DEPOSIT NOTE BOX
       ════════════════════════════════════════════════════════════════ */
    y += 30;
    if (y > 660) {
      doc.addPage({ size: 'letter', margin: 0 });
      y = 40;
    }

    const noteBoxH = 48;
    doc.roundedRect(MX, y, CW, noteBoxH, 4).fill('#F0FFFE');
    doc.rect(MX, y, 3, noteBoxH).fill(C.cyan); // left accent
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(8.5)
       .text('Deposit Information', MX + 16, y + 10);
    doc.fillColor(C.textLight).font('Helvetica').fontSize(8)
       .text(
         'A $250 deposit secures your service appointment and is applied to the final invoice. After making your deposit, you will be contacted by our agent to schedule your service date and time.',
         MX + 16, y + 24, { width: CW - 32 }
       );
    y += noteBoxH + 14;

    /* ════════════════════════════════════════════════════════════════
       SERVICE NOTES
       ════════════════════════════════════════════════════════════════ */
    const notes: string[] = [];

    if (params.services.interior) {
      notes.push('Interior: After checkout, we will send you an email requesting 3–10 interior photos so our team can prepare for your service.');
    }
    if (params.services.gelcoat?.heavyOxidation) {
      notes.push('Gelcoat: A 20% heavy oxidation surcharge has been applied to the base gelcoat service price.');
    }
    if (params.services.bottomPainting?.blisterRepair) {
      notes.push('Bottom Painting: Blister repair requires on-site inspection. Final pricing will be confirmed upon arrival.');
    }
    if (params.services.wetSanding) {
      notes.push('Wet Sanding: Final results depend on the depth and severity of surface imperfections.');
    }
    notes.push('This estimate is valid for 30 days from the date above. Final price may vary based on actual vessel condition upon inspection.');

    if (notes.length > 0) {
      // Check if we need a new page for the notes section
      // Estimate: header (14) + notes (~16 each) + some padding
      const estimatedNotesHeight = 14 + notes.length * 18;
      if (y + estimatedNotesHeight > 740) {
        doc.addPage({ size: 'letter', margin: 0 });
        y = 40;
      }

      doc.fillColor(C.text).font('Helvetica-Bold').fontSize(8)
         .text('SERVICE NOTES', MX, y, { lineBreak: false });
      y += 14;

      for (const note of notes) {
        if (y > 730) {
          doc.addPage({ size: 'letter', margin: 0 });
          y = 40;
        }
        // Pre-calculate height before drawing
        doc.font('Helvetica').fontSize(7.5);
        const noteHeight = doc.heightOfString(note, { width: CW - 16 });
        const rowH = Math.max(noteHeight, 10) + 4;

        doc.fillColor(C.cyan).fontSize(7)
           .text('\u2022', MX + 4, y, { lineBreak: false });
        doc.fillColor(C.textMuted).font('Helvetica').fontSize(7.5)
           .text(note, MX + 16, y, { width: CW - 16, lineBreak: true });
        y += rowH;
      }
    }

    /* ════════════════════════════════════════════════════════════════
       FOOTER — Black bar at bottom of last page
       ════════════════════════════════════════════════════════════════ */
    const footerH = 36;
    const footerY = 792 - footerH; // letter height = 792
    doc.rect(0, footerY, W, footerH).fill(C.headerBg);

    doc.fillColor(C.textMuted).font('Helvetica').fontSize(7)
       .text(
         'A1 Marine Care  |  (705) 996-1010  |  contact@a1marinecare.ca  |  a1marinecare.ca',
         0, footerY + 10, { align: 'center', width: W }
       );
    doc.fillColor('#555555').fontSize(6.5)
       .text(
         'Serving Georgian Bay, Lake Simcoe, and Muskoka  —  Trusted by boat owners across Ontario\'s premier boating regions.',
         0, footerY + 22, { align: 'center', width: W }
       );

    // Finalize
    doc.end();
  });
}
