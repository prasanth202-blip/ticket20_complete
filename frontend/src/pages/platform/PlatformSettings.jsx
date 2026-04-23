import React, { useEffect, useState } from 'react';
import { Settings, Bell, Shield, Globe, Mail, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformAPI } from '../../api';
import { Spinner } from '../../components/shared';

const DEFAULTS = {
  platformName: 'TicketFlow', platformEmail: 'admin@ticketflow.com',
  supportEmail: 'support@ticketflow.com', smtpHost: 'smtp.gmail.com',
  smtpPort: '587', smtpUser: '', smtpPass: '',
  emailNotifications: true, maintenanceMode: false,
  allowCompanyRegistration: true, requireApproval: true,
  maxTrialDays: 14,
};

export default function PlatformSettings() {
  const [form, setForm]     = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformAPI.getSettings()
      .then(r => {
        const d = r.data.data;
        setForm({
          platformName:             d.platformName             ?? DEFAULTS.platformName,
          platformEmail:            d.platformEmail            ?? DEFAULTS.platformEmail,
          supportEmail:             d.supportEmail             ?? DEFAULTS.supportEmail,
          smtpHost:                 d.smtpHost                 ?? DEFAULTS.smtpHost,
          smtpPort:                 d.smtpPort                 ?? DEFAULTS.smtpPort,
          smtpUser:                 d.smtpUser                 ?? '',
          smtpPass:                 '',
          emailNotifications:       d.emailNotifications       ?? true,
          maintenanceMode:          d.maintenanceMode          ?? false,
          allowCompanyRegistration: d.allowCompanyRegistration ?? true,
          requireApproval:          d.requireApproval          ?? true,
          maxTrialDays:             d.maxTrialDays             ?? 14,
        });
      })
      .catch(() => toast.error('Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.maxTrialDays < 1 || form.maxTrialDays > 365) {
      toast.error('Trial period must be between 1 and 365 days.');
      return;
    }
    setSaving(true);
    try {
      await platformAPI.updateSettings(form);
      toast.success('Settings saved and persisted to database!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-overlay" style={{ minHeight: '60vh' }}><Spinner size={28}/></div>;

  const sectionIcon = (icon, color, bg) => (
    <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Platform Settings</h1>
          <p>Configure global platform behaviour — changes are saved to the database and persist after reload.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {/* General */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            {sectionIcon(<Globe size={22}/>, '#1a6fa8', 'rgba(26,111,168,.12)')}
            <div>
              <div style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>General</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Platform identity and branding</div>
            </div>
          </div>
          <div className="form-grid" style={{ gap:16 }}>
            <div className="form-group">
              <label className="form-label">Platform Name</label>
              <input value={form.platformName} onChange={e=>set('platformName',e.target.value)} style={{ padding:'10px 14px' }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input type="email" value={form.platformEmail} onChange={e=>set('platformEmail',e.target.value)} style={{ padding:'10px 14px' }}/>
            </div>
            <div className="form-group">
              <label className="form-label">Support Email</label>
              <input type="email" value={form.supportEmail} onChange={e=>set('supportEmail',e.target.value)} style={{ padding:'10px 14px' }}/>
            </div>
          </div>
        </div>

        {/* Email / SMTP */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            {sectionIcon(<Mail size={22}/>, '#3b82f6', 'rgba(59,130,246,.12)')}
            <div>
              <div style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Email / SMTP</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>For sending notifications and password reset emails</div>
            </div>
          </div>
          <div className="form-grid" style={{ gap:16 }}>
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input value={form.smtpHost} onChange={e=>set('smtpHost',e.target.value)} placeholder="smtp.gmail.com" style={{ padding:'10px 14px' }}/>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input value={form.smtpPort} onChange={e=>set('smtpPort',e.target.value)} placeholder="587" style={{ padding:'10px 14px' }}/>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP User</label>
              <input value={form.smtpUser} onChange={e=>set('smtpUser',e.target.value)} placeholder="your@gmail.com" style={{ padding:'10px 14px' }}/>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password</label>
              <input type="password" value={form.smtpPass} onChange={e=>set('smtpPass',e.target.value)} placeholder="Leave blank to keep existing" style={{ padding:'10px 14px' }}/>
            </div>
          </div>
        </div>

        {/* Registration Policies */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            {sectionIcon(<Shield size={22}/>, '#10b981', 'rgba(16,185,129,.12)')}
            <div>
              <div style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Registration Policies</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Control who can register and how new companies are handled</div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
            {[
              { key:'allowCompanyRegistration', label:'Allow company self-registration', desc:'Companies can register from the landing page' },
              { key:'requireApproval', label:'Require manual approval', desc:'New companies must be approved by platform admin before activation' },
              { key:'emailNotifications', label:'Email notifications enabled', desc:'Send email alerts for registrations and ticket updates' },
              { key:'maintenanceMode', label:'Maintenance mode', desc:'Temporarily disable all company portals' },
            ].map(item => (
              <label key={item.key} style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', padding:'14px 16px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)', transition:'all 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <input type="checkbox" checked={form[item.key]} onChange={e=>set(item.key,e.target.checked)} style={{ marginTop:3, width:'auto', accentColor:'#1a6fa8' }}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{item.label}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{item.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="form-group" style={{ maxWidth:240 }}>
            <label className="form-label" style={{ fontSize:13, fontWeight:600, color:'var(--text)', display:'flex', alignItems:'center', gap:6 }}>
              <Bell size={14} style={{ color:'#f59e0b' }}/> Trial Period (days)
            </label>
            <input
              type="number" min={1} max={365}
              value={form.maxTrialDays}
              onChange={e=>set('maxTrialDays', parseInt(e.target.value) || 14)}
              style={{ padding:'10px 14px' }}
            />
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
              New companies get this many trial days (currently: <strong>{form.maxTrialDays} days</strong>)
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding:'12px 32px', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
            {saving ? <><Spinner size={14}/> Saving…</> : <><Save size={16}/> Save Settings</>}
          </button>
          <button type="button" className="btn btn-secondary" onClick={()=>{ setLoading(true); platformAPI.getSettings().then(r=>{ const d=r.data.data; setForm({...DEFAULTS,...d,smtpPass:''}); }).finally(()=>setLoading(false)); }} style={{ padding:'12px 24px', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
            <RefreshCw size={15}/> Reload
          </button>
        </div>
      </form>
    </div>
  );
}
