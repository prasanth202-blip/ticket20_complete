import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function TermsPage() {
  const { theme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-b)' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border)', height: 58, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <img src={theme === 'dark' ? '/logo_white.png' : '/logo.png'} alt="Ultrakey" style={{ height: 40, objectFit: 'contain', marginLeft: 'auto' }} />
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 36, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>Terms &amp; Conditions</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Last updated: January 1, 2025</p>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing or using the TicketFlow platform ("Service") provided by Ultrakey IT Solutions Private Limited ("Company", "we", "us", or "our"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our Service.',
          },
          {
            title: '2. Description of Service',
            body: 'TicketFlow is a multi-tenant customer support ticketing platform that enables businesses to manage customer queries, assign support agents, and track resolution status. The Service is provided on a subscription basis.',
          },
          {
            title: '3. User Accounts',
            body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. We are not liable for any loss resulting from unauthorised access due to your failure to keep credentials secure.',
          },
          {
            title: '4. Subscription & Billing',
            body: 'Subscription fees are billed in advance on a monthly or yearly basis in Indian Rupees (INR) via Razorpay. All fees are non-refundable unless otherwise required by applicable law. We reserve the right to modify pricing with 30 days\' notice.',
          },
          {
            title: '5. Acceptable Use',
            body: 'You agree not to use the Service to: (a) upload unlawful, harmful, or offensive content; (b) interfere with the operation of the Service; (c) attempt to gain unauthorised access to other accounts; (d) engage in any activity that violates applicable laws or regulations.',
          },
          {
            title: '6. Data Ownership',
            body: 'You retain full ownership of all data you upload to the Service. We do not claim any intellectual property rights over your data. By using the Service, you grant us a limited licence to store and process your data solely to provide the Service.',
          },
          {
            title: '7. Intellectual Property',
            body: 'The Service, including its software, design, and content, is owned by Ultrakey IT Solutions Private Limited and is protected by applicable intellectual property laws. You may not reproduce, modify, or distribute any part of the Service without our prior written consent.',
          },
          {
            title: '8. Limitation of Liability',
            body: 'To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you in the three months preceding the claim.',
          },
          {
            title: '9. Termination',
            body: 'We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may cancel your subscription at any time through your account settings. Upon termination, your data will be retained for 30 days before permanent deletion.',
          },
          {
            title: '10. Governing Law',
            body: 'These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India.',
          },
          {
            title: '11. Changes to Terms',
            body: 'We may update these Terms from time to time. We will notify registered users of material changes via email. Continued use of the Service after changes constitutes acceptance of the updated Terms.',
          },
          {
            title: '12. Contact Us',
            body: 'For any questions regarding these Terms, please contact us at: legal@ultrakey.in | Ultrakey IT Solutions Private Limited, Hyderabad, Telangana, India – 500001.',
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{section.title}</h2>
            <p style={{ fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.85 }}>{section.body}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', background: 'var(--surface)' }}>
        <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          © {new Date().getFullYear()} <strong style={{ color: '#1a6fa8' }}>Ultrakey IT Solutions Pvt. Ltd.</strong> — All Rights Reserved &nbsp;|&nbsp;
          <Link to="/terms" style={{ color: 'var(--primary)' }}>Terms</Link> &nbsp;|&nbsp;
          <Link to="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
}
