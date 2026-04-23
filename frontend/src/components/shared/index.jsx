import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertTriangle, Search, Building2, Pencil, Zap, CreditCard, ChevronDown, Sun, Moon, Wrench, WrenchIcon, Phone, Shield, Car, Home, Target, Package, Settings, Key, MessageSquare, ShieldAlert, Plane, Stethoscope, Plug, Snowflake, Droplets, Flame, Lightbulb, Monitor, Smartphone, Briefcase, Database, Server, Globe, MapPin, Clock, Calendar, User, Users, FileText, Image, Video, Music, Headphones, Camera, Mic, Wifi, Bluetooth, Battery, Signal, Navigation, Compass, Map, Layers, Grid, List, Layout, Columns, Square, Circle, Triangle, Star, Heart, Bookmark, Share2, Copy, Download, Upload, Send, Paperclip, Link, ExternalLink, Check, CheckCircle2, XCircle, AlertCircle, Info, HelpCircle, Bell, BellOff, Lock, Unlock, Eye, EyeOff, Edit, Trash2, Plus, Minus, ChevronLeft, ChevronRight, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, RotateCw, MoreHorizontal, MoreVertical, Menu, XCircle as Cross, UserCheck, UserCog, Ticket, TrendingDown } from 'lucide-react';
import { subscriptionAPI, authAPI, platformAPI, serviceAPI, companyAPI, ticketAPI } from '../../api';
import toast from 'react-hot-toast';

const fmtINR = (paise) => paise ? `₹${(paise/100).toLocaleString('en-IN')}` : '₹0';

// ── Plan Context ───────────────────────────────────────────
const PlanContext = createContext(null);
export const usePlan = () => useContext(PlanContext);
export const PlanProvider = ({ children }) => {
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [onSave, setOnSave] = useState(() => () => {});

  return (
    <PlanContext.Provider value={{ planDrawerOpen, setPlanDrawerOpen, plan, setPlan, onSave, setOnSave }}>
      {children}
    </PlanContext.Provider>
  );
};

// ── Add Company Context ────────────────────────────────────
const AddCompanyContext = createContext(null);
export const useAddCompany = () => useContext(AddCompanyContext);
export const AddCompanyProvider = ({ children }) => {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    companyName:'', companyEmail:'', companyPhone:'', companyAddress:'',
    adminName:'', adminEmail:'', adminPassword:'', subscriptionPlanId:'',
  });
  const [addSaving, setAddSaving] = useState(false);

  return (
    <AddCompanyContext.Provider value={{ addDrawerOpen, setAddDrawerOpen, addForm, setAddForm, addSaving, setAddSaving }}>
      {children}
    </AddCompanyContext.Provider>
  );
};

// ── Edit Company Context ────────────────────────────────────
const EditCompanyContext = createContext(null);
export const useEditCompany = () => useContext(EditCompanyContext);
export const EditCompanyProvider = ({ children }) => {
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [onSave, setOnSave] = useState(() => () => {});

  return (
    <EditCompanyContext.Provider value={{ editDrawerOpen, setEditDrawerOpen, editCompany, setEditCompany, onSave, setOnSave }}>
      {children}
    </EditCompanyContext.Provider>
  );
};

// ── Feature Override Context ───────────────────────────────
const FeatureOverrideContext = createContext(null);
export const useFeatureOverride = () => useContext(FeatureOverrideContext);
export const FeatureOverrideProvider = ({ children }) => {
  const [featureDrawerOpen, setFeatureDrawerOpen] = useState(false);
  const [featureCompany, setFeatureCompany] = useState(null);
  const [onSave, setOnSave] = useState(() => () => {});

  return (
    <FeatureOverrideContext.Provider value={{ featureDrawerOpen, setFeatureDrawerOpen, featureCompany, setFeatureCompany, onSave, setOnSave }}>
      {children}
    </FeatureOverrideContext.Provider>
  );
};

// ── Service Context ───────────────────────────────────────
const ServiceContext = createContext(null);
export const useService = () => useContext(ServiceContext);
export const ServiceProvider = ({ children }) => {
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [service, setService] = useState(null);
  const [onSave, setOnSave] = useState(() => () => {});
  const [slug, setSlug] = useState('');

  return (
    <ServiceContext.Provider value={{ serviceDrawerOpen, setServiceDrawerOpen, service, setService, onSave, setOnSave, slug, setSlug }}>
      {children}
    </ServiceContext.Provider>
  );
};

// ── Staff Context ───────────────────────────────────────
const StaffContext = createContext(null);
export const useStaff = () => useContext(StaffContext);
export const StaffProvider = ({ children }) => {
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [staff, setStaff] = useState(null);
  const [onSave, setOnSave] = useState(() => () => {});
  const [slug, setSlug] = useState('');

  return (
    <StaffContext.Provider value={{ staffDrawerOpen, setStaffDrawerOpen, staff, setStaff, onSave, setOnSave, slug, setSlug }}>
      {children}
    </StaffContext.Provider>
  );
};

// ── Ticket Context ───────────────────────────────────────
const TicketContext = createContext(null);
export const useTicket = () => useContext(TicketContext);
export const TicketProvider = ({ children }) => {
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [onSave, setOnSave] = useState(() => () => {});
  const [slug, setSlug] = useState('');

  return (
    <TicketContext.Provider value={{ ticketDrawerOpen, setTicketDrawerOpen, onSave, setOnSave, slug, setSlug }}>
      {children}
    </TicketContext.Provider>
  );
};

// ── Spinner ───────────────────────────────────────────────
export const Spinner = ({ size=18, color }) => (
  <Loader2 size={size} className="spinner" style={{ color:color||'var(--primary)', flexShrink:0 }}/>
);

// ── Avatar ────────────────────────────────────────────────
const AV_COLORS = ['#1a6fa8','#059669','#dc2626','#d97706','#7c3aed','#db2777','#0284c7','#065f46'];
export const Avatar = ({ name='?', src, size=34 }) => {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const bg = AV_COLORS[(name?.charCodeAt(0)||0)%AV_COLORS.length];
  if (src) return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0 }}/>;
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:700,fontSize:size*.36,color:'#fff',flexShrink:0,letterSpacing:'.02em' }}>
      {initials}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────
const STATUS_DOT = { open:'#3b82f6',assigned:'#7c3aed',in_progress:'#d97706',resolved:'#10b981',closed:'#6b7280',reopened:'#ef4444' };
export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>
    {STATUS_DOT[status] && <span style={{ width:6,height:6,borderRadius:'50%',background:STATUS_DOT[status],flexShrink:0 }}/>}
    {status?.replace(/_/g,' ')}
  </span>
);

// ── Priority Badge ────────────────────────────────────────
const P_ICONS = { low:'↓', medium:'●', high:'↑', critical:'⚡' };
export const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{P_ICONS[priority]} {priority}</span>
);

// ── Role Badge ────────────────────────────────────────────
const ROLE_STYLES = {
  platform_owner:      { bg:'rgba(217,119,6,.1)',  c:'#d97706', l:'Platform Owner' },
  company_super_admin: { bg:'rgba(220,38,38,.1)',  c:'#dc2626', l:'Super Admin' },
  company_admin:       { bg:'rgba(124,58,237,.1)', c:'#7c3aed', l:'Admin' },
  employee:            { bg:'rgba(37,99,235,.1)',  c:'#2563eb', l:'Employee' },
  agent:               { bg:'rgba(5,150,105,.1)',  c:'#059669', l:'Agent' },
  user:                { bg:'rgba(107,114,128,.1)','c':'#6b7280', l:'Customer' },
};
export const RoleBadge = ({ role }) => {
  const r = ROLE_STYLES[role] || ROLE_STYLES.user;
  return <span className="badge" style={{ background:r.bg, color:r.c }}>{r.l}</span>;
};

// ── Modal ─────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width=520, footer }) => {
  if (!open) return null;
  return createPortal(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', padding:20 }}>
      <div className="modal" style={{ maxWidth:width, maxHeight:'90vh', overflowY:'auto', borderRadius:12, background:'var(--surface)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div className="modal-header" style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text)', margin:0 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color:'var(--muted)', borderRadius:'50%', padding:8 }}>
            <X size={18}/>
          </button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
        {footer && <div className="modal-footer" style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

// ── Confirm Dialog ────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel='Confirm', danger=false }) => (
  <Modal open={open} onClose={onClose} title={title||'Confirm'} width={420}>
    <div style={{ display:'flex', gap:12, marginBottom:4 }}>
      <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink:0, marginTop:2 }}/>
      <p style={{ color:'var(--muted)', fontSize:13.5, lineHeight:1.6 }}>{message}</p>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
      <button className={`btn ${danger?'btn-danger':'btn-primary'} btn-sm`} onClick={()=>{onConfirm();onClose();}}>
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

// ── Empty State ───────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop:16 }}>{action}</div>}
  </div>
);

// ── Pagination ────────────────────────────────────────────
export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination||pagination.pages<=1) return null;
  const { page, pages, total } = pagination;
  const range=[];
  for(let i=Math.max(1,page-2);i<=Math.min(pages,page+2);i++) range.push(i);
  const pBtnStyle = (active) => ({
    minWidth:32, height:30, display:'inline-flex', alignItems:'center', justifyContent:'center',
    borderRadius:6, border: active ? 'none' : '1px solid var(--border)',
    background: active ? '#1a6fa8' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text)',
    fontSize:13, fontWeight: active ? 700 : 500, cursor:'pointer', padding:'0 8px',
    transition:'all 0.15s ease',
  });
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--surface)', flexWrap:'wrap', gap:8 }}>
      <span style={{ fontSize:12.5, color:'var(--muted)' }}>{total} total record{total!==1?'s':''}</span>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <button className="btn btn-secondary btn-sm" disabled={page<=1} onClick={()=>onPageChange(page-1)} style={{minWidth:32}}>←</button>
        {range[0]>1&&<><button style={pBtnStyle(false)} onClick={()=>onPageChange(1)}>1</button><span style={{color:'var(--muted)',padding:'0 2px'}}>…</span></>}
        {range.map(p=><button key={p} style={pBtnStyle(p===page)} onClick={()=>onPageChange(p)}>{p}</button>)}
        {range[range.length-1]<pages&&<><span style={{color:'var(--muted)',padding:'0 2px'}}>…</span><button style={pBtnStyle(false)} onClick={()=>onPageChange(pages)}>{pages}</button></>}
        <button className="btn btn-secondary btn-sm" disabled={page>=pages} onClick={()=>onPageChange(page+1)} style={{minWidth:32}}>→</button>
      </div>
    </div>
  );
};

// ── Search Input ──────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder='Search…', style={} }) => (
  <div className="search-wrap" style={style}>
    <Search size={14} className="s-icon"/>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
  </div>
);

// ── Stat Card ─────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color='var(--primary)', sub }) => (
  <div className="stat-card">
    <div className="stat-card-inner">
      <div style={{ flex:1, minWidth:0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value??'—'}</div>
        {sub&&<div className="stat-sub">{sub}</div>}
      </div>
      {icon&&<div className="stat-icon" style={{ background:`${color}18`, color }}>{icon}</div>}
    </div>
  </div>
);

// ── Info Row ──────────────────────────────────────────────
export const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value??'—'}</span>
  </div>
);

// ── Tabs ──────────────────────────────────────────────────
export const Tabs = ({ tabs=[], active, onChange }) => (
  <div className="tabs">
    {tabs.map(t=>(
      <button key={t.value} className={`tab-btn ${active===t.value?'active':''}`} onClick={()=>onChange(t.value)}>
        {t.label}
        {t.count!==undefined&&<span className="tab-count">{t.count}</span>}
      </button>
    ))}
  </div>
);

// ── Select ────────────────────────────────────────────────
export const Select = ({ value, onChange, options=[], placeholder='Select…', style={}, className='' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => (o.value ?? o) === value);

  const filteredOptions = options.filter(o => {
    const label = o.label ?? o;
    const searchLower = searchTerm.toLowerCase();
    return label.toLowerCase().includes(searchLower);
  });

  return (
    <div ref={selectRef} className={`custom-select ${className}`} style={{ position:'relative', ...style }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          padding:'8px 12px',
          borderRadius:6,
          border:'1px solid var(--border)',
          background:'var(--surface)',
          color:'var(--text)',
          cursor:'pointer',
          minHeight:38,
          minWidth:160
        }}
      >
        <span style={{ fontSize:13 }}>{selectedOption ? (selectedOption.label ?? selectedOption) : placeholder}</span>
        <ChevronDown size={16} style={{ color:'var(--muted)', flexShrink:0 }}/>
      </div>
      {isOpen && (
        <div style={{
          position:'absolute',
          top:'100%',
          left:0,
          right:0,
          marginTop:4,
          background:'var(--surface)',
          border:'1px solid var(--border)',
          borderRadius:6,
          boxShadow:'var(--shadow)',
          zIndex:100,
          maxHeight:240,
          overflowY:'auto'
        }}>
          <div style={{ padding:8, borderBottom:'1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                width:'100%',
                padding:'6px 10px',
                borderRadius:4,
                border:'1px solid var(--border)',
                background:'var(--surface2)',
                color:'var(--text)',
                fontSize:12,
                outline:'none'
              }}
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div style={{ padding:12, fontSize:12, color:'var(--muted)', textAlign:'center' }}>No options found</div>
          ) : (
            filteredOptions.map((o, i) => {
              const optValue = o.value ?? o;
              const optLabel = o.label ?? o;
              const isSelected = optValue === value;
              return (
                <div
                  key={i}
                  onClick={() => { onChange(optValue); setIsOpen(false); setSearchTerm(''); }}
                  style={{
                    padding:'8px 12px',
                    fontSize:13,
                    cursor:'pointer',
                    background:isSelected ? 'var(--primary-l)' : 'transparent',
                    color:isSelected ? 'var(--primary)' : 'var(--text)',
                    transition:'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'var(--primary-l)' : 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'var(--primary-l)' : 'transparent'}
                >
                  {optLabel}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ── Star Display ──────────────────────────────────────────
export const StarDisplay = ({ score, size=14 }) => (
  <span style={{ display:'inline-flex', gap:1 }}>
    {[1,2,3,4,5].map(i=>(
      <span key={i} style={{ fontSize:size, color:i<=score?'var(--accent)':'var(--border)', lineHeight:1 }}>★</span>
    ))}
  </span>
);

// ── Star Input ────────────────────────────────────────────
export const StarInput = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-input">
      {[1,2,3,4,5].map(i=>(
        <button key={i} type="button" className="star-btn"
          style={{ color:i<=(hover||value)?'var(--accent)':'var(--border)' }}
          onClick={()=>onChange(i)} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}>
          ★
        </button>
      ))}
    </div>
  );
};

// ── ThemeToggle ───────────────────────────────────────────
import { useTheme } from '../../context/ThemeContext';
export const ThemeToggle = ({ className='' }) => {
  const { theme, toggle } = useTheme();
  return (
    <button 
      onClick={toggle} 
      className={className} 
      title={`${theme==='dark'?'Light':'Dark'} mode`} 
      style={{
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        width:38,
        height:38,
        borderRadius:10,
        background:'var(--surface)',
        border:'1px solid var(--border)',
        cursor:'pointer',
        color:'var(--text)',
        transition:'all 0.2s ease',
        boxShadow:'0 1px 2px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,111,168,0.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';}}
    >
      {theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}
    </button>
  );
};

// ── Drawer/Off-canvas ────────────────────────────────────
export const Drawer = ({ open, onClose, children, width=500, position='right' }) => {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(2px)',zIndex:199 }}/>
      <div style={{
        position:'fixed',top:0,bottom:0,right:position==='right'?0:'auto',left:position==='right'?'auto':0,width:width,
        background:'var(--surface)',boxShadow:position==='right'?'-4px 0 24px rgba(0,0,0,0.15)':'4px 0 24px rgba(0,0,0,0.15)',
        zIndex:200,overflowY:'auto',padding:0
      }}>
        {children}
      </div>
    </>
  );
};

// ── Add Company Drawer ────────────────────────────────────
export const AddCompanyDrawer = () => {
  const { addDrawerOpen, setAddDrawerOpen, addForm, setAddForm, addSaving, setAddSaving } = useAddCompany();
  const [plans, setPlans] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    subscriptionAPI.getPlans().then(r=>setPlans(r.data.data||[])).catch(()=>{});
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!addForm.companyName?.trim()) newErrors.companyName = 'Company name is required';
    if (!addForm.companyEmail?.trim()) newErrors.companyEmail = 'Company email is required';
    else if (!/\S+@\S+\.\S+/.test(addForm.companyEmail)) newErrors.companyEmail = 'Invalid email format';
    if (addForm.companyPhone && !/^\d{10}$/.test(addForm.companyPhone)) newErrors.companyPhone = 'Phone must be 10 digits';
    if (!addForm.adminName?.trim()) newErrors.adminName = 'Admin name is required';
    if (!addForm.adminEmail?.trim()) newErrors.adminEmail = 'Admin email is required';
    else if (!/\S+@\S+\.\S+/.test(addForm.adminEmail)) newErrors.adminEmail = 'Invalid email format';
    if (!addForm.adminPassword?.trim()) newErrors.adminPassword = 'Password is required';
    else if (addForm.adminPassword.length < 6) newErrors.adminPassword = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCompany = async () => {
    if (!validateForm()) return;
    setAddSaving(true);
    try {
      await authAPI.registerCompany(addForm);
      toast.success('Company registered! Approve it in the Companies list.');
      setAddDrawerOpen(false);
      setAddForm({
        companyName:'', companyEmail:'', companyPhone:'', companyAddress:'',
        adminName:'', adminEmail:'', adminPassword:'', subscriptionPlanId:'',
      });
      setErrors({});
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setAddSaving(false); }
  };

  const setAdd = (k,v) => {
    setAddForm(p=>({...p,[k]:v}));
    if (errors[k]) setErrors(e=>({...e,[k]:''}));
  };

  if (!addDrawerOpen) return null;

  const drawerWidth = window.innerWidth < 768 ? 300 : window.innerWidth < 1024 ? 480 : 520;
  const isMobile = window.innerWidth < 768;

  return (
    <Drawer open={addDrawerOpen} onClose={()=>setAddDrawerOpen(false)} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <Building2 size={22}/>
            </div>
            <div><h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>Add New Company</h2><p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Register a company on behalf of a client</p></div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={()=>setAddDrawerOpen(false)} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={e=>{e.preventDefault();handleAddCompany();}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>Company Details</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input value={addForm.companyName} onChange={e=>setAdd('companyName',e.target.value)} placeholder="Acme Corp" style={{ padding:'10px 14px', borderColor:errors.companyName?'#ef4444':undefined, boxShadow:errors.companyName?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                {errors.companyName && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.companyName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Company Email *</label>
                <input type="email" value={addForm.companyEmail} onChange={e=>setAdd('companyEmail',e.target.value)} placeholder="info@acme.com" style={{ padding:'10px 14px', borderColor:errors.companyEmail?'#ef4444':undefined, boxShadow:errors.companyEmail?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                {errors.companyEmail && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.companyEmail}</div>}
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input value={addForm.companyPhone} onChange={e=>{const val=e.target.value.replace(/\D/g,'').slice(0,10);setAdd('companyPhone',val);}} placeholder="9876543210" maxLength={10} style={{ padding:'10px 14px', borderColor:errors.companyPhone?'#ef4444':undefined, boxShadow:errors.companyPhone?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                  {errors.companyPhone && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.companyPhone}</div>}
                </div>
                <div className="form-group"><label className="form-label">Address</label><input value={addForm.companyAddress} onChange={e=>setAdd('companyAddress',e.target.value)} placeholder="City, Country" style={{ padding:'10px 14px' }}/></div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>Admin Account</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
                <div className="form-group">
                  <label className="form-label">Admin Name *</label>
                  <input value={addForm.adminName} onChange={e=>setAdd('adminName',e.target.value)} placeholder="Jane Smith" style={{ padding:'10px 14px', borderColor:errors.adminName?'#ef4444':undefined, boxShadow:errors.adminName?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                  {errors.adminName && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.adminName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Email *</label>
                  <input type="email" value={addForm.adminEmail} onChange={e=>setAdd('adminEmail',e.target.value)} placeholder="jane@acme.com" style={{ padding:'10px 14px', borderColor:errors.adminEmail?'#ef4444':undefined, boxShadow:errors.adminEmail?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                  {errors.adminEmail && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.adminEmail}</div>}
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: isMobile ? '100%' : 300 }}>
                <label className="form-label">Password *</label>
                <input type="password" value={addForm.adminPassword} onChange={e=>setAdd('adminPassword',e.target.value)} placeholder="Min 6 characters" style={{ padding:'10px 14px', borderColor:errors.adminPassword?'#ef4444':undefined, boxShadow:errors.adminPassword?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                {errors.adminPassword && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.adminPassword}</div>}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>Subscription Plan</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {plans.map(plan => (
                <label key={plan._id} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:10, border:`1.5px solid ${addForm.subscriptionPlanId===plan._id?'#1a6fa8':'var(--border)'}`, cursor:'pointer', background:addForm.subscriptionPlanId===plan._id?'rgba(26,111,168,0.05)':undefined, transition:'all 0.2s ease' }}>
                  <input type="radio" name="plan" value={plan._id} checked={addForm.subscriptionPlanId===plan._id} onChange={e=>setAdd('subscriptionPlanId',e.target.value)} style={{marginTop:2,width:'auto',accentColor:'#1a6fa8'}}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{plan.name} — ₹{plan.price?.monthly}/mo</div>
                    <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{(plan.features_display||[]).slice(0,2).join(' · ')}</div>
                  </div>
                  {plan.isPopular && <span style={{fontSize:11,color:'#1a6fa8',fontWeight:700,background:'rgba(26,111,168,0.1)',padding:'4px 10px',borderRadius:20}}>Popular</span>}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:12, paddingTop:8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setAddDrawerOpen(false)} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={addSaving} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>
              {addSaving?<><Spinner size={14}/> Registering…</>:'Register Company'}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

// ─── Loading Page ──────────────────────────────────────────
export const LoadingPage = ({ text='Loading…' }) => (
  <div className="loading-page">
    <div style={{ width:40, height:40, borderRadius:10, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(26,111,168,.35)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    </div>
    <span style={{ color:'var(--muted)', fontSize:13.5 }}>{text}</span>
  </div>
);

// ─── Edit Company Drawer ───────────────────────────────────
export const EditCompanyDrawer = ({ open, onClose, company, onSave }) => {
  const [form, setForm] = useState({});
  const [plans, setPlans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (open && company) {
      setForm({
        name: company.name,
        phone: company.phone || '',
        address: company.address || '',
        website: company.website || '',
        description: company.description || '',
        subscriptionPlanId: company.subscriptionPlan?._id || '',
        subscriptionStatus: company.subscriptionStatus || 'trial',
      });
      subscriptionAPI.getPlans().then(r=>setPlans(r.data.data||[])).catch(()=>{});
    }
  }, [open, company]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = 'Company name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await platformAPI.updateCompany(company._id, form);
      toast.success('Company updated');
      onClose();
      onSave();
    } catch (e) { toast.error(e.response?.data?.message || 'Error updating company'); }
    finally { setSaving(false); }
  };

  const setField = (k,v) => {
    setForm(p=>({...p,[k]:v}));
    if (errors[k]) setErrors(e=>({...e,[k]:''}));
  };

  if (!open) return null;

  const drawerWidth = isMobile ? 300 : window.innerWidth < 1024 ? 480 : 520;

  return (
    <Drawer open={open} onClose={onClose} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <Pencil size={22}/>
            </div>
            <div><h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>Edit Company</h2><p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{company?.name}</p></div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={e=>{e.preventDefault();handleSave();}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>Basic Info</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input value={form.name||''} onChange={e=>setField('name',e.target.value)} style={{ padding:'10px 14px', borderColor:errors.name?'#ef4444':undefined, boxShadow:errors.name?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                {errors.name && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.name}</div>}
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
                <div className="form-group"><label className="form-label">Phone</label><input value={form.phone||''} onChange={e=>setField('phone',e.target.value)} style={{ padding:'10px 14px' }}/></div>
                <div className="form-group"><label className="form-label">Website</label><input value={form.website||''} onChange={e=>setField('website',e.target.value)} style={{ padding:'10px 14px' }}/></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input value={form.address||''} onChange={e=>setField('address',e.target.value)} style={{ padding:'10px 14px' }}/></div>
              <div className="form-group"><label className="form-label">Description</label><textarea rows={2} value={form.description||''} onChange={e=>setField('description',e.target.value)} style={{ padding:'10px 14px' }}/></div>
            </div>
          </div>

          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>Subscription</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
                <div className="form-group">
                  <label className="form-label">Subscription Plan</label>
                  <select value={form.subscriptionPlanId||''} onChange={e=>setField('subscriptionPlanId',e.target.value)} style={{ padding:'10px 14px' }}>
                    <option value="">— No Plan —</option>
                    {plans.map(p=><option key={p._id} value={p._id}>{p.name} ({fmtINR(p.price?.monthly)}/mo)</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subscription Status</label>
                  <select value={form.subscriptionStatus||'trial'} onChange={e=>setField('subscriptionStatus',e.target.value)} style={{ padding:'10px 14px' }}>
                    {['trial','active','expired','cancelled','past_due'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, paddingTop:8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>
              {saving?<><Spinner size={14}/> Saving…</>:'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

// ─── Feature Override Drawer ───────────────────────────────
export const FeatureOverrideDrawer = ({ open, onClose, company, onSave }) => {
  const [featureLoading, setFeatureLoading] = useState('');
  const isMobile = window.innerWidth < 768;

  const ALL_FEATURES = [
    'advanced_analytics','custom_logo','custom_colors','custom_subdomain',
    'white_labeling','api_access','sla_management','ticket_export','priority_support',
  ];

  const handleFeatureOverride = async (feature, enabled) => {
    setFeatureLoading(feature);
    try {
      const { paymentAPI } = await import('../../api');
      await paymentAPI.overrideFeature({ companyId: company._id, feature, enabled });
      toast.success(`${feature.replace(/_/g,' ')} ${enabled?'enabled':'disabled'}`);
      onSave();
    } catch { toast.error('Error updating feature'); }
    finally { setFeatureLoading(''); }
  };

  if (!open) return null;

  const drawerWidth = isMobile ? 300 : window.innerWidth < 1024 ? 480 : 520;

  return (
    <Drawer open={open} onClose={onClose} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <Zap size={22}/>
            </div>
            <div><h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>Feature Overrides</h2><p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{company?.name}</p></div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20, lineHeight:1.6 }}>
          Grant or revoke individual features for this company, independent of their subscription plan.
          Overrides take effect immediately.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ALL_FEATURES.map(f=>{
            const planHas  = company?.subscriptionPlan?.features?.[f]||false;
            const override = company?.featureOverrides?.[f];
            const isEnabled = override !== undefined ? override : planHas;
            return (
              <label key={f} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:'var(--surface2)', border:`1.5px solid ${isEnabled?'rgba(16,185,129,.2)':'var(--border)'}`, cursor:'pointer', transition:'all 0.2s ease' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{f.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{planHas?'Included in plan':'Not in plan'}{override!==undefined?' · Overridden':''}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {featureLoading===f&&<Spinner size={14}/>}
                  <input type="checkbox" checked={isEnabled} style={{ width:'auto', accentColor:'#10b981' }}
                    onChange={e=>handleFeatureOverride(f, e.target.checked)}/>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop:24 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>Close</button>
        </div>
      </div>
    </Drawer>
  );
};

// ─── Plan Drawer ─────────────────────────────────────────
const EMPTY_PLAN = {
  name:'', slug:'', description:'', tagline:'',
  price:{ monthly:83000, yearly:830000, currency:'INR' },
  limits:{ max_agents:5, max_admins:2, max_employees:10, max_tickets_per_month:500, storage_limit_gb:1, max_services:10 },
  features:{ email_support:true, priority_support:false, advanced_analytics:false, custom_logo:false, custom_colors:false, custom_subdomain:false, white_labeling:false, api_access:false, agent_performance_report:false, ticket_export:false, sla_management:false, multi_language:false },
  features_display:[],
  isActive:true, isPopular:false, sortOrder:0,
};

const ALL_PLAN_FEATURES = [
  { k:'email_support',            l:'Email Support' },
  { k:'priority_support',         l:'Priority Support' },
  { k:'advanced_analytics',       l:'Advanced Analytics' },
  { k:'custom_logo',              l:'Custom Logo' },
  { k:'custom_colors',            l:'Custom Brand Colors' },
  { k:'custom_subdomain',         l:'Custom Subdomain' },
  { k:'white_labeling',           l:'White Labeling' },
  { k:'api_access',               l:'API Access' },
  { k:'agent_performance_report', l:'Agent Performance Reports' },
  { k:'ticket_export',            l:'Ticket Export (CSV)' },
  { k:'sla_management',           l:'SLA Management' },
  { k:'multi_language',           l:'Multi-Language' },
];

export const PlanDrawer = ({ open, onClose, plan, onSave }) => {
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [featInput, setFeatInput] = useState('');
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (open && plan) {
      setForm({ ...plan, features:{...plan.features}, price:{...plan.price}, limits:{...plan.limits}, features_display:[...(plan.features_display||[])] });
    } else if (open && !plan) {
      setForm({...EMPTY_PLAN, features:{...EMPTY_PLAN.features}, price:{...EMPTY_PLAN.price}, limits:{...EMPTY_PLAN.limits}, features_display:[]});
    }
  }, [open, plan]);

  const setF = (k,v) => setForm(p=>({...p,[k]:v}));
  const setPrice = (k,v) => setForm(p=>({...p,price:{...p.price,[k]:parseInt(v)*100||0}}));
  const setLimit = (k,v) => setForm(p=>({...p,limits:{...p.limits,[k]:parseInt(v)||0}}));
  const setFeature = (k,v) => setForm(p=>({...p,features:{...p.features,[k]:v}}));
  const addFeatDisp = () => { if (!featInput.trim()) return; setForm(p=>({...p,features_display:[...p.features_display, featInput.trim()]})); setFeatInput(''); };
  const removeFeatDisp = i => setForm(p=>({...p,features_display:p.features_display.filter((_,x)=>x!==i)}));

  const handleSave = async () => {
    if (!form.name.trim()||!form.slug.trim()) { toast.error('Name and slug are required.'); return; }
    setSaving(true);
    try {
      if (plan) await platformAPI.updatePlan(plan._id, form);
      else            await platformAPI.createPlan(form);
      toast.success(plan?'Plan updated':'Plan created');
      onClose();
      onSave();
    } catch (err) { toast.error(err.response?.data?.message||'Error saving plan.'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const drawerWidth = isMobile ? 300 : window.innerWidth < 1024 ? 600 : 650;

  return (
    <Drawer open={open} onClose={onClose} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24, maxHeight:'100vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <CreditCard size={22}/>
            </div>
            <div><h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>{plan?'Edit Plan':'Create Plan'}</h2><p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{plan?.name||'New subscription plan'}</p></div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={e=>{e.preventDefault();handleSave();}} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
            <div className="form-group"><label className="form-label">Plan Name *</label><input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Starter" style={{ padding:'10px 14px' }}/></div>
            <div className="form-group"><label className="form-label">Slug *</label><input value={form.slug} onChange={e=>setF('slug',e.target.value.toLowerCase().replace(/\s+/g,'-'))} placeholder="starter" style={{ padding:'10px 14px' }}/></div>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
            <div className="form-group"><label className="form-label">Description</label><input value={form.description} onChange={e=>setF('description',e.target.value)} style={{ padding:'10px 14px' }}/></div>
            <div className="form-group"><label className="form-label">Tagline</label><input value={form.tagline||''} onChange={e=>setF('tagline',e.target.value)} placeholder="Perfect for small teams" style={{ padding:'10px 14px' }}/></div>
          </div>
          <div style={{ padding:'16px', background:'var(--surface2)', borderRadius:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Pricing (INR)</div>
            <div className="form-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : undefined }}>
              <div className="form-group"><label className="form-label">Monthly Price (₹)</label><input type="number" value={(form.price?.monthly||0)/100} onChange={e=>setPrice('monthly',e.target.value)} placeholder="83000" style={{ padding:'10px 14px' }}/></div>
              <div className="form-group"><label className="form-label">Yearly Price (₹)</label><input type="number" value={(form.price?.yearly||0)/100} onChange={e=>setPrice('yearly',e.target.value)} placeholder="830000" style={{ padding:'10px 14px' }}/></div>
            </div>
          </div>
          <div style={{ padding:'16px', background:'var(--surface2)', borderRadius:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Limits</div>
            <div className="form-grid-3" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
              <div className="form-group"><label className="form-label">Max Agents</label><input type="number" value={form.limits?.max_agents} onChange={e=>setLimit('max_agents',e.target.value)} style={{ padding:'10px 14px' }}/></div>
              <div className="form-group"><label className="form-label">Tickets/Month</label><input type="number" value={form.limits?.max_tickets_per_month} onChange={e=>setLimit('max_tickets_per_month',e.target.value)} style={{ padding:'10px 14px' }}/></div>
              <div className="form-group"><label className="form-label">Storage (GB)</label><input type="number" value={form.limits?.storage_limit_gb} onChange={e=>setLimit('storage_limit_gb',e.target.value)} style={{ padding:'10px 14px' }}/></div>
            </div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom:10, fontSize:13, fontWeight:600, color:'var(--text)' }}>Features</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
              {ALL_PLAN_FEATURES.map(f=>(
                <label key={f.k} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, cursor:'pointer', padding:'10px 14px', borderRadius:10, background:'var(--surface)', border:`1px solid ${form.features?.[f.k]?'#10b981':'var(--border)'}`, transition:'all 0.2s ease' }}>
                  <input type="checkbox" checked={!!form.features?.[f.k]} onChange={e=>setFeature(f.k,e.target.checked)} style={{ width:'auto', accentColor:'#10b981' }}/>
                  {f.l}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Feature Display List</label>
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <input value={featInput} onChange={e=>setFeatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addFeatDisp())} placeholder="e.g. 5 Agents" style={{ padding:'10px 14px' }}/>
              <button type="button" className="btn btn-secondary" onClick={addFeatDisp} style={{ flexShrink:0, padding:'10px 20px' }}>Add</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {form.features_display.map((f,i)=>(
                <span key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'6px 14px', background:'var(--primary-l)', color:'var(--primary)', borderRadius:20, fontWeight:500 }}>
                  {f}<button type="button" onClick={()=>removeFeatDisp(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', fontSize:16, lineHeight:1, padding:0, fontWeight:700 }}>×</button>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap', padding:'16px', background:'var(--surface2)', borderRadius:12 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, cursor:'pointer', fontWeight:500 }}>
              <input type="checkbox" checked={form.isPopular} onChange={e=>setF('isPopular',e.target.checked)} style={{ width:'auto', accentColor:'var(--primary)' }}/> Mark as Popular
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, cursor:'pointer', fontWeight:500 }}>
              <input type="checkbox" checked={form.isActive} onChange={e=>setF('isActive',e.target.checked)} style={{ width:'auto', accentColor:'#10b981' }}/> Active
            </label>
          </div>
          <div style={{ display:'flex', gap:12, paddingTop:8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, width: isMobile ? '100%' : 'auto' }}>
              {saving?<><Spinner size={14}/> Saving…</>:plan?'Update Plan':'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

// ─── Service Drawer ─────────────────────────────────────────
const SERVICE_ICONS = [
  { name: 'Wrench', icon: Wrench },
  { name: 'Plug', icon: Plug },
  { name: 'Snowflake', icon: Snowflake },
  { name: 'Droplets', icon: Droplets },
  { name: 'Flame', icon: Flame },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Monitor', icon: Monitor },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Car', icon: Car },
  { name: 'Home', icon: Home },
  { name: 'Target', icon: Target },
  { name: 'Package', icon: Package },
  { name: 'Settings', icon: Settings },
  { name: 'Key', icon: Key },
  { name: 'Phone', icon: Phone },
  { name: 'Shield', icon: Shield },
  { name: 'Plane', icon: Plane },
  { name: 'Stethoscope', icon: Stethoscope },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Database', icon: Database },
  { name: 'Server', icon: Server },
  { name: 'Globe', icon: Globe },
  { name: 'MapPin', icon: MapPin },
  { name: 'Clock', icon: Clock },
  { name: 'Calendar', icon: Calendar },
  { name: 'User', icon: User },
  { name: 'Users', icon: Users },
  { name: 'FileText', icon: FileText },
  { name: 'Image', icon: Image },
  { name: 'Video', icon: Video },
  { name: 'Music', icon: Music },
  { name: 'Headphones', icon: Headphones },
  { name: 'Camera', icon: Camera },
  { name: 'Mic', icon: Mic },
  { name: 'Wifi', icon: Wifi },
  { name: 'Bluetooth', icon: Bluetooth },
  { name: 'Battery', icon: Battery },
  { name: 'Signal', icon: Signal },
  { name: 'Navigation', icon: Navigation },
  { name: 'Compass', icon: Compass },
  { name: 'Map', icon: Map },
  { name: 'Layers', icon: Layers },
  { name: 'Grid', icon: Grid },
  { name: 'List', icon: List },
  { name: 'Layout', icon: Layout },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'Share2', icon: Share2 },
  { name: 'Download', icon: Download },
  { name: 'Upload', icon: Upload },
  { name: 'Send', icon: Send },
  { name: 'Paperclip', icon: Paperclip },
  { name: 'Link', icon: Link },
  { name: 'Check', icon: Check },
  { name: 'Bell', icon: Bell },
  { name: 'Lock', icon: Lock },
  { name: 'Unlock', icon: Unlock },
  { name: 'Eye', icon: Eye },
  { name: 'EyeOff', icon: EyeOff },
  { name: 'Plus', icon: Plus },
  { name: 'ShieldAlert', icon: ShieldAlert },
  { name: 'MessageSquare', icon: MessageSquare },
];

export const IconComponent = ({ iconName, size = 24 }) => {
  const iconData = SERVICE_ICONS.find(i => i.name === iconName);
  if (!iconData) return <Wrench size={size}/>;
  const Icon = iconData.icon;
  return <Icon size={size}/>;
};

export const ServiceDrawer = () => {
  const { serviceDrawerOpen, setServiceDrawerOpen, service, setService, onSave, slug, setSlug } = useService();
  const [form, setForm] = useState({ name:'', description:'', icon:'Wrench', isActive:true, order:0 });
  const [saving, setSaving] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (serviceDrawerOpen && service) {
      setForm({
        name: service.name || '',
        description: service.description || '',
        icon: service.icon || 'Wrench',
        isActive: service.isActive !== undefined ? service.isActive : true,
        order: service.order || 0,
      });
    } else if (serviceDrawerOpen && !service) {
      setForm({ name:'', description:'', icon:'Wrench', isActive:true, order:0 });
    }
  }, [serviceDrawerOpen, service]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Service name required'); return; }
    setSaving(true);
    try {
      if (service) await serviceAPI.update(slug, service._id, form);
      else await serviceAPI.create(slug, form);
      toast.success(service ? 'Service updated' : 'Service created');
      setServiceDrawerOpen(false);
      setService(null);
      setForm({ name:'', description:'', icon:'Wrench', isActive:true, order:0 });
      setIconSearch('');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const filteredIcons = SERVICE_ICONS.filter(icon =>
    icon.name.toLowerCase().includes(iconSearch.toLowerCase())
  );

  if (!serviceDrawerOpen) return null;

  const drawerWidth = isMobile ? 300 : window.innerWidth < 1024 ? 480 : 520;

  return (
    <Drawer open={serviceDrawerOpen} onClose={()=>{setServiceDrawerOpen(false); setService(null);}} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <Wrench size={22}/>
            </div>
            <div>
              <h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>{service ? 'Edit Service' : 'Add Service'}</h2>
              <p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{service ? 'Update service details' : 'Create a new service for your company'}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={()=>{setServiceDrawerOpen(false); setService(null);}} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={e=>{e.preventDefault();handleSave();}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="form-group"><label className="form-label">Service Name *</label>
            <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. AC Repair, Billing Support" required style={{ padding:'10px 14px' }}/>
          </div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Brief description of this service..." style={{ padding:'10px 14px' }}/>
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <input
              type="text"
              value={iconSearch}
              onChange={e=>setIconSearch(e.target.value)}
              placeholder="Search icons..."
              style={{ padding:'10px 14px', marginBottom:10 }}
            />
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'16px', background:'var(--surface2)', borderRadius:'var(--radius)', maxHeight:200, overflowY:'auto' }}>
              {filteredIcons.map(ic => {
                const Icon = ic.icon;
                return (
                  <button key={ic.name} type="button" onClick={() => setForm(p=>({...p,icon:ic.name}))}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:8, border:`2px solid ${form.icon===ic.name?'#1a6fa8':'var(--border)'}`, background:form.icon===ic.name?'rgba(26,111,168,0.1)':'var(--surface)', cursor:'pointer', transition:'all 0.2s ease', width:48, height:48 }}
                    title={ic.name}>
                    <Icon size={20} style={{ color:form.icon===ic.name?'#1a6fa8':'var(--text)' }}/>
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <div style={{ width:'100%', textAlign:'center', fontSize:13, color:'var(--muted)', padding:20 }}>No icons found</div>
              )}
            </div>
            <div style={{ marginTop:6, fontSize:13, color:'var(--muted)' }}>Selected: {form.icon}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
              <input type="checkbox" checked={form.isActive} onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))} style={{ width:'auto' }}/>
              Active (visible to customers)
            </label>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>{setServiceDrawerOpen(false); setService(null);}} style={{ padding:'10px 24px', borderRadius:8 }}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ padding:'10px 24px', borderRadius:8 }}>
              {saving?<><Spinner size={14}/> Saving…</>:service?'Update':'Create'}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

// ─── Staff Drawer ─────────────────────────────────────────
export const StaffDrawer = () => {
  const { staffDrawerOpen, setStaffDrawerOpen, staff, setStaff, onSave, slug, setSlug } = useStaff();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'agent', phone:'', specializations:'' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (staffDrawerOpen && staff) {
      setForm({
        name: staff.name || '',
        email: staff.email || '',
        password: '',
        confirmPassword: '',
        role: staff.role || 'agent',
        phone: staff.phone || '',
        specializations: (staff.specializations || []).join(', '),
      });
    } else if (staffDrawerOpen && !staff) {
      setForm({ name:'', email:'', password:'', confirmPassword:'', role:'agent', phone:'', specializations:'' });
    }
  }, [staffDrawerOpen, staff]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = 'Name is required';
    if (!form.email?.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!staff && !form.password?.trim()) newErrors.password = 'Password is required';
    else if (!staff && form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    else if (staff && form.password && form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    else if (staff && form.password && form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!form.phone?.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ''))) newErrors.phone = 'Please enter a valid 10-digit Indian phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const data = {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        specializations: form.specializations ? form.specializations.split(',').map(s=>s.trim()).filter(Boolean) : [],
      };
      if (form.password) data.password = form.password;
      
      if (staff) await companyAPI.updateStaff(slug, staff._id, data);
      else await companyAPI.createStaff(slug, data);
      toast.success(staff ? 'Staff updated' : 'Staff added');
      setStaffDrawerOpen(false);
      setStaff(null);
      setForm({ name:'', email:'', password:'', confirmPassword:'', role:'agent', phone:'', specializations:'' });
      setErrors({});
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (!staffDrawerOpen) return null;

  const drawerWidth = isMobile ? 300 : window.innerWidth < 1024 ? 480 : 520;

  return (
    <Drawer open={staffDrawerOpen} onClose={()=>{setStaffDrawerOpen(false); setStaff(null);}} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <UserCog size={22}/>
            </div>
            <div>
              <h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>{staff ? 'Edit Staff' : 'Add Staff Member'}</h2>
              <p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{staff ? 'Update staff member details' : 'Add a new staff member to your team'}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={()=>{setStaffDrawerOpen(false); setStaff(null);}} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={e=>{e.preventDefault();handleSave();}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="form-group"><label className="form-label">Full Name *</label>
            <input value={form.name} onChange={e=>{setForm(p=>({...p,name:e.target.value})); if(errors.name)setErrors(e=>({...e,name:''}))}} placeholder="John Doe" style={{ padding:'10px 14px', borderColor:errors.name?'#ef4444':undefined, boxShadow:errors.name?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
            {errors.name && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.name}</div>}
          </div>
          <div className="form-group"><label className="form-label">Email *</label>
            <input type="email" value={form.email} onChange={e=>{setForm(p=>({...p,email:e.target.value})); if(errors.email)setErrors(e=>({...e,email:''}))}} placeholder="john@example.com" style={{ padding:'10px 14px', borderColor:errors.email?'#ef4444':undefined, boxShadow:errors.email?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
            {errors.email && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.email}</div>}
          </div>
          {!staff && (
            <div className="form-group"><label className="form-label">Password *</label>
              <input type="password" value={form.password} onChange={e=>{setForm(p=>({...p,password:e.target.value})); if(errors.password)setErrors(e=>({...e,password:''}))}} placeholder="Min 6 characters" style={{ padding:'10px 14px', borderColor:errors.password?'#ef4444':undefined, boxShadow:errors.password?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
              {errors.password && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.password}</div>}
            </div>
          )}
          {staff && (
            <>
              <div className="form-group"><label className="form-label">Change Password</label>
                <input type="password" value={form.password} onChange={e=>{setForm(p=>({...p,password:e.target.value})); if(errors.password)setErrors(e=>({...e,password:''}))}} placeholder="Leave empty to keep current password" style={{ padding:'10px 14px', borderColor:errors.password?'#ef4444':undefined, boxShadow:errors.password?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                {errors.password && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.password}</div>}
              </div>
              <div className="form-group"><label className="form-label">Confirm Password</label>
                <input type="password" value={form.confirmPassword || ''} onChange={e=>{setForm(p=>({...p,confirmPassword:e.target.value})); if(errors.confirmPassword)setErrors(e=>({...e,confirmPassword:''}))}} placeholder="Confirm new password" style={{ padding:'10px 14px', borderColor:errors.confirmPassword?'#ef4444':undefined, boxShadow:errors.confirmPassword?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}/>
                {errors.confirmPassword && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.confirmPassword}</div>}
              </div>
            </>
          )}
          <div className="form-group"><label className="form-label">Role</label>
            <div style={{ position:'relative' }}>
              <button type="button" onClick={() => setRoleDropdownOpen(!roleDropdownOpen)} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', cursor:'pointer' }}>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {form.role === 'agent' ? <><UserCheck size={18} style={{ color:'#1a6fa8'}}/> Agent</> :
                   form.role === 'employee' ? <><Users size={18} style={{ color:'#10b981'}}/> Employee</> :
                   form.role === 'company_admin' ? <><Shield size={18} style={{ color:'#f59e0b'}}/> Admin</> :
                   'Select role'}
                </span>
                <ChevronDown size={16} style={{ color:'var(--muted)' }}/>
              </button>
              {roleDropdownOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, marginTop:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>
                  <button type="button" onClick={() => { setForm(p=>({...p,role:'agent'})); setRoleDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:'none', cursor:'pointer', textAlign:'left' }}>
                    <UserCheck size={18} style={{ color:'#1a6fa8'}}/> Agent
                  </button>
                  <button type="button" onClick={() => { setForm(p=>({...p,role:'employee'})); setRoleDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:'none', cursor:'pointer', textAlign:'left' }}>
                    <Users size={18} style={{ color:'#10b981'}}/> Employee
                  </button>
                  <button type="button" onClick={() => { setForm(p=>({...p,role:'company_admin'})); setRoleDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:'none', cursor:'pointer', textAlign:'left' }}>
                    <Shield size={18} style={{ color:'#f59e0b'}}/> Admin
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group"><label className="form-label">Phone *</label>
            <input 
              type="tel" 
              value={form.phone} 
              onChange={e=>{ const val = e.target.value.replace(/\D/g, '').slice(0,10); setForm(p=>({...p,phone:val})); if(errors.phone)setErrors(e=>({...e,phone:''})); }}
              placeholder="9876543210" 
              maxLength={10}
              style={{ padding:'10px 14px', borderColor:errors.phone?'#ef4444':undefined, boxShadow:errors.phone?'0 0 0 3px rgba(239,68,68,0.1)':undefined }}
            />
            {errors.phone && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.phone}</div>}
          </div>
          <div className="form-group"><label className="form-label">Specializations (comma-separated)</label>
            <textarea rows={2} value={form.specializations} onChange={e=>setForm(p=>({...p,specializations:e.target.value}))} placeholder="e.g. AC Repair, Electrical, Plumbing" style={{ padding:'10px 14px' }}/>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>{setStaffDrawerOpen(false); setStaff(null);}} style={{ padding:'10px 24px', borderRadius:8 }}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ padding:'10px 24px', borderRadius:8 }}>
              {saving?<><Spinner size={14}/> Saving…</>:staff?'Update':'Add'}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

// ─── Ticket Drawer ─────────────────────────────────────────
export const TicketDrawer = () => {
  const { ticketDrawerOpen, setTicketDrawerOpen, onSave, slug, setSlug } = useTicket();
  const [form, setForm] = useState({ title:'', description:'', category:'', priority:'medium', contactEmail:'', contactPhone:'', tags:'', attachments:[] });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (ticketDrawerOpen) {
      // Get slug from sessionStorage if not in context
      if (!slug) {
        const storedSlug = sessionStorage.getItem('companySlug');
        if (storedSlug) {
          setSlug(storedSlug);
        }
      }
      // Fetch services and categories if slug is available
      if (slug) {
        serviceAPI.getPublic(slug).then(r => { setServices(r.data.data||[]); setCategories(r.data.company?.settings?.ticketCategories || []); }).catch(()=>{});
      }
      // Check if a service was selected from UserServices
      const selectedService = sessionStorage.getItem('selectedService');
      if (selectedService) {
        const service = JSON.parse(selectedService);
        if (service.name) {
          setForm(p => ({ ...p, category: service.name }));
        }
      }
    }
  }, [ticketDrawerOpen, slug, setSlug]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.title?.trim()) newErrors.title = 'Title is required';
    if (!form.description?.trim()) newErrors.description = 'Description is required';
    if (!form.category?.trim()) newErrors.category = 'Category is required';
    if (form.contactEmail && !/\S+@\S+\.\S+/.test(form.contactEmail)) newErrors.contactEmail = 'Invalid email format';
    if (form.contactPhone && !/^[0-9]{10}$/.test(form.contactPhone.replace(/\D/g, ''))) newErrors.contactPhone = 'Please enter a valid 10-digit Indian phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      await ticketAPI.createTicket(slug, fd);
      toast.success('Ticket created successfully');
      setTicketDrawerOpen(false);
      setForm({ title:'', description:'', category:'', priority:'medium', contactEmail:'', contactPhone:'', tags:'', attachments:[] });
      setErrors({});
      sessionStorage.removeItem('selectedService');
      sessionStorage.removeItem('selectedTicket');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating ticket'); }
    finally { setSaving(false); }
  };

  if (!ticketDrawerOpen) return null;

  const drawerWidth = isMobile ? 300 : window.innerWidth < 1024 ? 480 : 520;

  return (
    <Drawer open={ticketDrawerOpen} onClose={()=>{setTicketDrawerOpen(false); sessionStorage.removeItem('selectedService'); sessionStorage.removeItem('selectedTicket');}} width={drawerWidth} position="right">
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a6fa8' }}>
              <Ticket size={22}/>
            </div>
            <div>
              <h2 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:18, color:'var(--text)' }}>Create New Ticket</h2>
              <p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Submit a new support request</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={()=>{setTicketDrawerOpen(false); sessionStorage.removeItem('selectedService'); sessionStorage.removeItem('selectedTicket');}} style={{ color:'var(--muted)', borderRadius:8, padding:8 }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={e=>{e.preventDefault();handleSave();}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Title *</label>
            <input value={form.title} onChange={e=>{setForm(p=>({...p,title:e.target.value})); if(errors.title)setErrors(e=>({...e,title:''}))}} placeholder="Brief summary of your issue" maxLength={120} style={{ padding:'10px 14px', borderRadius:10, border:errors.title?'2px solid #ef4444':'1px solid var(--border)', boxShadow:errors.title?'0 0 0 3px rgba(239,68,68,0.1)':'none', fontSize:14 }}/>
            {errors.title && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.title}</div>}
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Description *</label>
            <textarea rows={4} value={form.description} onChange={e=>{setForm(p=>({...p,description:e.target.value})); if(errors.description)setErrors(e=>({...e,description:''}))}} placeholder="Describe your issue in detail" style={{ padding:'10px 14px', borderRadius:10, border:errors.description?'2px solid #ef4444':'1px solid var(--border)', boxShadow:errors.description?'0 0 0 3px rgba(239,68,68,0.1)':'none', fontSize:14, resize:'vertical' }}/>
            {errors.description && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.description}</div>}
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Category *</label>
            <div style={{ position:'relative' }}>
              <button type="button" onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', border:errors.category?'2px solid #ef4444':'1px solid var(--border)', borderRadius:10, cursor:'pointer', fontSize:14, boxShadow:errors.category?'0 0 0 3px rgba(239,68,68,0.1)':'none' }}>
                <span>{form.category || '— Select category —'}</span>
                <ChevronDown size={16} style={{ color:'var(--muted)' }}/>
              </button>
              {categoryDropdownOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, marginTop:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, maxHeight:200, overflowY:'auto' }}>
                  <button type="button" onClick={() => { setForm(p=>({...p,category:''})); setCategoryDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:'none', cursor:'pointer', textAlign:'left', fontSize:14, color:'var(--muted)' }}>
                    — Select category —
                  </button>
                  {[...new Set([...categories, ...services.map(s => s.name)])].map(c => (
                    <button key={c} type="button" onClick={() => { setForm(p=>({...p,category:c})); setCategoryDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:form.category===c?'rgba(26,111,168,0.08)':'none', cursor:'pointer', textAlign:'left', fontSize:14 }}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.category && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.category}</div>}
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Priority</label>
            <div style={{ position:'relative' }}>
              <button type="button" onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', fontSize:14 }}>
                <span>{form.priority === 'low' ? '🟢 Low' : form.priority === 'medium' ? '🟡 Medium' : form.priority === 'high' ? '🔴 High' : form.priority === 'critical' ? '🚨 Critical' : 'Select priority'}</span>
                <ChevronDown size={16} style={{ color:'var(--muted)' }}/>
              </button>
              {priorityDropdownOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, marginTop:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
                  <button type="button" onClick={() => { setForm(p=>({...p,priority:'low'})); setPriorityDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:form.priority==='low'?'rgba(26,111,168,0.08)':'none', cursor:'pointer', textAlign:'left', fontSize:14 }}>
                    🟢 Low
                  </button>
                  <button type="button" onClick={() => { setForm(p=>({...p,priority:'medium'})); setPriorityDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:form.priority==='medium'?'rgba(26,111,168,0.08)':'none', cursor:'pointer', textAlign:'left', fontSize:14 }}>
                    🟡 Medium
                  </button>
                  <button type="button" onClick={() => { setForm(p=>({...p,priority:'high'})); setPriorityDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:form.priority==='high'?'rgba(26,111,168,0.08)':'none', cursor:'pointer', textAlign:'left', fontSize:14 }}>
                    🔴 High
                  </button>
                  <button type="button" onClick={() => { setForm(p=>({...p,priority:'critical'})); setPriorityDropdownOpen(false); }} style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:form.priority==='critical'?'rgba(26,111,168,0.08)':'none', cursor:'pointer', textAlign:'left', fontSize:14 }}>
                    🚨 Critical
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Tags (optional)</label>
            <input value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} placeholder="billing, account, urgent" style={{ padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14 }}/>
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Alternate Email (optional)</label>
            <input type="email" value={form.contactEmail} onChange={e=>{setForm(p=>({...p,contactEmail:e.target.value})); if(errors.contactEmail)setErrors(e=>({...e,contactEmail:''}))}} placeholder="other@email.com" style={{ padding:'10px 14px', borderRadius:10, border:errors.contactEmail?'2px solid #ef4444':'1px solid var(--border)', boxShadow:errors.contactEmail?'0 0 0 3px rgba(239,68,68,0.1)':'none', fontSize:14 }}/>
            {errors.contactEmail && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.contactEmail}</div>}
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Phone Number (optional)</label>
            <input type="tel" value={form.contactPhone} onChange={e=>{const val=e.target.value.replace(/\D/g,'').slice(0,10); setForm(p=>({...p,contactPhone:val})); if(errors.contactPhone)setErrors(e=>({...e,contactPhone:''}))}} placeholder="9876543210" maxLength={10} style={{ padding:'10px 14px', borderRadius:10, border:errors.contactPhone?'2px solid #ef4444':'1px solid var(--border)', boxShadow:errors.contactPhone?'0 0 0 3px rgba(239,68,68,0.1)':'none', fontSize:14 }}/>
            {errors.contactPhone && <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.contactPhone}</div>}
          </div>
          <div className="form-group"><label className="form-label" style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13 }}>Attachments (optional, max 5)</label>
            <label style={{ cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', fontSize:13, fontWeight:500 }}>
              <Paperclip size={16}/> Attach Files
              <input type="file" multiple hidden onChange={e=>{const newFiles=Array.from(e.target.files); if(form.attachments.length+newFiles.length>5){toast.error('Maximum 5 attachments');return;} setForm(p=>({...p,attachments:[...p.attachments,...newFiles]}));}} accept="image/*,.pdf,.doc,.docx,.xlsx,.txt"/>
            </label>
            {form.attachments.map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--surface2)', borderRadius:8, fontSize:13, marginTop:6 }}>
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{f.name}</span>
                <span style={{ color:'var(--muted)', fontSize:11, flexShrink:0 }}>{(f.size/1024).toFixed(0)} KB</span>
                <button type="button" style={{ padding:4, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', color:'var(--muted)' }} onClick={()=>setForm(p=>({...p,attachments:p.attachments.filter((_,x)=>x!==i)}))}><X size={12}/></button>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>{setTicketDrawerOpen(false); sessionStorage.removeItem('selectedService'); sessionStorage.removeItem('selectedTicket');}} style={{ padding:'10px 20px', borderRadius:10 }}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ padding:'10px 20px', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
              {saving?<><Spinner size={14}/> Creating…</>:<><CheckCircle2 size={14}/> Create Ticket</>}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};
