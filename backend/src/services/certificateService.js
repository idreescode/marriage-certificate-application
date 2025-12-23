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

      // Create PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header - Islamic Border Pattern (Simple Top Line)
      doc.rect(50, 40, 495, 2).fillAndStroke('#c25e2e', '#c25e2e');
      
      // Title Section
      doc.fontSize(28)
         .fillColor('#c25e2e')
         .font('Helvetica-Bold')
         .text('MARRIAGE CERTIFICATE', 50, 80, { align: 'center' });

      doc.fontSize(16)
         .fillColor('#475569')
         .font('Helvetica')
         .text('نکاح نامہ', 50, 115, { align: 'center' });

      // Decorative line
      doc.moveTo(200, 145).lineTo(395, 145).stroke('#cbd5e1');

      // Organization
      doc.fontSize(12)
         .fillColor('#64748b')
         .text('Issued by Jamiyat Organization', 50, 160, { align: 'center' });

      // Certificate Number
      doc.fontSize(10)
         .fillColor('#94a3b8')
         .text(`Certificate No: ${applicationData.application_number}`, 50, 180, { align: 'center' });

      // Main Content Box
      let y = 220;
      
      // Introduction
      doc.fontSize(11)
         .fillColor('#1e293b')
         .font('Helvetica')
         .text('This is to certify that the Islamic marriage (Nikah) was solemnized between:', 70, y, { width: 455 });

      y += 40;

      // Groom Section
      doc.fontSize(11)
         .fillColor('#a14822')
         .font('Helvetica-Bold')
         .text('GROOM', 70, y);

      y += 20;
      doc.fontSize(10)
         .fillColor('#334155')
         .font('Helvetica')
         .text(`Name:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${applicationData.groom_full_name}`);

      y += 18;
      doc.font('Helvetica')
         .text(`Date of Birth:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${new Date(applicationData.groom_date_of_birth).toLocaleDateString('en-GB')}`);

      y += 18;
      doc.font('Helvetica')
         .text(`ID Number:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${applicationData.groom_id_number}`);

      y += 35;

      // Bride Section
      doc.fontSize(11)
         .fillColor('#a14822')
         .font('Helvetica-Bold')
         .text('BRIDE', 70, y);

      y += 20;
      doc.fontSize(10)
         .fillColor('#334155')
         .font('Helvetica')
         .text(`Name:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${applicationData.bride_full_name}`);

      y += 18;
      doc.font('Helvetica')
         .text(`Date of Birth:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${new Date(applicationData.bride_date_of_birth).toLocaleDateString('en-GB')}`);

      y += 18;
      doc.font('Helvetica')
         .text(`ID Number:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${applicationData.bride_id_number}`);

      y += 35;

      // Marriage Details
      doc.fontSize(11)
         .fillColor('#a14822')
         .font('Helvetica-Bold')
         .text('NIKAH DETAILS', 70, y);

      y += 20;
      doc.fontSize(10)
         .fillColor('#334155')
         .font('Helvetica')
         .text(`Date of Nikah:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${new Date(applicationData.appointment_date).toLocaleDateString('en-GB')}`);

      y += 18;
      doc.font('Helvetica')
         .text(`Location:`, 90, y, { continued: true })
         .font('Helvetica-Bold')
         .text(`  ${applicationData.appointment_location || 'Jamiyat Center'}`);

      y += 35;

      // Witnesses
      if (witnesses && witnesses.length > 0) {
        doc.fontSize(11)
           .fillColor('#a14822')
           .font('Helvetica-Bold')
           .text('WITNESSES', 70, y);

        y += 20;
        witnesses.forEach((witness, index) => {
          doc.fontSize(10)
             .fillColor('#334155')
             .font('Helvetica')
             .text(`${index + 1}. ${witness.witness_name}`, 90, y, { continued: true })
             .text(`  |  ${witness.witness_phone}`);
          y += 18;
        });
      }

      y += 30;

      // Footer Section
      doc.fontSize(9)
         .fillColor('#64748b')
         .font('Helvetica-Oblique')
         .text('This certificate is issued as an official record of the marriage ceremony.', 70, y, { 
           width: 455, 
           align: 'center' 
         });

      y += 30;

      // Signature Line
      doc.moveTo(350, y).lineTo(500, y).stroke('#cbd5e1');
      doc.fontSize(9)
         .fillColor('#475569')
         .font('Helvetica')
         .text('Authorized Signature', 350, y + 5);

      // Issue Date
      doc.fontSize(8)
         .fillColor('#94a3b8')
         .text(`Issued on: ${new Date().toLocaleDateString('en-GB')}`, 70, y + 5);

      // Bottom Border
      doc.rect(50, 750, 495, 2).fillAndStroke('#c25e2e', '#c25e2e');

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
