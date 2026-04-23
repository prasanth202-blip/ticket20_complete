import React from 'react';

export default function AdminFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      height: 36,
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      padding: '0 24px',
    }}>
      <p style={{
        fontSize: 11.5,
        color: 'var(--muted)',
        textAlign: 'center',
        margin: 0,
      }}>
        Designed &amp; Developed by{' '}
        <span style={{ fontWeight: 700, color: '#1a6fa8' }}>Ultrakey IT Solutions Pvt. Ltd.</span>
        {' '}— All Rights Reserved © {year}
      </p>
    </footer>
  );
}
