import React, { useState, useRef } from 'react';
import { Camera, Trash2, User, Mail, Phone, Lock, Eye, EyeOff, Save, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/shared';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ROLE_LABELS = {
  platform_owner:      'Platform Owner',
  company_super_admin: 'Super Admin',
  company_admin:       'Admin',
  employee:            'Employee',
  agent:               'Agent',
  user:                'Customer',
};

const ROLE_COLORS = {
  platform_owner:      '#1a6fa8',
  company_super_admin: '#dc2626',
  company_admin:       '#7c3aed',
  employee:            '#2563eb',
  agent:               '#059669',
  user:                '#6b7280',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile form
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving]   = useState(false);

  // Password form
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving,  setAvatarRemoving]  = useState(false);
  const [avatarHover,     setAvatarHover]     = useState(false);
  const fileRef = useRef(null);

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
    : null;

  // ── Profile Save ──────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.phone || !form.phone.trim()) return toast.error('Phone number is required.');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      updateUser({ name: res.data.user.name, phone: res.data.user.phone });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  // ── Password Change ───────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword) return toast.error('Current password is required');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  // ── Avatar Upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2 MB');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) return toast.error('Only JPG, PNG, WebP or GIF allowed');

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await authAPI.uploadAvatar(fd);
      
      // Handle both response formats and ensure proper URL construction
      let updatedUser;
      if (res.data.user) {
        updatedUser = res.data.user;
      } else if (res.data.avatarUrl) {
        // Ensure avatarUrl has proper URL format
        const avatarUrl = res.data.avatarUrl.startsWith('http') 
          ? res.data.avatarUrl 
          : `${BACKEND_URL}${res.data.avatarUrl}`;
        updatedUser = { ...user, avatar: avatarUrl };
      } else {
        throw new Error('Invalid response format');
      }
      
      updateUser(updatedUser);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setAvatarUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleAvatarRemove = async () => {
    if (!user?.avatar) return;
    setAvatarRemoving(true);
    try {
      await authAPI.removeAvatar();
      updateUser({ avatar: null });
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed');
    } finally { setAvatarRemoving(false); }
  };

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const roleColor = ROLE_COLORS[user?.role] || '#1a6fa8';

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1>
          <p>Manage your account information and security settings</p>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="card" style={{ marginBottom: 20, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              style={{ position: 'relative', width: 96, height: 96, cursor: 'pointer' }}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onClick={() => !avatarUploading && fileRef.current?.click()}
            >
              {/* Avatar circle */}
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${roleColor}`, boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
                />
              ) : (
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}cc 100%)`,
                  border: `3px solid ${roleColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, fontWeight: 800, color: '#fff',
                  fontFamily: 'var(--font-h)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
                }}>
                  {initials}
                </div>
              )}

              {/* Overlay on hover */}
              {(avatarHover || avatarUploading) && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.2s',
                }}>
                  {avatarUploading ? <Spinner size={22} color="#fff" /> : <Camera size={22} color="#fff" />}
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            {/* Upload / Remove buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Camera size={11} /> {avatarUploading ? 'Uploading…' : 'Change'}
              </button>
              {user?.avatar && (
                <button
                  className="btn btn-xs"
                  onClick={handleAvatarRemove}
                  disabled={avatarRemoving}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {avatarRemoving ? <Spinner size={11} /> : <Trash2 size={11} />}
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', maxWidth: 100 }}>
              JPG, PNG or WebP · Max 2 MB
            </p>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{user?.name}</h2>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                background: `${roleColor}18`, color: roleColor,
                border: `1px solid ${roleColor}30`,
              }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text2)' }}>
                <Mail size={14} style={{ color: 'var(--muted)' }} /> {user?.email}
              </div>
              {user?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text2)' }}>
                  <Phone size={14} style={{ color: 'var(--muted)' }} /> {user.phone}
                </div>
              )}
              {user?.company?.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text2)' }}>
                  <Shield size={14} style={{ color: 'var(--muted)' }} /> {user.company.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Info ── */}
      <div className="card" style={{ marginBottom: 20, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26,111,168,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} style={{ color: '#1a6fa8' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Personal Information</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Update your name and contact details</div>
          </div>
        </div>
        <form onSubmit={handleProfileSave}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <span className="form-hint">Email cannot be changed</span>
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: 320, marginBottom: 20 }}>
            <label className="form-label">Phone Number</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 99999 99999"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {saving ? <><Spinner size={14} /> Saving…</> : <><Save size={14} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* ── Change Password ── */}
      <div className="card" style={{ marginBottom: 20, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Change Password</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Use a strong password of at least 6 characters</div>
          </div>
        </div>
        <form onSubmit={handlePasswordChange}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
            {[
              { key: 'currentPassword', label: 'Current Password',  show: showCur, setShow: setShowCur },
              { key: 'newPassword',     label: 'New Password',      show: showNew, setShow: setShowNew },
              { key: 'confirmPassword', label: 'Confirm New Password', show: showCon, setShow: setShowCon },
            ].map(({ key, label, show, setShow }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <div className="input-group">
                  <input
                    type={show ? 'text' : 'password'}
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwSaving} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
            {pwSaving ? <><Spinner size={14} /> Updating…</> : <><CheckCircle size={14} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
