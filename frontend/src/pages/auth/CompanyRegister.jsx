import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, subscriptionAPI } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { Spinner, ThemeToggle } from '../../components/shared';

const fmtINR = (paise) => `₹${(paise/100).toLocaleString('en-IN')}`;

export default function CompanyRegister() {
  const { theme } = useTheme();
  const [step, setStep]     = useState(1);
  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSlug, setSubmittedSlug] = useState('');
  const [err, setErr]       = useState('');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName:'', companyEmail:'', companyPhone:'', companyAddress:'',
    adminName:'', adminEmail:'', adminPassword:'', confirmPassword:'',
    subscriptionPlanId:'',
  });

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then(r => setPlans(r.data.data||[]))
      .catch(() => {});
  }, []);

  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErr(''); };

  const validateStep1 = () => {
    if (!form.companyName.trim()) return 'Company name is required.';
    if (!form.companyEmail.trim() || !/\S+@\S+\.\S+/.test(form.companyEmail)) return 'Valid company email is required.';
    if (form.companyPhone && !/^\d+$/.test(form.companyPhone)) return 'Phone number must contain only digits.';
    if (form.companyPhone && form.companyPhone.length !== 10) return 'Phone number must be exactly 10 digits.';
    return null;
  };

  const validateStep2 = () => {
    if (!form.adminName.trim()) return 'Admin name is required.';
    if (!form.adminEmail.trim() || !/\S+@\S+\.\S+/.test(form.adminEmail)) return 'Valid admin email is required.';
    if (form.adminPassword.length < 6) return 'Password must be at least 6 characters.';
    if (form.adminPassword !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const r = await authAPI.registerCompany(form);
      setSubmittedSlug(r.data.data?.companySlug || '');
      setSubmitted(true);
    } catch (e) { setErr(e.response?.data?.message || 'Registration failed. Try again.'); }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-box" style={{ maxWidth:480 }}>
          <div className="auth-card" style={{ textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(16,185,129,.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
              <CheckCircle size={30} color="var(--success)"/>
            </div>
            <h2 style={{ marginBottom:8 }}>Registration Submitted!</h2>
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              Your company <strong>{form.companyName}</strong> has been submitted for review.<br/>
              You'll receive an email notification once approved (typically within 24 hours).
            </p>
            {submittedSlug && (
              <div style={{ padding:'12px 16px', background:'var(--primary-l)', borderRadius:'var(--r)', marginBottom:20, fontSize:13 }}>
                Your portal URL will be: <strong style={{ color:'var(--primary)' }}>/{submittedSlug}</strong>
              </div>
            )}
            <Link to="/" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600 }}>Back to Home</Link>
          </div>
        </div>
        <div style={{ position:'fixed', top:16, right:16 }}><ThemeToggle/></div>
      </div>
    );
  }

  const STEPS = ['Company Info', 'Admin Account', 'Choose Plan'];

  return (
    <div className="auth-page" style={{ alignItems:'flex-start', paddingTop:32 }}>
      <div className="auth-box" style={{ maxWidth:540, margin:'0 auto' }}>
        <a href="/" className="auth-logo">
          <img src={theme === 'dark' ? '/logo_white.png' : '/logo.png'} alt="logo" style={{ width:150, height:150, objectFit:'contain' }}/>
        </a>

        <div className="auth-card">
          <h2 style={{ marginBottom:4 }}>Register Your Company</h2>
          <p className="subtitle">14-day free trial · No credit card required</p>

          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24 }}>
            {STEPS.map((s,i) => (
              <React.Fragment key={i}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, transition:'all .2s',
                    background: step>i+1?'var(--success)':step===i+1?'var(--primary)':'var(--surface2)',
                    color: step>=i+1?'#fff':'var(--muted)', border:`2px solid ${step>i+1?'var(--success)':step===i+1?'var(--primary)':'var(--border)'}` }}>
                    {step>i+1?'✓':i+1}
                  </div>
                  <span style={{ fontSize:11, marginTop:4, color:step===i+1?'var(--primary)':'var(--muted)', fontWeight:step===i+1?600:400, whiteSpace:'nowrap' }}>{s}</span>
                </div>
                {i<STEPS.length-1&&<div style={{ flex:1, height:2, background:step>i+1?'var(--success)':'var(--border)', maxWidth:40, marginBottom:18, transition:'background .3s' }}/>}
              </React.Fragment>
            ))}
          </div>

          {err && (
            <div style={{ display:'flex', gap:8, padding:'10px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', marginBottom:16, fontSize:13, color:'var(--danger)' }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {err}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {step===1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div className="form-group"><label className="form-label">Company Name *</label><input value={form.companyName} onChange={e=>set('companyName',e.target.value)} placeholder="Acme Corporation" autoFocus/></div>
                <div className="form-group"><label className="form-label">Company Email *</label><input type="email" value={form.companyEmail} onChange={e=>set('companyEmail',e.target.value)} placeholder="info@acme.com"/></div>
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Phone (10 digits)</label><input value={form.companyPhone} onChange={e=>set('companyPhone',e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="9876543210" maxLength={10}/></div>
                  <div className="form-group"><label className="form-label">City / Address</label><input value={form.companyAddress} onChange={e=>set('companyAddress',e.target.value)} placeholder="Mumbai, India"/></div>
                </div>
                <button type="button" className="btn btn-primary" style={{ marginTop:4, padding: '12px 24px', fontSize: 15, fontWeight: 600 }} onClick={()=>{ const v=validateStep1(); if(v){setErr(v);return;} setStep(2); }}>
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step===2 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div className="form-group"><label className="form-label">Your Full Name *</label><input value={form.adminName} onChange={e=>set('adminName',e.target.value)} placeholder="Jane Smith" autoFocus/></div>
                <div className="form-group"><label className="form-label">Admin Email *</label><input type="email" value={form.adminEmail} onChange={e=>set('adminEmail',e.target.value)} placeholder="jane@acme.com"/></div>
                <div className="form-group"><label className="form-label">Password * (min 6 chars)</label><input type="password" value={form.adminPassword} onChange={e=>set('adminPassword',e.target.value)} placeholder="Create a secure password"/></div>
                <div className="form-group"><label className="form-label">Confirm Password *</label><input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} placeholder="Repeat password"/></div>
                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: 15, fontWeight: 600 }} onClick={()=>setStep(1)}>← Back</button>
                  <button type="button" className="btn btn-primary" style={{ flex:1, padding: '12px 24px', fontSize: 15, fontWeight: 600 }} onClick={()=>{ const v=validateStep2(); if(v){setErr(v);return;} setStep(3); }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step===3 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
                  Select a plan (you can change it anytime after approval).
                </p>
                {plans.length===0 ? (
                  <div style={{ textAlign:'center', padding:'20px 0', color:'var(--muted)', fontSize:13 }}>
                    <Spinner size={16}/> Loading plans…
                  </div>
                ) : plans.map(plan => (
                  <label key={plan._id} style={{ display:'flex', gap:12, padding:'13px 15px', borderRadius:'var(--r-lg)', border:`1.5px solid ${form.subscriptionPlanId===plan._id?'var(--primary)':'var(--border)'}`, cursor:'pointer', background:form.subscriptionPlanId===plan._id?'var(--primary-l)':undefined, transition:'all var(--t)', position:'relative' }}>
                    <input type="radio" name="plan" value={plan._id} checked={form.subscriptionPlanId===plan._id} onChange={e=>set('subscriptionPlanId',e.target.value)} style={{ marginTop:2 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{plan.name}</span>
                        {plan.isPopular&&<span style={{ fontSize:10, background:'var(--primary)', color:'#fff', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>POPULAR</span>}
                      </div>
                      <div style={{ fontSize:13, color:'var(--primary)', fontWeight:700, marginBottom:3 }}>
                        {fmtINR(plan.price?.monthly)}/month
                      </div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>
                        {plan.limits?.max_agents} agents · {plan.limits?.max_tickets_per_month} tickets/mo
                      </div>
                    </div>
                  </label>
                ))}
                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: 15, fontWeight: 600 }} onClick={()=>setStep(2)}>← Back</button>
                  <button type="submit" className="btn btn-primary" style={{ flex:1, padding: '12px 24px', fontSize: 15, fontWeight: 600 }} disabled={loading}>
                    {loading?<><Spinner size={14}/> Submitting…</>:'Submit Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:14, fontSize:13, color:'var(--muted)' }}>
          Already registered? <Link to="/" style={{ color:'var(--primary)' }}>Login via your company URL</Link>
        </p>
      </div>
      <div style={{ position:'fixed', top:16, right:16 }}><ThemeToggle/></div>
    </div>
  );
}
