import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { Avatar, Spinner, StarDisplay } from '../../components/shared';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Shield, CheckCircle2 } from 'lucide-react';

export default function AgentProfile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab]         = useState('profile');
  const [form, setForm]       = useState({ name:user?.name||'', phone:user?.phone||'' });
  const [passForm, setPassForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  const validateProfile = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = 'Name is required';
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ''))) newErrors.phone = 'Please enter a valid 10-digit Indian phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passForm.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passForm.newPassword) newErrors.newPassword = 'New password is required';
    else if (passForm.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    if (!passForm.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (passForm.newPassword !== passForm.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSaving(true);
    try {
      const r = await authAPI.updateProfile(form);
      updateUser(r.data.user); toast.success('Profile updated!');
      setErrors({});
    } catch (err) { toast.error(err.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const handlePassSave = async e => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword:passForm.currentPassword, newPassword:passForm.newPassword });
      toast.success('Password changed!'); setPassForm({ currentPassword:'', newPassword:'', confirmPassword:'' }); setErrors({});
    } catch (err) { toast.error(err.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth:540 }}>
      <div className="page-header"><div><h1>My Profile</h1><p>Manage your agent account</p></div></div>

      <div className="card" style={{ display:'flex', alignItems:'center', gap:18, marginBottom:24, padding:20, background:'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)', border:'1px solid rgba(26,111,168,0.2)' }}>
        <Avatar name={user?.name||'?'} size={64}/>
        <div>
          <div style={{ fontFamily:'var(--font-h)', fontSize:22, fontWeight:800, color:'var(--text)' }}>{user?.name}</div>
          <div style={{ fontSize:14, color:'var(--muted)', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
            <Mail size={14}/>{user?.email}
          </div>
          <span className="badge badge-active" style={{ marginTop:8, display:'inline-flex', background:'rgba(16,185,129,0.1)', color:'#10b981', fontWeight:600 }}>🟢 Agent</span>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[
          { value:'profile', label:'Edit Profile', icon:<User size={16}/> },
          { value:'password', label:'Change Password', icon:<Lock size={16}/> }
        ].map(t => (
          <button key={t.value} className={`btn btn-sm ${tab===t.value?'btn-primary':'btn-secondary'}`} onClick={()=>setTab(t.value)} style={{ display:'flex', alignItems:'center', gap:8 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ padding:24, borderRadius:16 }}>
          <form onSubmit={handleProfileSave} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <User size={16} style={{ color:'#1a6fa8'}}/> Full Name *
              </label>
              <input 
                value={form.name} 
                onChange={e=>{setForm(p=>({...p,name:e.target.value})); if(errors.name)setErrors(e=>({...e,name:''}))}}
                style={{ padding:'12px 16px', borderColor:errors.name?'#ef4444':undefined, boxShadow:errors.name?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}
              />
              {errors.name && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Mail size={16} style={{ color:'#1a6fa8'}}/> Email (read-only)
              </label>
              <input value={user?.email} disabled style={{ padding:'12px 16px', opacity:.6, background:'var(--surface2)' }}/>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Phone size={16} style={{ color:'#1a6fa8'}}/> Phone
              </label>
              <input 
                type="tel"
                value={form.phone} 
                onChange={e=>{ const val = e.target.value.replace(/\D/g, '').slice(0,10); setForm(p=>({...p,phone:val})); if(errors.phone)setErrors(e=>({...e,phone:''}))}}
                placeholder="9876543210"
                maxLength={10}
                style={{ padding:'12px 16px', borderColor:errors.phone?'#ef4444':undefined, boxShadow:errors.phone?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}
              />
              {errors.phone && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.phone}</div>}
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>10-digit Indian phone number</div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Shield size={16} style={{ color:'#1a6fa8'}}/> Specializations
              </label>
              <input value={user?.specializations?.join(', ')||''} disabled style={{ padding:'12px 16px', opacity:.6, background:'var(--surface2)' }} placeholder="Set by admin"/>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Managed by your company admin</div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ padding:'12px 24px', borderRadius:10, alignSelf:'flex-start' }}>
              {saving?<><Spinner size={14}/> Saving…</>:<><CheckCircle2 size={16}/> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding:24, borderRadius:16 }}>
          <form onSubmit={handlePassSave} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Lock size={16} style={{ color:'#1a6fa8'}}/> Current Password *
              </label>
              <input 
                type="password" 
                value={passForm.currentPassword} 
                onChange={e=>{setPassForm(p=>({...p,currentPassword:e.target.value})); if(errors.currentPassword)setErrors(e=>({...e,currentPassword:''}))}}
                style={{ padding:'12px 16px', borderColor:errors.currentPassword?'#ef4444':undefined, boxShadow:errors.currentPassword?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}
              />
              {errors.currentPassword && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.currentPassword}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Lock size={16} style={{ color:'#1a6fa8'}}/> New Password *
              </label>
              <input 
                type="password" 
                value={passForm.newPassword} 
                onChange={e=>{setPassForm(p=>({...p,newPassword:e.target.value})); if(errors.newPassword)setErrors(e=>({...e,newPassword:''}))}}
                style={{ padding:'12px 16px', borderColor:errors.newPassword?'#ef4444':undefined, boxShadow:errors.newPassword?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}
              />
              {errors.newPassword && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.newPassword}</div>}
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Minimum 6 characters</div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <CheckCircle2 size={16} style={{ color:'#1a6fa8'}}/> Confirm New Password *
              </label>
              <input 
                type="password" 
                value={passForm.confirmPassword} 
                onChange={e=>{setPassForm(p=>({...p,confirmPassword:e.target.value})); if(errors.confirmPassword)setErrors(e=>({...e,confirmPassword:''}))}}
                style={{ padding:'12px 16px', borderColor:errors.confirmPassword?'#ef4444':undefined, boxShadow:errors.confirmPassword?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}
              />
              {errors.confirmPassword && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.confirmPassword}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ padding:'12px 24px', borderRadius:10, alignSelf:'flex-start' }}>
              {saving?<><Spinner size={14}/> Changing…</>:<><Lock size={16}/> Change Password</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
