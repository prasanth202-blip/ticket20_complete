import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function PrivacyPage() {
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
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 36, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Last updated: January 1, 2025</p>
        </div>

        {[
          {
            title: '1. Introduction',
            body: 'Ultrakey IT Solutions Private Limited ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use the TicketFlow platform.',
          },
          {
            title: '2. Information We Collect',
            body: 'We collect information you provide directly, such as your name, email address, organisation name, and billing details when you register or subscribe. We also collect usage data, log files, and cookies to improve our Service and diagnose technical issues.',
          },
          {
            title: '3. How We Use Your Information',
            body: 'We use your information to: provide and maintain the Service; process payments via Razorpay; send transactional emails (ticket updates, password resets); improve and personalise your experience; comply with legal obligations; and respond to support requests.',
          },
          {
            title: '4. Data Sharing',
            body: 'We do not sell, trade, or rent your personal information to third parties. We may share data with trusted third-party service providers (such as payment processors and email delivery services) solely to operate the Service. These providers are contractually bound to keep your data confidential.',
          },
          {
            title: '5. Data Storage & Security',
            body: 'Your data is stored on secure servers. We implement industry-standard security measures including encryption in transit (TLS), hashed passwords, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
          },
          {
            title: '6. Multi-Tenant Data Isolation',
            body: 'Each company (tenant) on our platform has its data logically isolated. One tenant cannot access another tenant\'s data. Platform administrators have limited, audited access to data only for operational and compliance purposes.',
          },
          {
            title: '7. Cookies',
            body: 'We use essential cookies to maintain your session and preferences. We do not use advertising or tracking cookies. You may disable cookies in your browser settings, though this may affect Service functionality.',
          },
          {
            title: '8. Data Retention',
            body: 'We retain your personal data for as long as your account is active or as needed to provide the Service. Upon account termination, data is retained for 30 days before permanent deletion. Billing records may be retained longer as required by law.',
          },
          {
            title: '9. Your Rights',
            body: 'You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data; withdraw consent at any time; and lodge a complaint with a supervisory authority. To exercise these rights, contact us at privacy@ultrakey.in.',
          },
          {
            title: '10. Children\'s Privacy',
            body: 'The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided personal information, we will promptly delete it.',
          },
          {
            title: '11. Changes to This Policy',
            body: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on our website and, where appropriate, by email. Your continued use of the Service constitutes acceptance of the updated policy.',
          },
          {
            title: '12. Contact Us',
            body: 'If you have questions about this Privacy Policy or how we handle your data, please contact our Data Protection Officer at: privacy@ultrakey.in | Ultrakey IT Solutions Private Limited, Hyderabad, Telangana, India – 500001.',
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
