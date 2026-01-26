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

    const formatDateFull = (dateString, includeTime = false) => {
      if (!dateString) return '';
      
      // Handle MySQL DATETIME format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
      let date;
      if (typeof dateString === 'string' && dateString.includes(' ')) {
        // MySQL DATETIME format: "2026-01-24 05:00:00"
        // Convert to ISO format for proper parsing
        date = new Date(dateString.replace(' ', 'T'));
      } else if (typeof dateString === 'string' && dateString.includes('T')) {
        // ISO format already
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateString}`);
        return '';
      }
      
      if (includeTime) {
        // Check if time is actually set (not just midnight default)
        // For DATETIME fields, always check the original string for time component
        const hasTimeInString = typeof dateString === 'string' && 
          (dateString.includes(' ') || dateString.includes('T')) &&
          /:\d{2}/.test(dateString); // Check if time pattern exists
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const hasTime = hasTimeInString && (hours !== 0 || minutes !== 0 || seconds !== 0);
        
        // Format date part
        const datePart = date.toLocaleDateString('en-GB', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        });
        
        // Format time part only if time is set
        if (hasTime) {
          const timePart = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          return `${datePart} at ${timePart}`;
        } else {
          // If time is midnight (00:00:00) or no time component, don't show time
          return datePart;
        }
      }
      
      return date.toLocaleDateString('en-GB', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };


    // Helper function to ensure text is uppercase
    const toUpperCase = (text) => text ? String(text).toUpperCase() : '';

    // Signature line HTML for table cells (clear, realistic placeholder)
    const sigCell = '<span class="signature-cell">&nbsp;</span>';
    const sigPresiding = '&nbsp;';

    // Marital status: use stored value or NIL
    const marital = (v) => (v && String(v).trim()) ? toUpperCase(String(v).trim()) : 'NIL';

    // In Person / By Proxy: ✓ when selected, — otherwise
    const tickInPerson = (personally) => (personally === true || personally === 1) ? '✓' : '—';
    const tickByProxy = (byProxy) => (byProxy === true || byProxy === 1) ? '✓' : '—';

    // Rep date/place of birth: format or — when no rep or no data
    const repDobPob = (repName, dob, pob) => {
      if (!repName || (!dob && !pob)) return '—';
      const d = formatDate(dob);
      const p = toUpperCase(pob || '');
      if (d && p) return `${d}<br/>${p}`;
      return d || p;
    };

    // Prepare replacements
    const replacements = {
      application_number: toUpperCase(applicationData.application_number || 'N/A'),

      // Groom
      groom_full_name: toUpperCase(applicationData.groom_full_name || ''),
      groom_father_name: toUpperCase(applicationData.groom_father_name || ''),
      groom_date_place_of_birth: (() => {
        const dob = formatDate(applicationData.groom_date_of_birth);
        const pob = toUpperCase(applicationData.groom_place_of_birth || '');
        if (!dob && !pob) return '';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      groom_address: toUpperCase(applicationData.groom_address || ''),
      groom_marital_status: marital(applicationData.groom_marital_status),
      groom_in_person_tick: tickInPerson(applicationData.groom_personally),
      groom_by_proxy_tick: tickByProxy(applicationData.groom_representative),
      groom_signature: sigCell,

      // Bride
      bride_full_name: toUpperCase(applicationData.bride_full_name || ''),
      bride_father_name: toUpperCase(applicationData.bride_father_name || ''),
      bride_date_place_of_birth: (() => {
        const dob = formatDate(applicationData.bride_date_of_birth);
        const pob = toUpperCase(applicationData.bride_place_of_birth || '');
        if (!dob && !pob) return '';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      bride_address: toUpperCase(applicationData.bride_address || ''),
      bride_marital_status: marital(applicationData.bride_marital_status),
      bride_in_person_tick: tickInPerson(applicationData.bride_personally),
      bride_by_proxy_tick: tickByProxy(applicationData.bride_representative),
      bride_signature: sigCell,

      // Groom Representative
      groom_rep_name: applicationData.groom_rep_name ? toUpperCase(applicationData.groom_rep_name) : '—',
      groom_rep_father_name: applicationData.groom_rep_father_name ? toUpperCase(applicationData.groom_rep_father_name) : '—',
      groom_rep_date_place_of_birth: repDobPob(
        applicationData.groom_rep_name,
        applicationData.groom_rep_date_of_birth,
        applicationData.groom_rep_place_of_birth
      ),
      groom_rep_address: applicationData.groom_rep_address ? toUpperCase(applicationData.groom_rep_address) : '—',
      groom_rep_signature: applicationData.groom_rep_name ? sigCell : '—',

      // Bride Representative
      bride_rep_name: applicationData.bride_rep_name ? toUpperCase(applicationData.bride_rep_name) : '—',
      bride_rep_father_name: applicationData.bride_rep_father_name ? toUpperCase(applicationData.bride_rep_father_name) : '—',
      bride_rep_date_place_of_birth: repDobPob(
        applicationData.bride_rep_name,
        applicationData.bride_rep_date_of_birth,
        applicationData.bride_rep_place_of_birth
      ),
      bride_rep_address: applicationData.bride_rep_address ? toUpperCase(applicationData.bride_rep_address) : '—',
      bride_rep_signature: applicationData.bride_rep_name ? sigCell : '—',

      // Mahr
      mahr_amount: applicationData.mahr_amount != null && applicationData.mahr_amount !== ''
        ? toUpperCase(String(applicationData.mahr_amount)) : '—',
      mahr_type_text: applicationData.mahr_type === 'deferred' ? 'DEFERRED' : (applicationData.mahr_type === 'prompt' ? 'PROMPT' : '—'),

      // Solemnization
      solemnised_date_formatted: (() => {
        if (applicationData.solemnised_date) {
          const datePart = formatDateFull(applicationData.solemnised_date, false);
          if (applicationData.solemnised_time) {
            const [hours, minutes] = applicationData.solemnised_time.substring(0, 5).split(':');
            const hour12 = parseInt(hours) % 12 || 12;
            const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
            return `${datePart} at ${hour12}:${minutes} ${ampm}`;
          }
          return datePart;
        }
        if (applicationData.appointment_date) return formatDateFull(applicationData.appointment_date, true);
        return '—';
      })(),
      solemnised_place: (applicationData.solemnised_place || applicationData.appointment_location)
        ? toUpperCase(applicationData.solemnised_place || applicationData.appointment_location) : '—',
      solemnised_by_name: applicationData.solemnised_by ? toUpperCase(applicationData.solemnised_by) : '—',
      solemnised_address: applicationData.solemnised_address ? toUpperCase(applicationData.solemnised_address) : '—',
      presiding_signature: sigPresiding,

      // Witness 1
      witness1_name: (witnesses && witnesses[0] && witnesses[0].witness_name) ? toUpperCase(witnesses[0].witness_name) : '—',
      witness1_father_name: (witnesses && witnesses[0] && witnesses[0].witness_father_name) ? toUpperCase(witnesses[0].witness_father_name) : '—',
      witness1_date_place_of_birth: (() => {
        if (!witnesses || !witnesses[0]) return '—';
        const dob = formatDate(witnesses[0].witness_date_of_birth);
        const pob = toUpperCase(witnesses[0].witness_place_of_birth || '');
        if (!dob && !pob) return '—';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      witness1_address: (witnesses && witnesses[0] && witnesses[0].witness_address) ? toUpperCase(witnesses[0].witness_address) : '—',
      witness1_signature: (witnesses && witnesses[0] && witnesses[0].witness_name) ? sigCell : '—',

      // Witness 2
      witness2_name: (witnesses && witnesses[1] && witnesses[1].witness_name) ? toUpperCase(witnesses[1].witness_name) : '—',
      witness2_father_name: (witnesses && witnesses[1] && witnesses[1].witness_father_name) ? toUpperCase(witnesses[1].witness_father_name) : '—',
      witness2_date_place_of_birth: (() => {
        if (!witnesses || !witnesses[1]) return '—';
        const dob = formatDate(witnesses[1].witness_date_of_birth);
        const pob = toUpperCase(witnesses[1].witness_place_of_birth || '');
        if (!dob && !pob) return '—';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      witness2_address: (witnesses && witnesses[1] && witnesses[1].witness_address) ? toUpperCase(witnesses[1].witness_address) : '—',
      witness2_signature: (witnesses && witnesses[1] && witnesses[1].witness_name) ? sigCell : '—',

      // Witness 3
      witness3_name: (witnesses && witnesses[2] && witnesses[2].witness_name) ? toUpperCase(witnesses[2].witness_name) : '—',
      witness3_father_name: (witnesses && witnesses[2] && witnesses[2].witness_father_name) ? toUpperCase(witnesses[2].witness_father_name) : '—',
      witness3_date_place_of_birth: (() => {
        if (!witnesses || !witnesses[2]) return '—';
        const dob = formatDate(witnesses[2].witness_date_of_birth);
        const pob = toUpperCase(witnesses[2].witness_place_of_birth || '');
        if (!dob && !pob) return '—';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      witness3_address: (witnesses && witnesses[2] && witnesses[2].witness_address) ? toUpperCase(witnesses[2].witness_address) : '—',
      witness3_signature: (witnesses && witnesses[2] && witnesses[2].witness_name) ? sigCell : '—',

      // Witness 4
      witness4_name: (witnesses && witnesses[3] && witnesses[3].witness_name) ? toUpperCase(witnesses[3].witness_name) : '—',
      witness4_father_name: (witnesses && witnesses[3] && witnesses[3].witness_father_name) ? toUpperCase(witnesses[3].witness_father_name) : '—',
      witness4_date_place_of_birth: (() => {
        if (!witnesses || !witnesses[3]) return '—';
        const dob = formatDate(witnesses[3].witness_date_of_birth);
        const pob = toUpperCase(witnesses[3].witness_place_of_birth || '');
        if (!dob && !pob) return '—';
        if (dob && pob) return `${dob}<br/>${pob}`;
        return dob || pob;
      })(),
      witness4_address: (witnesses && witnesses[3] && witnesses[3].witness_address) ? toUpperCase(witnesses[3].witness_address) : '—',
      witness4_signature: (witnesses && witnesses[3] && witnesses[3].witness_name) ? sigCell : '—'
    };

    // Witness rows 3 and 4 are now always shown in the template

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
      // Set viewport for A4 Landscape size
      await page.setViewport({
        width: 1123,  // 297mm in pixels at 96 DPI (A4 height becomes width in landscape)
        height: 794,  // 210mm in pixels at 96 DPI (A4 width becomes height in landscape)
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
      
      // Generate PDF in A4 Landscape orientation
      await page.pdf({
        path: filePath,
        format: 'A4',
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
