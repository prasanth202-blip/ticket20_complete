import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Shield, BarChart3, Users, MessageSquare, Star,
  CheckCircle, ArrowRight, ChevronLeft, ChevronRight,
  Sun, Moon, Menu, X, MapPin, Phone, Mail as MailIcon,
} from 'lucide-react';
import { subscriptionAPI } from '../../api';
import { useTheme } from '../../context/ThemeContext';

/* ─── helpers ─────────────────────────────────────────────── */
const fmtINR = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

const FEATURES = [
  { icon: <Zap size={18} />,         t: 'Multi-Tenant Architecture',  d: 'Each company gets isolated data and a unique URL. Zero cross-tenant data leakage.' },
  { icon: <Shield size={18} />,      t: '7-Level Role Access Control', d: 'Platform Owner → Super Admin → Admin → Employee → Agent → Customer.' },
  { icon: <MessageSquare size={18}/>, t: 'Real-Time Chat in Tickets',  d: 'Agents and customers communicate inside every ticket. Supports attachments and internal notes.' },
  { icon: <BarChart3 size={18} />,   t: 'Advanced Analytics',          d: 'Pie charts, bar graphs, trend lines, agent performance — all in real-time dashboards.' },
  { icon: <Users size={18} />,       t: 'Team Management',             d: 'Create staff, assign roles, track agent performance. Full company directory.' },
  { icon: <Star size={18} />,        t: 'Ratings & Feedback',          d: '5-star ratings per ticket with agent leaderboard and satisfaction trend reports.' },
];

const STATS = [
  ['7 Roles',       'Strict RBAC'],
  ['Multi-Tenant',  'Isolated data'],
  ['Razorpay',      'INR billing'],
  ['Analytics',     'Live charts'],
];

const SLIDES = [
  {
    label: 'Dashboard',
    title: 'Unified support dashboard',
    desc: 'See all tickets, agent performance, and customer activity in one real-time view.',
    illustration: (
      <svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="340" height="160" fill="#f8f7ff"/>
        <rect x="16" y="16" width="308" height="36" rx="8" fill="#e8f4fd" stroke="#c7d2fe" strokeWidth="0.5"/>
        <circle cx="34" cy="34" r="10" fill="#1a6fa8"/>
        <rect x="52" y="28" width="60" height="6" rx="3" fill="#1a6fa8" opacity=".7"/>
        <rect x="180" y="28" width="40" height="6" rx="3" fill="#c7d2fe"/>
        <rect x="228" y="28" width="40" height="6" rx="3" fill="#c7d2fe"/>
        <rect x="276" y="28" width="32" height="6" rx="3" fill="#c7d2fe"/>
        <rect x="16" y="62" width="98" height="82" rx="8" fill="white" stroke="#e0e7ff" strokeWidth="0.5"/>
        <rect x="24" y="70" width="50" height="5" rx="2" fill="#1a6fa8" opacity=".6"/>
        <rect x="24" y="82" width="40" height="22" rx="4" fill="#e8f4fd"/>
        <text x="44" y="97" fontSize="10" fill="#1a6fa8" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">12</text>
        <rect x="24" y="112" width="82" height="5" rx="2" fill="#e0e7ff"/>
        <rect x="24" y="122" width="60" height="5" rx="2" fill="#e0e7ff"/>
        <rect x="126" y="62" width="198" height="38" rx="8" fill="white" stroke="#e0e7ff" strokeWidth="0.5"/>
        <rect x="134" y="70" width="80" height="5" rx="2" fill="#1a6fa8" opacity=".5"/>
        <rect x="134" y="81" width="40" height="5" rx="2" fill="#e0e7ff"/>
        <rect x="182" y="81" width="30" height="5" rx="2" fill="#bbf7d0"/>
        <rect x="126" y="108" width="198" height="36" rx="8" fill="white" stroke="#e0e7ff" strokeWidth="0.5"/>
        <rect x="134" y="116" width="60" height="5" rx="2" fill="#1a6fa8" opacity=".5"/>
        <rect x="192" y="127" width="30" height="5" rx="2" fill="#fde68a"/>
      </svg>
    ),
  },
  {
    label: 'Ticketing',
    title: 'Smart ticket management',
    desc: 'Auto-assign, tag, and prioritise. Full chat history, attachments, and internal notes inside every ticket.',
    illustration: (
      <svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="340" height="160" fill="#f0fdf4"/>
        <rect x="16" y="16" width="308" height="128" rx="10" fill="white" stroke="#bbf7d0" strokeWidth="0.5"/>
        <rect x="28" y="28" width="120" height="6" rx="3" fill="#1a6fa8" opacity=".6"/>
        <rect x="28" y="42" width="284" height="0.5" fill="#e0e7ff"/>
        <rect x="28" y="52" width="40" height="20" rx="4" fill="#e8f4fd"/>
        <text x="48" y="65" fontSize="9" fill="#1a6fa8" textAnchor="middle" fontFamily="sans-serif">#1042</text>
        <rect x="76" y="56" width="80" height="5" rx="2" fill="#d1d5db"/>
        <rect x="164" y="56" width="50" height="5" rx="2" fill="#bbf7d0"/>
        <rect x="270" y="52" width="30" height="14" rx="4" fill="#fde68a" opacity=".7"/>
        <rect x="28" y="82" width="40" height="20" rx="4" fill="#e8f4fd"/>
        <text x="48" y="95" fontSize="9" fill="#1a6fa8" textAnchor="middle" fontFamily="sans-serif">#1041</text>
        <rect x="76" y="86" width="65" height="5" rx="2" fill="#d1d5db"/>
        <rect x="149" y="86" width="60" height="5" rx="2" fill="#d1fae5"/>
        <rect x="270" y="82" width="30" height="14" rx="4" fill="#d1fae5" opacity=".8"/>
        <rect x="28" y="112" width="40" height="20" rx="4" fill="#e8f4fd"/>
        <text x="48" y="125" fontSize="9" fill="#1a6fa8" textAnchor="middle" fontFamily="sans-serif">#1040</text>
        <rect x="76" y="116" width="90" height="5" rx="2" fill="#d1d5db"/>
        <rect x="270" y="112" width="30" height="14" rx="4" fill="#fecaca" opacity=".8"/>
      </svg>
    ),
  },
  {
    label: 'Analytics',
    title: 'Real-time performance analytics',
    desc: 'Track resolution rates, CSAT scores, agent leaderboards, and ticket trends with live charts.',
    illustration: (
      <svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="340" height="160" fill="#fdf4ff"/>
        <rect x="16" y="16" width="148" height="128" rx="10" fill="white" stroke="#e9d5ff" strokeWidth="0.5"/>
        <rect x="28" y="28" width="60" height="5" rx="2" fill="#7c3aed" opacity=".6"/>
        <circle cx="58" cy="80" r="36" fill="none" stroke="#e9d5ff" strokeWidth="14"/>
        <path d="M58 44 A36 36 0 0 1 94 80" fill="none" stroke="#1a6fa8" strokeWidth="14" strokeLinecap="round"/>
        <path d="M94 80 A36 36 0 0 1 58 116" fill="none" stroke="#7c3aed" strokeWidth="14" strokeLinecap="round"/>
        <text x="58" y="84" fontSize="14" fill="#1a6fa8" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">68%</text>
        <rect x="172" y="16" width="152" height="60" rx="10" fill="white" stroke="#e9d5ff" strokeWidth="0.5"/>
        <rect x="182" y="26" width="60" height="5" rx="2" fill="#7c3aed" opacity=".5"/>
        <rect x="182" y="38" width="30" height="16" rx="4" fill="#e8f4fd"/>
        <text x="197" y="50" fontSize="10" fill="#1a6fa8" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">4.8</text>
        <rect x="220" y="38" width="8" height="8" rx="2" fill="#fde68a"/>
        <rect x="230" y="38" width="8" height="8" rx="2" fill="#fde68a"/>
        <rect x="240" y="38" width="8" height="8" rx="2" fill="#fde68a"/>
        <rect x="250" y="38" width="8" height="8" rx="2" fill="#fde68a"/>
        <rect x="260" y="38" width="8" height="8" rx="2" fill="#fde68a" opacity=".4"/>
        <rect x="172" y="84" width="152" height="60" rx="10" fill="white" stroke="#e9d5ff" strokeWidth="0.5"/>
        <rect x="182" y="94" width="70" height="5" rx="2" fill="#7c3aed" opacity=".5"/>
        <rect x="182" y="106" width="90" height="6" rx="3" fill="#e9d5ff"/>
        <rect x="182" y="106" width="65" height="6" rx="3" fill="#7c3aed" opacity=".6"/>
        <rect x="182" y="118" width="90" height="6" rx="3" fill="#e9d5ff"/>
        <rect x="182" y="118" width="45" height="6" rx="3" fill="#7c3aed" opacity=".4"/>
      </svg>
    ),
  },
  {
    label: 'Access Control',
    title: '7-level role-based access',
    desc: 'Platform Owner down to Customer — granular permissions at every level with full audit trail.',
    illustration: (
      <svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="340" height="160" fill="#fff7ed"/>
        <rect x="16" y="16" width="308" height="128" rx="10" fill="white" stroke="#fed7aa" strokeWidth="0.5"/>
        <rect x="28" y="28" width="80" height="5" rx="2" fill="#ea580c" opacity=".6"/>
        <circle cx="52" cy="70" r="16" fill="#fef3c7"/>
        <text x="52" y="74" fontSize="10" fill="#d97706" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">SA</text>
        <rect x="76" y="62" width="60" height="5" rx="2" fill="#1e293b" opacity=".6"/>
        <rect x="76" y="72" width="45" height="4" rx="2" fill="#94a3b8"/>
        <rect x="248" y="60" width="60" height="18" rx="4" fill="#fed7aa"/>
        <text x="278" y="72" fontSize="9" fill="#ea580c" textAnchor="middle" fontFamily="sans-serif">Super Admin</text>
        <rect x="28" y="96" width="284" height="0.5" fill="#fed7aa"/>
        <circle cx="52" cy="120" r="14" fill="#e0f2fe"/>
        <text x="52" y="124" fontSize="9" fill="#0369a1" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">AG</text>
        <rect x="74" y="113" width="55" height="5" rx="2" fill="#1e293b" opacity=".5"/>
        <rect x="74" y="122" width="40" height="4" rx="2" fill="#94a3b8"/>
        <rect x="248" y="112" width="50" height="18" rx="4" fill="#dbeafe"/>
        <text x="273" y="124" fontSize="9" fill="#1d4ed8" textAnchor="middle" fontFamily="sans-serif">Agent</text>
      </svg>
    ),
  },
];

/* ─── styles (scoped to landing) ──────────────────────────── */
const S = {
  /* layout */
  page:    { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-b)' },
  maxW:    { maxWidth: 1100, margin: '0 auto', padding: '0 20px' },
  maxWMd:  { maxWidth: 720,  margin: '0 auto', padding: '0 20px' },
  maxWSm:  { maxWidth: 560,  margin: '0 auto', padding: '0 20px' },

  /* nav */
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    height: 58,
  },
  navInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 20px',
    height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 },
  logoIcon: {
    width: 30, height: 30, borderRadius: 8,
    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15, color: 'var(--text)' },

  /* hero */
  hero: { padding: '72px 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  heroContent: { display: 'flex', alignItems: 'center', gap: 40, maxWidth: 1100, margin: '0 auto', textAlign: 'left' },
  heroLeft: { flex: 1, minWidth: 0 },
  heroRight: { flex: 1, minWidth: 0 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--primary-l)', border: '1px solid rgba(26,111,168,.2)',
    borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'var(--primary)',
    marginBottom: 20, fontWeight: 600,
  },
  h1: {
    fontFamily: 'var(--font-h)', fontWeight: 800,
    fontSize: 'clamp(28px, 6vw, 52px)', lineHeight: 1.12,
    marginBottom: 16, color: 'var(--text)',
  },
  heroSub: {
    fontSize: 'clamp(14px, 2vw, 17px)', color: 'var(--muted)',
    maxWidth: 480, marginBottom: 32, lineHeight: 1.75,
  },
  heroBtns: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 },

  /* stats bar */
  statsBar: {
    display: 'flex', marginBottom: 32,
    maxWidth: 460, border: '1px solid var(--border)', borderRadius: 12,
    overflow: 'hidden',
  },
  statItem: { flex: 1, textAlign: 'center', padding: '14px 8px' },
  statV:    { fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 800, color: 'var(--primary)' },
  statL:    { fontSize: 11, color: 'var(--muted)', marginTop: 2 },

  /* sections */
  section:    { padding: '56px 20px' },
  sectionAlt: { background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' },
  sectionHead:{ textAlign: 'center', marginBottom: 36 },
  h2:         { fontFamily: 'var(--font-h)', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, marginBottom: 8 },
  sectionSub: { color: 'var(--muted)', fontSize: 14, maxWidth: 420, margin: '0 auto' },

  /* features grid */
  featGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14, maxWidth: 940, margin: '0 auto',
  },
  featCard: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '18px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  featIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--primary-l)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
  },
  featTitle: { fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, marginBottom: 3 },
  featDesc:  { color: 'var(--muted)', fontSize: 13, lineHeight: 1.65 },

  /* billing toggle */
  toggleWrap: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 },

  /* plans */
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: 14, maxWidth: 920, margin: '0 auto',
  },
  planCard: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '22px 20px', position: 'relative',
  },
  planCardPopular: { border: '2px solid var(--primary)' },
  planBadge: {
    fontSize: 11, background: 'var(--primary-l)', color: 'var(--primary)',
    padding: '3px 10px', borderRadius: 10, fontWeight: 700,
    display: 'inline-block', marginBottom: 12,
  },
  planName:  { fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 800, marginBottom: 4 },
  planDesc:  { fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.55 },
  planPrice: { fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, marginBottom: 16 },
  planPer:   { fontSize: 13, color: 'var(--muted)', fontWeight: 400 },
  featList:  { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 },
  featRow:   { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text2)' },

  /* contact */
  contactCard: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '24px 20px',
    maxWidth: 520, margin: '0 auto',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12, marginBottom: 12,
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 },
};

function ThemeToggleBtn() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text)', fontFamily: 'var(--font-b)' }}>
      {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
      <span style={{ fontSize: 12 }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}

function StatsDivider({ idx }) {
  return idx < STATS.length - 1
    ? <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
    : null;
}

function HeroSlider() {
  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);
  const total = SLIDES.length;

  const go = (n) => setCur(((n % total) + total) % total);
  const startAuto = () => { timerRef.current = setInterval(() => setCur(c => (c + 1) % total), 3800); };
  const stopAuto  = () => clearInterval(timerRef.current);

  useEffect(() => { startAuto(); return stopAuto; }, []);

  const s = SLIDES[cur];

  return (
    <div
      style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)' }}
      onMouseEnter={stopAuto} onMouseLeave={startAuto}
    >
      <div style={{ width: '100%', height: 280, overflow: 'hidden' }}>{s.illustration}</div>
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a6fa8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{s.label}</div>
        <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-h)', marginBottom: 6, color: 'var(--text)' }}>{s.title}</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 16px' }}>
        <button onClick={() => go(cur - 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          <ChevronLeft size={15} />
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{ height: 6, width: i === cur ? 20 : 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, background: i === cur ? '#1a6fa8' : 'var(--border)', transition: 'width .2s, background .2s' }} />
          ))}
        </div>
        <button onClick={() => go(cur + 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function LandingPage({ section }) {
  const [plans,    setPlans]    = useState([]);
  const [billing,  setBilling]  = useState('monthly');
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme } = useTheme();

  // Contact form state
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then(r => setPlans(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (section) {
      setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [section]);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({ name: '', email: '', message: '' });
    
    // Reset success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  /* fallback plans when API isn't loaded */
  const displayPlans = plans.length > 0 ? plans : [
    { name: 'Starter',    price: { monthly: 83000,  yearly: 830000  }, features_display: ['5 agents', '500 tickets/month', '1 GB storage'],                              isPopular: false },
    { name: 'Growth',     price: { monthly: 208000, yearly: 2080000 }, features_display: ['20 agents', '2,000 tickets/month', '10 GB storage', 'Custom logo'],            isPopular: true  },
    { name: 'Enterprise', price: { monthly: 665000, yearly: 6650000 }, features_display: ['Unlimited agents', '100 GB storage', 'Custom subdomain', 'White label'],       isPopular: false },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @media (max-width: 900px) {
          .hero-content {
            flex-direction: column !important;
            text-align: center !important;
            gap: 32px !important;
          }
          .hero-left {
            text-align: center !important;
          }
          .hero-btns {
            justify-content: center !important;
          }
          .stats-bar {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .hero-right {
            width: 100% !important;
          }
        }
        @media (max-width: 600px) {
          .stats-bar {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .stat-item > div:first-child {
            font-size: 20px !important;
          }
          .stat-item > div:last-child {
            font-size: 11px !important;
          }
          .hero-btns {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .hero-btns a, .hero-btns button {
            width: 100% !important;
            justify-content: center !important;
          }
          .feat-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .plans-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 600px) {
          section {
            padding: 32px 16px !important;
          }
          .stats-section {
            padding: 24px 16px !important;
          }
          .stat-item {
            padding: 18px 12px !important;
          }
        }
        @media (max-width: 600px) {
          .hero {
            padding: 48px 16px 40px !important;
          }
        }
        @media (max-width: 768px) {
          .nav-inner > div:nth-child(2) {
            display: none !important;
          }
          .nav-inner > div:nth-child(3) > .hide-mobile {
            display: none !important;
          }
          .show-mobile {
            display: flex !important;
          }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={S.nav}>
        <div style={S.navInner} className="nav-inner">
          <Link to="/" style={S.logo}>
            <img src={theme === 'dark' ? '/logo_white.png' : '/logo.png'} alt="logo" style={{ width:120, height:120, objectFit:'contain' }}/>
          </Link>

          {/* desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }} className="hide-mobile">
            <a href="#about"   onClick={scrollTo('about')}   style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Features</a>
            <a href="#pricing" onClick={scrollTo('pricing')} style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Pricing</a>
            <a href="#contact" onClick={scrollTo('contact')} style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Contact</a>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <ThemeToggleBtn />
            <Link to="/platform/login" className="btn btn-outline hide-mobile" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8 }}>Platform Login</Link>
            <Link to="/register" className="btn btn-primary hide-mobile" style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>Get Started</Link>
            <button
              className="show-mobile"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'none',
                alignItems: 'center',
                color: 'var(--text)',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 58,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              padding: '20px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <a href="#about"   onClick={scrollTo('about')}   style={{ fontSize: 16, color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>Features</a>
              <a href="#pricing" onClick={scrollTo('pricing')} style={{ fontSize: 16, color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
              <a href="#contact" onClick={scrollTo('contact')} style={{ fontSize: 16, color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>Contact</a>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <Link to="/platform/login" onClick={() => setMenuOpen(false)} className="btn btn-outline" style={{ fontSize: 14, padding: '10px 16px', fontWeight: 600, borderRadius: 8, display: 'inline-block', textAlign: 'center' }}>Platform Login</Link>
              <Link to="/register"       onClick={() => setMenuOpen(false)} className="btn btn-primary" style={{ fontSize: 14, padding: '10px 16px', fontWeight: 600, borderRadius: 8, display: 'inline-block', textAlign: 'center' }}>Get Started</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={S.hero}>
        {/* subtle glow behind heading */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(26,111,168,.07) 0%, transparent 70%)',
        }} />

        <div style={S.heroContent} className="hero-content">
          {/* Left side - text */}
          <div style={S.heroLeft} className="hero-left">
            <div style={S.badge}>
              <Zap size={11} /> Multi-Tenant · Role-Based · Production-Ready
            </div>

            <h1 style={S.h1}>
              Customer Support Built<br />
              <span style={{ color: 'var(--primary)' }}>for Every Team</span>
            </h1>

            <p style={S.heroSub}>
              Launch your branded support portal in minutes. Multi-tenant, Razorpay billing,
              real-time chat, and full analytics — all in one platform.
            </p>

            <div style={S.heroBtns} className="hero-btns">
              <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <a href="#pricing" onClick={scrollTo('pricing')} className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                View Pricing
              </a>
            </div>
          </div>

          {/* Right side - slider */}
          <div style={S.heroRight}>
            <HeroSlider />
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section style={{ padding: '40px 20px', background: 'var(--bg)' }} className="stats-section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="stats-bar">
            {STATS.map(([v, l], i) => (
              <div
                key={v}
                style={{
                  background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                  border: '1px solid rgba(102,126,234,0.2)',
                  borderRadius: 16,
                  padding: '24px 16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                className="stat-item"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.2)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)';
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1a6fa8', fontFamily: 'var(--font-h)', marginBottom: 6 }}>{v}</div>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="about" style={{ ...S.section, ...S.sectionAlt }}>
        <div style={S.sectionHead}>
          <h2 style={S.h2}>Everything You Need</h2>
          <p style={S.sectionSub}>A complete support infrastructure ready to deploy for any business.</p>
        </div>
        <div style={S.featGrid} className="feat-grid">
          {FEATURES.map((f, i) => (
            <div key={i} style={S.featCard}>
              <div style={S.featIcon}>{f.icon}</div>
              <div>
                <p style={S.featTitle}>{f.t}</p>
                <p style={S.featDesc}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ ...S.section, background: 'linear-gradient(135deg, #1a6fa8 0%, #1e3669 100%)' }}>
        <div style={S.sectionHead}>
          <h2 style={{ ...S.h2, color: '#ffffff' }}>Simple Pricing in INR</h2>
          <p style={{ ...S.sectionSub, color: 'rgba(255,255,255,0.9)' }}>No hidden charges. Cancel anytime.</p>
        </div>

        {/* Billing toggle */}
        <div style={{ ...S.toggleWrap }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: billing === 'monthly' ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            style={{
              width: 42, height: 24, borderRadius: 12,
              background: billing === 'yearly' ? '#ffffff' : 'rgba(255,255,255,0.3)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2,
              left: billing === 'yearly' ? 20 : 2,
              width: 20, height: 20, borderRadius: '50%',
              background: '#1e3669', transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: billing === 'yearly' ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
            Yearly
          </span>
          {billing === 'yearly' && (
            <span style={{
              fontSize: 11, background: 'rgba(255,255,255,0.2)', color: '#ffffff',
              padding: '2px 8px', borderRadius: 10, fontWeight: 700,
            }}>
              Save ~17%
            </span>
          )}
        </div>

        <div style={S.plansGrid} className="plans-grid">
          {displayPlans.map((plan, i) => (
            <div
              key={plan._id || i}
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: plan.isPopular ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                borderRadius: 20, padding: '28px 24px',
                position: 'relative',
                boxShadow: plan.isPopular ? '0 20px 60px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.2)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = plan.isPopular ? '0 30px 80px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = plan.isPopular ? '0 20px 60px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.2)';
              }}
            >
              {plan.isPopular && (
                <div style={{
                  fontSize: 11, background: 'linear-gradient(135deg, #1a6fa8 0%, #1e3669 100%)',
                  color: '#ffffff', padding: '4px 12px', borderRadius: 12,
                  fontWeight: 700, display: 'inline-block', marginBottom: 16,
                  boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
                }}>
                  ⭐ Most Popular
                </div>
              )}
              <p style={{ ...S.planName, color: '#1a1a2e' }}>{plan.name}</p>
              {plan.description && <p style={{ ...S.planDesc, color: '#6b7280' }}>{plan.description}</p>}
              <p style={{ ...S.planPrice, color: '#1a1a2e' }}>
                {fmtINR(billing === 'yearly' ? plan.price?.yearly : plan.price?.monthly)}
                <span style={{ ...S.planPer, color: '#6b7280' }}> /{billing === 'yearly' ? 'year' : 'month'}</span>
              </p>
              <div style={S.featList}>
                {(plan.features_display || []).map((f, fi) => (
                  <div key={fi} style={{ ...S.featRow, color: '#374151' }}>
                    <CheckCircle size={13} color="#1a6fa8" style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  width: '100%', justifyContent: 'center',
                  padding: '14px 24px', fontSize: 15, fontWeight: 600,
                  background: plan.isPopular ? 'linear-gradient(135deg, #1a6fa8 0%, #1e3669 100%)' : 'transparent',
                  border: plan.isPopular ? 'none' : '2px solid #1a6fa8',
                  color: plan.isPopular ? '#ffffff' : '#1a6fa8',
                  borderRadius: 12,
                }}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={{ ...S.section, ...S.sectionAlt }}>
        <div style={S.sectionHead}>
          <h2 style={S.h2}>Get in Touch</h2>
          <p style={S.sectionSub}>Have questions? We're here to help.</p>
        </div>
        <div style={S.contactCard}>
          <form onSubmit={handleSubmit}>
            <div style={S.formGrid} className="form-grid">
              <div style={S.formGroup}>
                <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.name ? 'var(--danger)' : 'var(--border)'}`,
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14,
                  }}
                />
                {errors.name && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div style={S.formGroup}>
                <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@email.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--border)'}`,
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14,
                  }}
                />
                {errors.email && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
              </div>
            </div>
            <div style={S.formGroup}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder="How can we help?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${errors.message ? 'var(--danger)' : 'var(--border)'}`,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              {errors.message && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.message}</div>}
            </div>
            {submitSuccess && (
              <div style={{
                background: 'rgba(16,185,129,0.1)',
                color: 'var(--success)',
                padding: '12px',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 500,
              }}>
                ✓ Message sent successfully! We'll get back to you soon.
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 4,
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#1e3669', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 32px' }}>
          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <img src="/logo_white.png" alt="Ultrakey" style={{ height: 50, objectFit: 'contain', marginBottom: 16 }} />
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, maxWidth: 280 }}>
                Empowering businesses with cutting-edge IT solutions. Reliable, scalable, and secure software products for the modern enterprise.
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.07em' }}>Company</h4>
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Features', href: '#about' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Contact', href: '#contact' },
              ].map(l => (
                <a key={l.label} href={l.href} onClick={scrollTo(l.href.replace('#', ''))}
                  style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >{l.label}</a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.07em' }}>Legal</h4>
              {[
                { label: 'Terms & Conditions', to: '/terms' },
                { label: 'Privacy Policy', to: '/privacy' },
              ].map(l => (
                <Link key={l.label} to={l.to}
                  style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >{l.label}</Link>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.07em' }}>Get in Touch</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <MapPin size={15} style={{ color: '#1a6fa8', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                    Ultrakey IT Solutions Pvt. Ltd.<br/>Hyderabad, Telangana, India – 500001
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <MailIcon size={14} style={{ color: '#1a6fa8', flexShrink: 0 }} />
                  <a href="mailto:support@ultrakey.in" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>support@ultrakey.in</a>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Phone size={14} style={{ color: '#1a6fa8', flexShrink: 0 }} />
                  <a href="tel:+919999999999" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>+91 99999 99999</a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              © {new Date().getFullYear()} <strong style={{ color: '#1a6fa8' }}>Ultrakey IT Solutions Private Limited</strong> — All Rights Reserved.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link to="/terms" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                Terms & Conditions
              </Link>
              <Link to="/privacy" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}