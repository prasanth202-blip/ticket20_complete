import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Paperclip, X, ArrowLeft, AlertCircle, Ticket, FileText, Tag, Mail, Phone, Upload, CheckCircle2, Zap, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketAPI, serviceAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/shared';

const PRIORITIES = [
  { value: 'low',      label: '🟢 Low',     desc: 'Minor issue, can wait' },
  { value: 'medium',   label: '🟡 Medium',   desc: 'Normal priority' },
  { value: 'high',     label: '🔴 High',     desc: 'Needs quick attention' },
  { value: 'critical', label: '🚨 Critical', desc: 'Urgent, blocking work' },
];

export default function CreateTicket() {
  const { companySlug } = useParams();
  const [searchParams]  = useSearchParams();
  const { user }        = useAuth();
  const navigate        = useNavigate();
  const slug = companySlug || user?.company?.slug;
  const preService = searchParams.get('service') || '';

  const [form, setForm] = useState({
    title: '', description: '', category: preService,
    priority: 'medium', contactEmail: '', contactPhone: '', tags: '',
  });
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr]           = useState('');
  const [errors, setErrors]     = useState({});
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  useEffect(() => {
    serviceAPI.getPublic(slug)
      .then(r => {
        setServices(r.data.data || []);
        setCategories(r.data.company?.settings?.ticketCategories || []);
      })
      .catch(() => {});
  }, [slug]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErr(''); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const newErrors = {};
    if (!form.title?.trim()) newErrors.title = 'Title is required';
    if (!form.description?.trim()) newErrors.description = 'Description is required';
    if (!form.category?.trim()) newErrors.category = 'Category is required';
    if (form.contactEmail && !/\S+@\S+\.\S+/.test(form.contactEmail)) newErrors.contactEmail = 'Invalid email format';
    if (form.contactPhone && !/^[0-9]{10}$/.test(form.contactPhone.replace(/\D/g, ''))) newErrors.contactPhone = 'Please enter a valid 10-digit Indian phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileAdd = e => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 5) { toast.error('Maximum 5 attachments'); return; }
    setFiles(p => [...p, ...newFiles]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      files.forEach(f => fd.append('attachments', f));
      const res = await ticketAPI.createTicket(slug, fd);
      toast.success(`✅ Ticket ${res.data.data.ticketNumber} created!`);
      const base = user?.role === 'user' ? `/${slug}/my` : user?.role === 'agent' ? `/${slug}/agent` : `/${slug}`;
      navigate(`${base}/tickets/${res.data.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create ticket.';
      const code = err.response?.data?.code;
      if (code === 'TICKET_LIMIT_EXCEEDED') {
        setErr(`Monthly ticket limit reached. Please contact your admin to upgrade the plan.`);
      } else {
        setErr(msg);
      }
    } finally { setLoading(false); }
  };

  const backPath = user?.role === 'user' ? `/${slug}/my/tickets`
    : user?.role === 'agent' ? `/${slug}/agent/tickets`
    : `/${slug}/tickets`;

  const allCategories = [...new Set([...categories, ...services.map(s => s.name)])];

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to={backPath} className="btn btn-ghost btn-sm" style={{ marginBottom: 16, padding: '6px 0', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14}/> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={28} style={{ color: '#1a6fa8' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, margin: 0, fontFamily: 'var(--font-h)' }}>Create Support Ticket</h1>
            <p style={{ fontSize: 14, margin: 0, color: 'var(--muted)', marginTop: 4 }}>Describe your issue and our team will respond promptly</p>
          </div>
        </div>
      </div>

      {err && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: 'rgba(239,68,68,.08)', border: '1.5px solid rgba(239,68,68,.25)', borderRadius: 12, marginBottom: 20, fontSize: 14, color: '#dc2626' }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }}/> {err}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Service quick-select */}
        {services.length > 0 && (
          <div className="card" style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={20} style={{ color: '#1a6fa8' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text)' }}>Select Service</h3>
                <p style={{ fontSize: 12, margin: 0, color: 'var(--muted)', marginTop: 2 }}>Choose a service for your ticket</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {services.map(s => (
                <button key={s._id} type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: form.category === s.name ? '2px solid #1a6fa8' : '1px solid var(--border)',
                    background: form.category === s.name ? 'rgba(26,111,168,0.08)' : 'var(--surface)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => set('category', s.name)}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span> {s.name}
                </button>
              ))}
              <button type="button" 
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: form.category === '' && services.length > 0 ? '2px solid #1a6fa8' : '1px solid var(--border)',
                  background: form.category === '' && services.length > 0 ? 'rgba(26,111,168,0.08)' : 'var(--surface)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onClick={() => set('category', '')}>
                Other
              </button>
            </div>
          </div>
        )}

        {/* Main form */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} style={{ color: '#1a6fa8' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text)' }}>Issue Details</h3>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--muted)', marginTop: 2 }}>Provide details about your issue</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Title *</label>
              <input 
                value={form.title} 
                onChange={e => set('title', e.target.value)} 
                placeholder="Brief summary of your issue (e.g. AC not cooling)" 
                autoFocus 
                maxLength={120}
                style={{ padding: '12px 16px', borderRadius: 10, border: errors.title ? '2px solid #ef4444' : '1px solid var(--border)', boxShadow: errors.title ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none', fontSize: 14 }}
              />
              {errors.title && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.title}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Description *</label>
              <textarea 
                rows={5} 
                value={form.description} 
                onChange={e => set('description', e.target.value)}
                placeholder="Describe your issue in detail. Include:&#10;• What happened?&#10;• When did it start?&#10;• What have you tried?"
                style={{ padding: '12px 16px', borderRadius: 10, border: errors.description ? '2px solid #ef4444' : '1px solid var(--border)', boxShadow: errors.description ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none', fontSize: 14, resize: 'vertical' }}
              />
              {errors.description && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.description}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Category *</label>
                {allCategories.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    <button 
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--surface)',
                        border: errors.category ? '2px solid #ef4444' : '1px solid var(--border)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        boxShadow: errors.category ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
                      }}
                    >
                      <span>{form.category || '— Select category —'}</span>
                    </button>
                    {categoryDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        marginTop: 4,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        maxHeight: 200,
                        overflowY: 'auto'
                      }}>
                        <button
                          type="button"
                          onClick={() => { set('category', ''); setCategoryDropdownOpen(false); }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 14,
                            color: 'var(--muted)'
                          }}
                        >
                          — Select category —
                        </button>
                        {allCategories.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { set('category', c); setCategoryDropdownOpen(false); }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              border: 'none',
                              background: form.category === c ? 'rgba(26,111,168,0.08)' : 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 14
                            }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input 
                    value={form.category} 
                    onChange={e => set('category', e.target.value)} 
                    placeholder="e.g. Technical Issue, Billing…"
                    style={{ padding: '12px 16px', borderRadius: 10, border: errors.category ? '2px solid #ef4444' : '1px solid var(--border)', boxShadow: errors.category ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none', fontSize: 14 }}
                  />
                )}
                {errors.category && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.category}</div>}
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Priority</label>
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button"
                    onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    <span>{PRIORITIES.find(p => p.value === form.priority)?.label || 'Select priority'}</span>
                  </button>
                  {priorityDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      marginTop: 4,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10
                    }}>
                      {PRIORITIES.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => { set('priority', p.value); setPriorityDropdownOpen(false); }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            border: 'none',
                            background: form.priority === p.value ? 'rgba(26,111,168,0.08)' : 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 14
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Tags (optional, comma-separated)</label>
              <input 
                value={form.tags} 
                onChange={e => set('tags', e.target.value)} 
                placeholder="billing, account, urgent"
                style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} style={{ color: '#1a6fa8' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text)' }}>
                Contact Info <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 13 }}>(optional)</span>
              </h3>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--muted)', marginTop: 2 }}>Alternate contact details</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Alternate Email</label>
              <input 
                type="email" 
                value={form.contactEmail} 
                onChange={e => set('contactEmail', e.target.value)} 
                placeholder="other@email.com"
                style={{ padding: '12px 16px', borderRadius: 10, border: errors.contactEmail ? '2px solid #ef4444' : '1px solid var(--border)', boxShadow: errors.contactEmail ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none', fontSize: 14 }}
              />
              {errors.contactEmail && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.contactEmail}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>Phone Number</label>
              <input 
                type="tel"
                value={form.contactPhone} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  set('contactPhone', val);
                }}
                placeholder="9876543210"
                maxLength={10}
                style={{ padding: '12px 16px', borderRadius: 10, border: errors.contactPhone ? '2px solid #ef4444' : '1px solid var(--border)', boxShadow: errors.contactPhone ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none', fontSize: 14 }}
              />
              {errors.contactPhone && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.contactPhone}</div>}
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} style={{ color: '#1a6fa8' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text)' }}>
                Attachments <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 13 }}>({files.length}/5)</span>
              </h3>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--muted)', marginTop: 2 }}>Upload files related to your issue</p>
            </div>
          </div>
          <label 
            style={{ 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '12px 20px', 
              borderRadius: 10, 
              border: '1px solid var(--border)', 
              background: 'var(--surface)',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: files.length > 0 ? 12 : 0,
              transition: 'all 0.2s ease'
            }}
          >
            <Paperclip size={16}/> Attach Files
            <input type="file" multiple hidden onChange={handleFileAdd} accept="image/*,.pdf,.doc,.docx,.xlsx,.txt"/>
          </label>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--surface2)', borderRadius: 10, fontSize: 13, marginTop: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} style={{ color: '#1a6fa8' }} />
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{f.name}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12, flexShrink: 0 }}>{(f.size/1024).toFixed(0)} KB</span>
              <button type="button" style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setFiles(p => p.filter((_, x) => x !== i))}><X size={14}/></button>
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Supported: Images, PDF, Word, Excel — max 10MB each</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={backPath} className="btn btn-secondary" style={{ padding: '12px 24px', borderRadius: 10 }}>Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: '12px 24px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Spinner size={16}/> Submitting…</> : <><CheckCircle2 size={16}/> Submit Ticket</>}
          </button>
        </div>
      </form>
    </div>
  );
}
