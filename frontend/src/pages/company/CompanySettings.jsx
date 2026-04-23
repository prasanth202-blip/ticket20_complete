import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, X, Settings, Palette, Sliders, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyAPI } from '../../api';
import { Spinner } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CompanySettings() {
  const { companySlug } = useParams();
  const { user, updateUser } = useAuth();
  const slug = companySlug || user?.company?.slug;

  const [form, setForm] = useState({
    name:'', phone:'', address:'', website:'', description:'',
    branding:{ primaryColor:'#1a6fa8', secondaryColor:'#f59e0b', tagline:'', showLogoOnPortal:true },
    settings:{ allowUserRegistration:true, autoAssignTickets:false, defaultTicketPriority:'medium', ticketCategories:[], workingHours:'9:00 AM – 6:00 PM', supportEmail:'', welcomeMessage:'' },
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [catInput, setCatInput] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef(null);

  const resolveLogoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  };

  useEffect(() => {
    companyAPI.getPublicInfo(slug).then(r => {
      const c = r.data.data;
      setForm({
        name:c.name||'', phone:c.phone||'', address:c.address||'', website:c.website||'', description:c.description||'',
        branding:{ primaryColor:'#1a6fa8', secondaryColor:'#f59e0b', tagline:'', showLogoOnPortal:true, ...c.branding },
        settings:{ allowUserRegistration:true, autoAssignTickets:false, defaultTicketPriority:'medium', ticketCategories:[], workingHours:'9:00 AM – 6:00 PM', supportEmail:'', welcomeMessage:'', ...c.settings },
      });
      setLogoPreview(c.branding?.logo ? resolveLogoUrl(c.branding.logo) : '');
    }).finally(()=>setLoading(false));
  }, [slug]);

  const setB = (k,v) => setForm(p=>({...p,branding:{...p.branding,[k]:v}}));
  const setS = (k,v) => setForm(p=>({...p,settings:{...p.settings,[k]:v}}));

  // Real file upload to backend
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast.error('Logo must be under 2MB'); return; }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to backend
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await companyAPI.uploadLogo(slug, fd);
      const savedUrl = res.data?.logoUrl || res.logoUrl;
      setLogoPreview(resolveLogoUrl(savedUrl));
      setB('logo', savedUrl);
      if (user && updateUser) updateUser({ company: { ...user.company, branding: { ...user.company?.branding, logo: savedUrl } } });
      toast.success('Logo uploaded and saved!');
      
      // Refresh company data to ensure consistency
      const companyRes = await companyAPI.getPublicInfo(slug);
      const companyData = companyRes.data.data;
      setForm(prev => ({
        ...prev,
        branding: { ...prev.branding, ...companyData.branding }
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed.');
      setLogoPreview('');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    setLogoPreview('');
    setB('logo', '');
    // Save immediately
    try {
      const updated = { ...form };
      updated.branding = { ...updated.branding, logo: '' };
      await companyAPI.updateSettings(slug, updated);
      toast.success('Logo removed.');
      
      // Refresh company data to ensure consistency
      const companyRes = await companyAPI.getPublicInfo(slug);
      const companyData = companyRes.data.data;
      setForm(prev => ({
        ...prev,
        branding: { ...prev.branding, ...companyData.branding }
      }));
      
      if (user && updateUser) {
        updateUser({ company: { ...user.company, branding: { ...user.company?.branding, logo: '' } } });
      }
    } catch (err) {
      toast.error('Failed to remove logo.');
    }
  };

  const addCat = () => {
    const v = catInput.trim(); if (!v) return;
    if (form.settings.ticketCategories.includes(v)) { toast.error('Category already exists'); return; }
    setS('ticketCategories', [...form.settings.ticketCategories, v]);
    setCatInput('');
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      // Send without logo field (logo is uploaded separately)
      const payload = {
        name: form.name, phone: form.phone, address: form.address,
        website: form.website, description: form.description,
        branding: form.branding,
        settings: form.settings,
      };
      const res = await companyAPI.updateSettings(slug, payload);
      if (user && updateUser) updateUser({ company: { ...user.company, branding: form.branding, name: form.name, settings: form.settings } });
      toast.success('Settings saved successfully!');
    } catch (err) { toast.error(err.response?.data?.message||'Failed to save settings.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-overlay"><Spinner size={28}/></div>;

  return (
    <div className="fade-in" style={{ maxWidth:800 }}>
      <div className="page-header"><div className="page-header-left"><h1>Company Settings</h1><p>Manage your profile, branding, and preferences</p></div></div>

      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {/* Company Profile */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)', display:'flex', alignItems:'center', gap:10 }}>
            <Settings size={20} style={{ color:'var(--primary)' }}/> Company Profile
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group"><label className="form-label">Company Name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Phone</label><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 9876543210"/></div>
              <div className="form-group"><label className="form-label">Website</label><input value={form.website} onChange={e=>setForm(p=>({...p,website:e.target.value}))} placeholder="https://company.com"/></div>
            </div>
            <div className="form-group"><label className="form-label">Address</label><input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Description</label><textarea rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
          </div>
        </div>

        {/* Branding */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)', display:'flex', alignItems:'center', gap:10 }}>
            <Palette size={20} style={{ color:'#f59e0b' }}/> Branding
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Logo upload */}
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Image size={14}/> Company Logo
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                {logoPreview ? (
                  <div style={{ position:'relative' }}>
                    <img src={logoPreview} alt="Logo" style={{ width:88, height:88, objectFit:'contain', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface2)', padding:10 }}/>
                    {uploadingLogo && (
                      <div style={{ position:'absolute', inset:0, borderRadius:12, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Spinner size={20}/>
                      </div>
                    )}
                    <button type="button" onClick={removeLogo} style={{ position:'absolute', top:-8, right:-8, background:'#ef4444', color:'#fff', border:'none', borderRadius:'50%', width:22, height:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                      <X size={12}/>
                    </button>
                  </div>
                ) : (
                  <div style={{ width:88, height:88, borderRadius:12, border:'2px dashed var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--muted)', background:'var(--surface2)', gap:6 }}>
                    <Upload size={22}/>
                    <span style={{ fontSize:11 }}>Upload</span>
                  </div>
                )}
                <div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
                    {uploadingLogo ? <><Spinner size={13}/> Uploading…</> : <><Upload size={14}/> {logoPreview?'Change Logo':'Upload Logo'}</>}
                    <input ref={logoInputRef} type="file" hidden accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo}/>
                  </label>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>PNG, JPG, SVG — max 2MB. Shown in sidebar and portal.</div>
                  <div style={{ fontSize:11, color:'#10b981', marginTop:3, fontWeight:500 }}>✓ Logo is uploaded directly to the server</div>
                </div>
              </div>
            </div>

           
           
          </div>
        </div>

        {/* Ticket Settings */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)', display:'flex', alignItems:'center', gap:10 }}>
            <Sliders size={20} style={{ color:'#3b82f6' }}/> Ticket Settings
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label">Ticket Categories</label>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <input value={catInput} onChange={e=>setCatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addCat())} placeholder="e.g. AC Repair, Billing…"/>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCat} style={{ flexShrink:0 }}>Add</button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {form.settings.ticketCategories.length===0 ? (
                  <span style={{ fontSize:13, color:'var(--muted)' }}>No categories yet.</span>
                ) : form.settings.ticketCategories.map((cat,i)=>(
                  <span key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, padding:'6px 14px', background:'var(--primary-l)', color:'var(--primary)', borderRadius:20, fontWeight:500 }}>
                    {cat}
                    <button type="button" onClick={()=>setS('ticketCategories',form.settings.ticketCategories.filter((_,x)=>x!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', fontSize:16, lineHeight:1, padding:0 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Working Hours</label><input value={form.settings.workingHours} onChange={e=>setS('workingHours',e.target.value)} placeholder="9:00 AM – 6:00 PM"/></div>
              <div className="form-group"><label className="form-label">Support Email</label><input type="email" value={form.settings.supportEmail||''} onChange={e=>setS('supportEmail',e.target.value)} placeholder="support@company.com"/></div>
            </div>
            <div className="form-group"><label className="form-label">Welcome Message (shown to customers)</label><textarea rows={2} value={form.settings.welcomeMessage||''} onChange={e=>setS('welcomeMessage',e.target.value)} placeholder="Welcome to our support portal. How can we help?"/></div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Preferences</h3>
          {[
            { k:'allowUserRegistration', l:'Allow Customer Self-Registration', d:'Customers can register themselves.' },
            { k:'autoAssignTickets',     l:'Auto-Assign Tickets',              d:'Round-robin assignment to available agents.' },
          ].map(item=>(
            <label key={item.k} style={{ display:'flex', gap:14, alignItems:'flex-start', cursor:'pointer', padding:'12px 16px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', marginBottom:12 }}>
              <input type="checkbox" checked={form.settings[item.k]} onChange={e=>setS(item.k,e.target.checked)} style={{ marginTop:3 }}/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{item.l}</div>
                <div style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>{item.d}</div>
              </div>
            </label>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf:'flex-start', padding:'12px 28px' }}>
          {saving?<><Spinner size={14}/> Saving…</>:'💾 Save All Settings'}
        </button>
      </form>
    </div>
  );
}
