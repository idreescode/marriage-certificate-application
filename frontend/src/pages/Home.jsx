import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  FileText, 
  CreditCard, 
  UserCheck, 
  Calendar, 
  Download, 
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function Home() {
  return (
    <div>
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container text-center">
          <div className="badge badge-info mb-4" style={{ marginBottom: '1.5rem' }}>
            Official Marriage Certification Portal
          </div>
          
          <h1 style={{ maxWidth: '800px', margin: '0 auto 1.5rem' }}>
            Secure & Streamlined <span style={{ color: 'var(--brand-600)' }}>Nikah Registration</span>
          </h1>
          
          <p style={{ fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            A fully digital, authenticated process for registering marriages and obtaining official certificates from Jamiyat.org.
          </p>

          <div className="flex justify-center gap-4">
            <Link to="/apply" className="btn btn-primary btn-lg">
              Start Application <ArrowRight size={20} />
            </Link>
            <Link to="/applicant/login" className="btn btn-secondary btn-lg">
              Track Status
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section section-bg">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2>Application Process</h2>
            <p>Six simple steps to get your official certificate</p>
          </div>

          <div className="feature-grid">
            {/* Step 1 */}
            <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
              <div className="feature-icon"><FileText /></div>
              <h3>1. Submit Application</h3>
              <p>Complete the online form with groom, bride, and witness details securely.</p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
              <div className="feature-icon"><UserCheck /></div>
              <h3>2. Admin Review</h3>
              <p>Our administration reviews your application details for accuracy.</p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
              <div className="feature-icon"><CreditCard /></div>
              <h3>3. Deposit Payment</h3>
              <p>Receive the exact deposit amount via email and process the transfer.</p>
            </div>

            {/* Step 4 */}
            <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
              <div className="feature-icon"><Upload /></div>
              <h3>4. Verification</h3>
              <p>Upload your receipt. Admin verifies the payment and confirms the slot.</p>
            </div>

            {/* Step 5 */}
            <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
              <div className="feature-icon"><Calendar /></div>
              <h3>5. Nikah Ceremony</h3>
              <p>Attend the scheduled ceremonial appointment with witnesses.</p>
            </div>

            {/* Step 6 */}
            <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '0' }}>
              <div className="feature-icon"><Download /></div>
              <h3>6. Download Certificate</h3>
              <p>Access your portal to download the high-resolution, signed certificate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Status Guide */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ background: 'var(--brand-900)', color: 'white', border: 'none' }}>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck size={48} style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
              <h2 style={{ color: 'white' }}>Why Register Online?</h2>
              <div className="grid gap-8 w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginTop: '2rem', textAlign: 'left' }}>
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Secure Records</h3>
                  <p style={{ color: 'var(--brand-200)' }}>All data is encrypted and backed up securely for lifelong access.</p>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Faster Processing</h3>
                  <p style={{ color: 'var(--brand-200)' }}>Digital workflow reduces standard processing time by 70%.</p>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem' }}>24/7 Access</h3>
                  <p style={{ color: 'var(--brand-200)' }}>Log in anytime to check status or download copies of your certificate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--slate-900)', padding: '3rem 0', color: 'var(--slate-400)' }}>
        <div className="container text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Scroll size={24} color="var(--brand-500)" />
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>Jamiyat.org</span>
          </div>
          <p>© 2024 Jamiyat Organization. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4" style={{ fontSize: '0.9rem' }}>
            <a href="#" style={{ color: 'var(--slate-400)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'var(--slate-400)', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: 'var(--slate-400)', textDecoration: 'none' }}>Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Scroll, Upload } from 'lucide-react';
