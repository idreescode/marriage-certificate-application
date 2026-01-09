const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateCertificatePDF = async (applicationData, witnesses) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../../uploads/certificates');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `cert-${applicationData.id}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const relativePath = `/uploads/certificates/${fileName}`;

      // Colors
      const PRIMARY_COLOR = '#c2410c'; // Deep Orange / Rust
      const SECONDARY_COLOR = '#9a3412'; // Darker Rust
      const TEXT_COLOR = '#1e293b'; // Slate 800
      const LIGHT_TEXT = '#64748b'; // Slate 500
      const BORDER_BG = '#fff7ed'; // Very light orange/cream

      // Create PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title: 'Marriage Certificate',
          Author: 'Govt High School Jandala',
        }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- Decorative Background/Border ---
      // Outer border
      doc.rect(20, 20, 555, 802).lineWidth(3).stroke(PRIMARY_COLOR);
      
      // Inner ornate border effect (just a double line for simplicity in PDFKit)
      doc.rect(25, 25, 545, 792).lineWidth(1).stroke(SECONDARY_COLOR);
      
      // Corner accents (simulated with lines)
      const drawCorner = (x, y, scale = 1) => {
          doc.save()
             .translate(x, y)
             .scale(scale)
             .path('M 0 0 L 30 0 L 30 5 L 5 5 L 5 30 L 0 30 Z')
             .fill(PRIMARY_COLOR)
             .restore();
      };
      
      drawCorner(30, 30, 1); // Top-Left
      drawCorner(565, 30, -1); // Top-Right (flipped horizontally approx - actually easier to just draw rects or simpler geometry)
      // PDFKit transform scaling is tricky with absolute coords. Let's stick to simple rectangles for corners if needed, or just the border.
      
      // Let's do a filled rect header background
      doc.rect(28, 28, 539, 130).fill(BORDER_BG);

      // --- Header Content ---
      let y = 50;

      // Bismillah (Using text if possible, or usually images are better for Arabic calligraphy)
      // Using a simple placeholder text for now or English transliteration
      doc.fontSize(10).fillColor(SECONDARY_COLOR)
         .font('Helvetica-Oblique')
         .text('In the name of Allah, the Most Gracious, the Most Merciful', 0, y, { align: 'center' });
      
      y += 25;

      doc.fontSize(32)
         .fillColor(PRIMARY_COLOR)
         .font('Helvetica-Bold')
         .text('MARRIAGE CERTIFICATE', 0, y, { align: 'center', characterSpacing: 2 });
      
      y += 40;
      doc.fontSize(14)
         .fillColor(TEXT_COLOR)
         .font('Helvetica')
         .text('OFFICIAL RECORD OF NIKAH', 0, y, { align: 'center' });

      // Certificate No
      doc.fontSize(10)
         .fillColor(LIGHT_TEXT)
         .text(`Certificate # ${applicationData.application_number}`, 400, 140, { align: 'right' });

      // --- Main Body ---
      y = 190;
      
      doc.fontSize(12)
         .fillColor(TEXT_COLOR)
         .font('Helvetica')
         .text('This certifies that the marriage between', 0, y, { align: 'center' });
      
      y += 40;

      // Columns Setup
      const colWidth = 230;
      const leftColX = 50;
      const rightColX = 315;
      
      // GROOM Box
      doc.rect(leftColX - 10, y - 10, colWidth, 185)
         .fillAndStroke(BORDER_BG, '#fed7aa'); // Light fill, subtle border
      
      doc.fillColor(PRIMARY_COLOR).fontSize(14).font('Helvetica-Bold')
         .text('GROOM', leftColX, y, { width: colWidth - 20, align: 'center' });
      
      let boxY = y + 25;
      doc.fillColor(TEXT_COLOR).fontSize(11).font('Helvetica-Bold')
         .text(applicationData.groom_full_name, leftColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 18;
      doc.fillColor(LIGHT_TEXT).fontSize(9).font('Helvetica')
         .text(`S/O: ${applicationData.groom_father_name || 'N/A'}`, leftColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 15;
      doc.text(`CNIC: ${applicationData.groom_id_number}`, leftColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 15;
      doc.text(`DOB: ${new Date(applicationData.groom_date_of_birth).toLocaleDateString()}`, leftColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 15;
      if (applicationData.groom_place_of_birth) {
         doc.text(`POB: ${applicationData.groom_place_of_birth}`, leftColX, boxY, { width: colWidth - 20, align: 'center' });
         boxY += 15;
      }
      
      doc.fontSize(8).text(applicationData.groom_address || '', leftColX, boxY, { width: colWidth - 20, align: 'center' });

      // BRIDE Box
      doc.rect(rightColX - 10, y - 10, colWidth, 185)
         .fillAndStroke(BORDER_BG, '#fed7aa');
         
      doc.fillColor(PRIMARY_COLOR).fontSize(14).font('Helvetica-Bold')
         .text('BRIDE', rightColX, y, { width: colWidth - 20, align: 'center' });
      
      boxY = y + 25;
      doc.fillColor(TEXT_COLOR).fontSize(11).font('Helvetica-Bold')
         .text(applicationData.bride_full_name, rightColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 18;
      doc.fillColor(LIGHT_TEXT).fontSize(9).font('Helvetica')
         .text(`D/O: ${applicationData.bride_father_name || 'N/A'}`, rightColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 15;
      doc.text(`CNIC: ${applicationData.bride_id_number}`, rightColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 15;
      doc.text(`DOB: ${new Date(applicationData.bride_date_of_birth).toLocaleDateString()}`, rightColX, boxY, { width: colWidth - 20, align: 'center' });
      
      boxY += 15;
      if (applicationData.bride_place_of_birth) {
         doc.text(`POB: ${applicationData.bride_place_of_birth}`, rightColX, boxY, { width: colWidth - 20, align: 'center' });
         boxY += 15;
      }
      
      doc.fontSize(8).text(applicationData.bride_address || '', rightColX, boxY, { width: colWidth - 20, align: 'center' });


      y += 205;

      // Connection text
      doc.fontSize(12).fillColor(TEXT_COLOR).font('Helvetica')
         .text('Was solemnized in accordance with Islamic Law on:', 0, y, { align: 'center' });

      y += 30;
      
      // Date and Venue
      doc.fontSize(16).fillColor(PRIMARY_COLOR).font('Helvetica-Bold')
         .text(new Date(applicationData.appointment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 0, y, { align: 'center' });
      
      y += 25;
      doc.fontSize(12).fillColor(TEXT_COLOR).font('Helvetica')
         .text(`at ${applicationData.appointment_location || 'Designated Venue'}`, 0, y, { align: 'center' });

      // Separator
      y += 40;
      doc.moveTo(100, y).lineTo(495, y).lineWidth(1).stroke('#e2e8f0');
      
      y += 30;

      // Witnesses Section
      if (witnesses && witnesses.length > 0) {
          doc.fontSize(12).fillColor(SECONDARY_COLOR).font('Helvetica-Bold')
             .text('Witnesses:', 60, y);
          
          let wY = y + 30;
          witnesses.forEach((w, i) => {
             doc.fontSize(10).fillColor(TEXT_COLOR).font('Helvetica-Bold')
                .text(`${i+1}. ${w.witness_name}`, 80, wY);
             wY += 16;
             
             doc.fontSize(9).fillColor(LIGHT_TEXT).font('Helvetica');
             
             if (w.witness_father_name) {
                doc.text(`    Father: ${w.witness_father_name}`, 80, wY);
                wY += 14;
             }
             
             if (w.witness_date_of_birth) {
                doc.text(`    DOB: ${new Date(w.witness_date_of_birth).toLocaleDateString()}`, 80, wY);
                wY += 14;
             }
             
             if (w.witness_place_of_birth) {
                doc.text(`    POB: ${w.witness_place_of_birth}`, 80, wY);
                wY += 14;
             }
             
             if (w.witness_address) {
                doc.text(`    Address: ${w.witness_address}`, 80, wY, { width: 450 });
                wY += 16;
             }
             
             wY += 12; // Space between witnesses
          });
          y = wY + 25;
      } else {
          y += 40; // Spacing if no witnesses (rare)
      }

      // --- Footer / Signatures ---
      const bottomY = 700;
      
      // Seal Area
      doc.circle(100, bottomY, 40).lineWidth(2).stroke(PRIMARY_COLOR);
      doc.fontSize(8).fillColor(PRIMARY_COLOR).text('OFFICIAL SEAL', 72, bottomY - 5, { align: 'center', width: 60 });

      // Signatures
      doc.moveTo(350, bottomY).lineTo(520, bottomY).stroke(TEXT_COLOR);
      doc.fontSize(10).fillColor(TEXT_COLOR).font('Helvetica')
         .text('Registrar Signature', 350, bottomY + 10, { align: 'center', width: 170 });
      
      doc.fontSize(10).fillColor(PRIMARY_COLOR).font('Helvetica-Bold')
         .text('Jamiyat Organization', 350, bottomY + 25, { align: 'center', width: 170 });


      doc.end();

      stream.on('finish', () => {
        resolve(relativePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateCertificatePDF };
