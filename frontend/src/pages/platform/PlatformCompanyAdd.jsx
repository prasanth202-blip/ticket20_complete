import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, subscriptionAPI } from '../../api';
import { Spinner } from '../../components/shared';

export default function PlatformCompanyAdd() {
  const navigate = useNavigate();
  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName:'', companyEmail:'', companyPhone:'', companyAddress:'',
    adminName:'', adminEmail:'', adminPassword:'', subscriptionPlanId:'',
  });

  useEffect(() => { subscriptionAPI.getPlans().then(r=>setPlans(r.data.data||[])).catch(()=>{}); }, []);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.companyName || !form.companyEmail || !form.adminName || !form.adminEmail || !form.adminPassword) {
      toast.error('Fill all required fields'); return;
    }
    setLoading(true);
    try {
      await authAPI.registerCompany(form);
      toast.success('Company registered! Approve it in the Companies list.');
      navigate('/platform/companies');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth:700 }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom:16 }} onClick={()=>navigate('/platform/companies')}>
        <ArrowLeft size={14}/> Back to Companies
      </button>
      <div className="page-header">
        <div><h1>Add New Company</h1><p>Register a company on behalf of a client</p></div>
      </div>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'var(--color-primary-m)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-primary)' }}><Building2 size={17}/></div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>Company Details</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Company Name *</label><input value={form.companyName} onChange={e=>set('companyName',e.target.value)} placeholder="Acme Corp" required/></div>
              <div className="form-group"><label className="form-label">Company Email *</label><input type="email" value={form.companyEmail} onChange={e=>set('companyEmail',e.target.value)} placeholder="info@acme.com" required/></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Phone</label><input value={form.companyPhone} onChange={e=>set('companyPhone',e.target.value)} placeholder="+91 9876543210"/></div>
              <div className="form-group"><label className="form-label">Address</label><input value={form.companyAddress} onChange={e=>set('companyAddress',e.target.value)} placeholder="City, Country"/></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:16 }}>Admin Account</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Admin Name *</label><input value={form.adminName} onChange={e=>set('adminName',e.target.value)} placeholder="Jane Smith" required/></div>
              <div className="form-group"><label className="form-label">Admin Email *</label><input type="email" value={form.adminEmail} onChange={e=>set('adminEmail',e.target.value)} placeholder="jane@acme.com" required/></div>
            </div>
            <div className="form-group" style={{ maxWidth:300 }}>
              <label className="form-label">Password *</label>
              <input type="password" value={form.adminPassword} onChange={e=>set('adminPassword',e.target.value)} placeholder="Min 6 characters" required minLength={6}/>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:12 }}>Subscription Plan</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {plans.map(plan => (
              <label key={plan._id} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:'var(--radius)', border:`1.5px solid ${form.subscriptionPlanId===plan._id?'var(--color-primary)':'var(--color-border)'}`, cursor:'pointer', background:form.subscriptionPlanId===plan._id?'var(--color-primary-l)':undefined }}>
                <input type="radio" name="plan" value={plan._id} checked={form.subscriptionPlanId===plan._id} onChange={e=>set('subscriptionPlanId',e.target.value)} style={{marginTop:2}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{plan.name} — ₹{plan.price?.monthly}/mo</div>
                  <div style={{fontSize:12,color:'var(--color-muted)',marginTop:2}}>{(plan.features_display||[]).slice(0,2).join(' · ')}</div>
                </div>
                {plan.isPopular && <span style={{fontSize:11,color:'var(--color-primary)',fontWeight:700}}>Popular</span>}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button type="button" className="btn btn-secondary" onClick={()=>navigate('/platform/companies')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading?<Spinner size={14}/>:'Register Company'}
          </button>
        </div>
      </form>
    </div>
  );
}
