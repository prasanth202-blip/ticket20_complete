import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Spinner, ThemeToggle } from '../../components/shared';

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

// ── Platform Login ────────────────────────────────────────
export default function PlatformLogin() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(''); setLoading(true);
    try {
      const r = await authAPI.platformLogin(form);
      login(r.data.token, r.data.user);
      toast.success('Welcome back!');
      navigate('/platform/dashboard');
    } catch (e) { setErr(e.response?.data?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Platform Login" subtitle="Sign in as Platform Administrator">
      {err && (
        <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" placeholder="admin@ticketflow.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} autoFocus/>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input type={show?'text':'password'} placeholder="Enter password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
            <button type="button" className="eye-btn" onClick={()=>setShow(!show)}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', marginTop:4, padding:'12px 24px', fontSize:15, fontWeight:600 }}>
          {loading?<><Spinner size={15}/> Signing in…</>:'Sign In'}
        </button>
        <div style={{ textAlign:'right', marginTop:4 }}>
          <Link to="/platform/forgot-password" style={{ fontSize:13, color:'var(--primary)', textDecoration:'none', fontWeight:500 }}>Forgot password?</Link>
        </div>
      </form>
      <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
        Company admin? Use your company URL: <code style={{background:'var(--surface2)',padding:'2px 6px',borderRadius:4,fontSize:12}}>/your-slug/login</code>
      </div>
    </AuthLayout>
  );
}

// ── Company Admin Login ───────────────────────────────────
export function CompanyLogin() {
  const { companySlug } = useParams();
  const [form, setForm] = useState({ email:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(''); setLoading(true);
    try {
      const r = await authAPI.companyLogin(companySlug, form);
      login(r.data.token, r.data.user);
      toast.success('Welcome back!');
      const role = r.data.user.role;
      if (role === 'agent') navigate(`/${companySlug}/agent/dashboard`);
      else navigate(`/${companySlug}/dashboard`);
    } catch (e) { setErr(e.response?.data?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Staff Login" subtitle={`Sign in to ${companySlug} portal`}>
      {err && (
        <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} autoFocus/>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input type={show?'text':'password'} placeholder="Enter password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
            <button type="button" className="eye-btn" onClick={()=>setShow(!show)}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', marginTop:4, padding:'12px 24px', fontSize:15, fontWeight:600 }}>
          {loading?<><Spinner size={15}/> Signing in…</>:'Sign In'}
        </button>
        <div style={{ textAlign:'right', marginTop:4 }}>
          <Link to={`/${companySlug}/forgot-password`} style={{ fontSize:13, color:'var(--primary)', textDecoration:'none', fontWeight:500 }}>Forgot password?</Link>
        </div>
      </form>
      <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)', display:'flex', justifyContent:'center', gap:12 }}>
        <Link to={`/${companySlug}/user/login`} style={{ color:'var(--muted)' }}>Customer login</Link>
      </div>
    </AuthLayout>
  );
}

// ── User Login ────────────────────────────────────────────
export function UserLogin() {
  const { companySlug } = useParams();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(''); setLoading(true);
    try {
      const r = await authAPI.userLogin(companySlug, form);
      login(r.data.token, r.data.user);
      toast.success('Welcome back!');
      navigate(`/${companySlug}/my/dashboard`);
    } catch (e) { setErr(e.response?.data?.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Customer Login" subtitle="Access your support tickets">
      {err && (
        <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} autoFocus/>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" placeholder="Enter password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', marginTop:4, padding:'12px 24px', fontSize:15, fontWeight:600 }}>
          {loading?<><Spinner size={15}/> Signing in…</>:'Sign In'}
        </button>
        <div style={{ textAlign:'right', marginTop:4 }}>
          <Link to={`/${companySlug}/user/forgot-password`} style={{ fontSize:13, color:'var(--primary)', textDecoration:'none', fontWeight:500 }}>Forgot password?</Link>
        </div>
      </form>
      <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)', display:'flex', justifyContent:'center', gap:12 }}>
        <span>No account? <Link to={`/${companySlug}/user/register`} style={{ color:'var(--primary)' }}>Register</Link></span>
        <span style={{ color:'var(--border2)' }}>·</span>
        <Link to={`/${companySlug}/login`} style={{ color:'var(--muted)' }}>Staff login</Link>
      </div>
    </AuthLayout>
  );
}

// ── User Register ─────────────────────────────────────────
export function UserRegister() {
  const { companySlug } = useParams();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!/^\d+$/.test(form.phone)) return 'Phone number must contain only digits.';
    if (form.phone.length !== 10) return 'Phone number must be exactly 10 digits.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const v = validate(); if (v) { setErr(v); return; }
    setErr(''); setLoading(true);
    try {
      const r = await authAPI.userRegister(companySlug, form);
      login(r.data.token, r.data.user);
      toast.success('Account created! Welcome!');
      navigate(`/${companySlug}/my/dashboard`);
    } catch (e) { setErr(e.response?.data?.message || 'Registration failed. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Register for customer support">
      {err && (
        <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input placeholder="John Doe" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} autoFocus/>
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input type="email" placeholder="john@email.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
            Phone Number <span style={{ color:'#ef4444', fontWeight:700 }}>*</span>
            <span style={{ fontSize:11, color:'var(--muted)', marginLeft:4, fontWeight:400 }}>(10 digits, required)</span>
          </label>
          <input placeholder="9876543210" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value.replace(/\D/g,'').slice(0,10)}))} maxLength={10}/>
        </div>
        <div className="form-group">
          <label className="form-label">Password * (min 6 chars)</label>
          <input type="password" placeholder="Create a password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', marginTop:4, padding:'12px 24px', fontSize:15, fontWeight:600 }}>
          {loading?<><Spinner size={15}/> Creating account…</>:'Create Account'}
        </button>
      </form>
      <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
        Already have an account? <Link to={`/${companySlug}/user/login`} style={{ color:'var(--primary)' }}>Sign in</Link>
      </div>
    </AuthLayout>
  );
}
