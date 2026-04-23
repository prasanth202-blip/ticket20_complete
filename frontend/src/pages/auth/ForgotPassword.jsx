import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api';
import { Spinner, ThemeToggle } from '../../components/shared';
import { useTheme } from '../../context/ThemeContext';

function AuthLayout({ children, title, subtitle }) {
  const { theme } = useTheme();
  return (
    <div className="auth-page">
      <div className="auth-box">
        <a href="/" className="auth-logo">
          <img src={theme === 'dark' ? '/logo_white.png' : '/logo.png'} alt="logo" style={{ width:150, height:150, objectFit:'contain' }}/>
        </a>
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
          {children}
        </div>
      </div>
      <div style={{ position:'fixed', top:16, right:16 }}><ThemeToggle/></div>
    </div>
  );
}

export default function ForgotPassword() {
  const { companySlug } = useParams();
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setErr('Please enter a valid email address.'); return; }
    setLoading(true); setErr('');
    try {
      if (companySlug) {
        await authAPI.forgotPasswordCompany(companySlug, { email, companySlug });
      } else {
        await authAPI.forgotPassword({ email });
      }
      setSent(true);
    } catch (e) { setErr(e.response?.data?.message || 'Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <AuthLayout title="Check Your Email" subtitle="Password reset instructions sent">
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(16,185,129,.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <CheckCircle size={28} color="#10b981"/>
          </div>
          <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.7, marginBottom:20 }}>
            If an account with <strong>{email}</strong> exists, we've sent a password reset link. Check your inbox (and spam folder).
          </p>
          <div style={{ padding:'12px 16px', background:'var(--surface2)', borderRadius:10, fontSize:13, color:'var(--muted)', marginBottom:20 }}>
            The link expires in <strong>30 minutes</strong>.
          </div>
          <Link to={companySlug ? `/${companySlug}/login` : '/platform/login'} className="btn btn-primary" style={{ width:'100%', padding:'12px', fontSize:15, fontWeight:600 }}>
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="We'll send you a reset link">
      {err && (
        <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" placeholder="Enter your registered email" value={email} onChange={e=>{ setEmail(e.target.value); setErr(''); }} autoFocus/>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', padding:'12px', fontSize:15, fontWeight:600 }}>
          {loading ? <><Spinner size={15}/> Sending…</> : <><KeyRound size={16}/> Send Reset Link</>}
        </button>
      </form>
      <div style={{ textAlign:'center', marginTop:16 }}>
        <Link to={companySlug ? `/${companySlug}/login` : '/platform/login'} style={{ fontSize:13, color:'var(--muted)', display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none' }}>
          <ArrowLeft size={13}/> Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}

export function ResetPassword() {
  const { token, companySlug } = useParams();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ password:'', confirm:'' });
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match.'); return; }
    setLoading(true); setErr('');
    try {
      await authAPI.resetPassword(token, { password: form.password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate(companySlug ? `/${companySlug}/login` : '/platform/login'), 2000);
    } catch (e) { setErr(e.response?.data?.message || 'Reset link is invalid or expired.'); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <AuthLayout title="Password Reset!" subtitle="You can now log in with your new password">
        <div style={{ textAlign:'center' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(16,185,129,.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <CheckCircle size={28} color="#10b981"/>
          </div>
          <p style={{ color:'var(--muted)', fontSize:14 }}>Redirecting to login…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password below">
      {err && (
        <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>{ setForm(p=>({...p,password:e.target.value})); setErr(''); }} autoFocus/>
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input type="password" placeholder="Repeat new password" value={form.confirm} onChange={e=>{ setForm(p=>({...p,confirm:e.target.value})); setErr(''); }}/>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', padding:'12px', fontSize:15, fontWeight:600 }}>
          {loading ? <><Spinner size={15}/> Resetting…</> : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
