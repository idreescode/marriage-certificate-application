const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateCertificatePDF = async (applicationData, witnesses) => {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/certificates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `cert-${applicationData.id}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const relativePath = `/uploads/certificates/${fileName}`;

    // Load HTML template
    const templatePath = path.join(__dirname, '../templates/certificate/certificate.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatDateFull = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    // Prepare data for replacement
    const replacements = {
      application_number: applicationData.application_number || 'N/A',
      groom_full_name: applicationData.groom_full_name || 'N/A',
      groom_father_name: applicationData.groom_father_name || 'N/A',
      groom_id_number: applicationData.groom_id_number || 'N/A',
      groom_date_of_birth_formatted: formatDate(applicationData.groom_date_of_birth),
      groom_place_of_birth_html: applicationData.groom_place_of_birth 
        ? `<div class="person-detail"><strong>POB:</strong> ${applicationData.groom_place_of_birth}</div>`
        : '',
      groom_address: applicationData.groom_address || 'N/A',
      bride_full_name: applicationData.bride_full_name || 'N/A',
      bride_father_name: applicationData.bride_father_name || 'N/A',
      bride_id_number: applicationData.bride_id_number || 'N/A',
      bride_date_of_birth_formatted: formatDate(applicationData.bride_date_of_birth),
      bride_place_of_birth_html: applicationData.bride_place_of_birth 
        ? `<div class="person-detail"><strong>POB:</strong> ${applicationData.bride_place_of_birth}</div>`
        : '',
      bride_address: applicationData.bride_address || 'N/A',
      appointment_date_formatted: formatDateFull(applicationData.appointment_date),
      appointment_location: applicationData.appointment_location || 'Designated Venue'
    };

    // Replace placeholders
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, replacements[key] || '');
    });

    // Handle witnesses section
    if (witnesses && witnesses.length > 0) {
      let witnessesHtml = '<div class="witnesses-section"><div class="witnesses-title">Witnesses:</div>';
      
      witnesses.forEach((witness, index) => {
        witnessesHtml += `
    <div class="witness-item">
      <div class="witness-name">${index + 1}. ${witness.witness_name || 'N/A'}</div>`;
        
        if (witness.witness_father_name) {
          witnessesHtml += `
      <div class="witness-detail">Father: ${witness.witness_father_name}</div>`;
        }
        
        if (witness.witness_date_of_birth) {
          witnessesHtml += `
      <div class="witness-detail">DOB: ${formatDate(witness.witness_date_of_birth)}</div>`;
        }
        
        if (witness.witness_place_of_birth) {
          witnessesHtml += `
      <div class="witness-detail">POB: ${witness.witness_place_of_birth}</div>`;
        }
        
        if (witness.witness_address) {
          witnessesHtml += `
      <div class="witness-detail">Address: ${witness.witness_address}</div>`;
        }
        
        witnessesHtml += `
    </div>`;
      });
      
      witnessesHtml += '</div>';
      html = html.replace('{{witnesses_html}}', witnessesHtml);
    } else {
      html = html.replace('{{witnesses_html}}', '');
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content and wait for fonts/styles to load
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    await browser.close();

    return relativePath;

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

module.exports = { generateCertificatePDF };
