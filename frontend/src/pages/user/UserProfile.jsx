import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Spinner } from '../../components/shared';
import { User, Mail, Phone, Lock, Camera, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm]       = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass]       = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors]             = useState({});
  const fileInputRef = useRef(null);

  const resolveAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileForm.name?.trim()) newErrors.name = 'Name is required';
    if (!profileForm.phone?.trim()) newErrors.phone = 'Phone number is required *';
    else if (!/^\d{10}$/.test(profileForm.phone.replace(/\D/g, ''))) newErrors.phone = 'Enter a valid 10-digit phone number';
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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving profile');
    } finally { setSavingProfile(false); }
  };

  const handlePassSave = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSavingPass(true);
    try {
      await authAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing password');
    } finally { setSavingPass(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await authAPI.uploadAvatar(fd);
      updateUser(res.data.user);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await authAPI.removeAvatar();
      updateUser(res.data.user);
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error('Could not remove photo');
    }
  };

  const avatarSrc = user?.avatar ? resolveAvatarUrl(user.avatar) : '';

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <div className="page-header"><div><h1>My Profile</h1><p>Manage your account information and password</p></div></div>

      {/* Avatar card */}
      <div className="card" style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24, padding:24, background:'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)', border:'1px solid rgba(26,111,168,0.2)' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--primary)' }}/>
          ) : (
            <Avatar name={user?.name||'?'} size={72}/>
          )}
          {uploadingAvatar && (
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Spinner size={20}/>
            </div>
          )}
          <label style={{ position:'absolute', bottom:-4, right:-4, width:28, height:28, borderRadius:'50%', background:'#1a6fa8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid var(--surface)', boxShadow:'0 2px 6px rgba(0,0,0,.2)' }}>
            <Camera size={13}/>
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar}/>
          </label>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-h)', fontSize:20, fontWeight:800, color:'var(--text)' }}>{user?.name}</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>{user?.email}</div>
          <div style={{ fontSize:12, marginTop:4, color:'#1a6fa8', fontWeight:600 }}>{user?.company?.name}</div>
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <label className="btn btn-secondary btn-xs" style={{ cursor:'pointer', fontSize:12, padding:'6px 12px' }}>
              <Camera size={12}/> {avatarSrc ? 'Change Photo' : 'Upload Photo'}
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar}/>
            </label>
            {avatarSrc && (
              <button type="button" className="btn btn-ghost btn-xs" style={{ fontSize:12, color:'#ef4444', padding:'6px 12px' }} onClick={handleRemoveAvatar}>
                <Trash2 size={12}/> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card" style={{ padding:24, borderRadius:16, marginBottom:24 }}>
        <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, marginBottom:20, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
          <User size={20} style={{ color:'#1a6fa8'}}/> Personal Information
        </h3>
        <form onSubmit={handleProfileSave} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="form-group">
            <label className="form-label"><User size={14} style={{ color:'#1a6fa8', marginRight:4 }}/>Full Name *</label>
            <input value={profileForm.name} onChange={e=>{setProfileForm(p=>({...p,name:e.target.value})); if(errors.name)setErrors(e=>({...e,name:''}))}}
              style={{ borderColor:errors.name?'#ef4444':undefined }}/>
            {errors.name && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label"><Mail size={14} style={{ color:'#1a6fa8', marginRight:4 }}/>Email (read-only)</label>
            <input value={user?.email} disabled style={{ opacity:.6, background:'var(--surface2)' }}/>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Phone size={14} style={{ color:'#1a6fa8' }}/> Phone Number <span style={{ color:'#ef4444' }}>*</span>
            </label>
            <input
              value={profileForm.phone}
              onChange={e=>{setProfileForm(p=>({...p,phone:e.target.value.replace(/\D/g,'').slice(0,10)})); if(errors.phone)setErrors(e=>({...e,phone:''}))}}
              placeholder="10-digit mobile number"
              maxLength={10}
              style={{ borderColor:errors.phone?'#ef4444':undefined }}
            />
            {errors.phone && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.phone}</div>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ alignSelf:'flex-start', padding:'10px 24px' }}>
            {savingProfile?<><Spinner size={14}/> Saving…</>:'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card" style={{ padding:24, borderRadius:16 }}>
        <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, marginBottom:20, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
          <Lock size={20} style={{ color:'#f59e0b'}}/> Change Password
        </h3>
        <form onSubmit={handlePassSave} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {[
            { k:'currentPassword', label:'Current Password', ph:'Enter current password' },
            { k:'newPassword',     label:'New Password',     ph:'Min 6 characters' },
            { k:'confirmPassword', label:'Confirm Password', ph:'Repeat new password' },
          ].map(({ k, label, ph }) => (
            <div key={k} className="form-group">
              <label className="form-label">{label}</label>
              <input type="password" value={passForm[k]} placeholder={ph}
                onChange={e=>{setPassForm(p=>({...p,[k]:e.target.value})); if(errors[k])setErrors(e=>({...e,[k]:''}))}}
                style={{ borderColor:errors[k]?'#ef4444':undefined }}/>
              {errors[k] && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors[k]}</div>}
            </div>
          ))}
          <button type="submit" className="btn btn-warning" disabled={savingPass} style={{ alignSelf:'flex-start', padding:'10px 24px' }}>
            {savingPass?<><Spinner size={14}/> Changing…</>:'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
