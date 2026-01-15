const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateCertificatePDF = async (applicationData, witnesses) => {
  try {
    // Validate required data
    if (!applicationData || !applicationData.id) {
      throw new Error('Invalid application data: missing application ID');
    }

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
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Certificate template not found at: ${templatePath}`);
    }
    let html = fs.readFileSync(templatePath, 'utf8');

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('en-GB');
      } catch (e) {
        return '';
      }
    };

    const formatDateFull = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-GB', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };


    // Prepare replacements
    const replacements = {
      application_number: applicationData.application_number || 'N/A',
      
      // Groom
      groom_full_name: applicationData.groom_full_name || '',
      groom_father_name: applicationData.groom_father_name || '',
      groom_date_place_of_birth: (() => {
        const dob = formatDate(applicationData.groom_date_of_birth);
        const pob = applicationData.groom_place_of_birth || '';
        if (!dob && !pob) return '';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      groom_address: applicationData.groom_address || '',
      groom_personally_text: applicationData.groom_personally ? 'Personally' : (applicationData.groom_representative ? 'Representative' : ''),
      
      // Bride
      bride_full_name: applicationData.bride_full_name || '',
      bride_father_name: applicationData.bride_father_name || '',
      bride_date_place_of_birth: (() => {
        const dob = formatDate(applicationData.bride_date_of_birth);
        const pob = applicationData.bride_place_of_birth || '';
        if (!dob && !pob) return '';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      bride_address: applicationData.bride_address || '',
      bride_personally_text: applicationData.bride_personally ? 'Personally' : (applicationData.bride_representative ? 'Representative' : ''),
      
      // Groom Representative
      groom_rep_name: applicationData.groom_rep_name || '',
      groom_rep_father_name: applicationData.groom_rep_father_name || '',
      groom_rep_address: applicationData.groom_rep_address || '',
      groom_rep_signature: applicationData.groom_rep_name ? '' : '',
      
      // Bride Representative
      bride_rep_name: applicationData.bride_rep_name || '',
      bride_rep_father_name: applicationData.bride_rep_father_name || '',
      bride_rep_address: applicationData.bride_rep_address || '',
      bride_rep_signature: applicationData.bride_rep_name ? '' : '',
      
      // Mahr
      mahr_amount: applicationData.mahr_amount ? `£${applicationData.mahr_amount}` : '',
      mahr_type_text: applicationData.mahr_type === 'deferred' ? 'Deferred' : (applicationData.mahr_type === 'prompt' ? 'Prompt' : ''),
      
      // Solemnization
      solemnised_date_formatted: applicationData.solemnised_date 
        ? formatDateFull(applicationData.solemnised_date) 
        : (applicationData.appointment_date ? formatDateFull(applicationData.appointment_date) : ''),
      solemnised_place: applicationData.solemnised_place || applicationData.appointment_location || '',
      solemnised_by_name: '', // This field doesn't exist in DB, can be added later if needed
      solemnised_address: applicationData.solemnised_address || '',
      
      // Witness 1
      witness1_name: (witnesses && witnesses[0] && witnesses[0].witness_name) ? witnesses[0].witness_name : '',
      witness1_father_name: (witnesses && witnesses[0] && witnesses[0].witness_father_name) ? witnesses[0].witness_father_name : '',
      witness1_date_place_of_birth: (() => {
        if (!witnesses || !witnesses[0]) return '';
        const dob = formatDate(witnesses[0].witness_date_of_birth);
        const pob = witnesses[0].witness_place_of_birth || '';
        if (!dob && !pob) return '';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      witness1_address: (witnesses && witnesses[0] && witnesses[0].witness_address) ? witnesses[0].witness_address : '',
      witness1_signature: (witnesses && witnesses[0] && witnesses[0].witness_name) ? '' : '',
      
      // Witness 2
      witness2_name: (witnesses && witnesses[1] && witnesses[1].witness_name) ? witnesses[1].witness_name : '',
      witness2_father_name: (witnesses && witnesses[1] && witnesses[1].witness_father_name) ? witnesses[1].witness_father_name : '',
      witness2_date_place_of_birth: (() => {
        if (!witnesses || !witnesses[1]) return '';
        const dob = formatDate(witnesses[1].witness_date_of_birth);
        const pob = witnesses[1].witness_place_of_birth || '';
        if (!dob && !pob) return '';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      witness2_address: (witnesses && witnesses[1] && witnesses[1].witness_address) ? witnesses[1].witness_address : '',
      witness2_signature: (witnesses && witnesses[1] && witnesses[1].witness_name) ? '' : ''
    };

    // Replace simple placeholders
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, replacements[key] || '');
    });

    // Launch Puppeteer and generate PDF
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        timeout: 60000 // 60 second timeout for browser launch
      });
    } catch (launchError) {
      console.error('Failed to launch Puppeteer browser:', launchError);
      throw new Error(`Failed to launch browser: ${launchError.message}. Make sure Puppeteer dependencies are installed.`);
    }

    const page = await browser.newPage();
    
    try {
      // Set viewport for A3 Landscape size (wider page)
      await page.setViewport({
        width: 1587,  // 420mm in pixels at 96 DPI (A3 landscape width)
        height: 1123, // 297mm in pixels at 96 DPI (A3 landscape height)
        deviceScaleFactor: 1
      });
      
      // Set content and wait for fonts/styles/images to load
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait a bit more for any external resources (like logo)
      // Using Promise-based delay instead of deprecated waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate PDF in A3 Landscape orientation (wider page)
      await page.pdf({
        path: filePath,
        format: 'A3',
        landscape: true,  // Landscape orientation
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });
    } finally {
      // Always close browser even if PDF generation fails
      await browser.close();
    }

    return relativePath;

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      applicationId: applicationData?.id,
      hasWitnesses: witnesses?.length > 0
    });
    throw error;
  }
};

module.exports = { generateCertificatePDF };
