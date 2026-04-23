import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, X, AlertCircle, CreditCard, Clock, TrendingUp, Zap, Users, Ticket, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI, subscriptionAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Modal, Tabs } from '../../components/shared';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── responsive helpers ──────────────────────────────────────────────────── */
const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
};

const fmtINR = (paise) => `₹${Math.floor(paise / 100).toLocaleString('en-IN')}`;

const getTrialDisplay = (trialEnd, trialDaysRemaining, status) => {
  if (!trialEnd || status !== 'trial') return '';
  
  if (trialDaysRemaining <= 0) {
    return `Trial ended ${format(new Date(trialEnd), 'dd MMM yyyy')}`;
  } else if (trialDaysRemaining <= 3) {
    return `Trial ends in ${trialDaysRemaining} days`;
  } else {
    return `Trial ends ${format(new Date(trialEnd), 'dd MMM yyyy')}`;
  }
};

const ALL_FEATURES = [
  { k: 'email_support',            l: 'Email Support' },
  { k: 'priority_support',         l: 'Priority Support' },
  { k: 'advanced_analytics',       l: 'Advanced Analytics' },
  { k: 'agent_performance_report', l: 'Agent Performance Reports' },
  { k: 'ticket_export',            l: 'Ticket Export' },
  { k: 'custom_logo',              l: 'Custom Logo' },
  { k: 'custom_colors',            l: 'Custom Brand Colors' },
  { k: 'custom_subdomain',         l: 'Custom Subdomain' },
  { k: 'white_labeling',           l: 'White Labeling' },
  { k: 'api_access',               l: 'API Access' },
  { k: 'sla_management',           l: 'SLA Management' },
  { k: 'multi_language',           l: 'Multi-Language' },
];

/* ─── inline responsive styles injected once ─────────────────────────────── */
const RESPONSIVE_CSS = `
  @media (max-width: 639px) {
    .sub-page-header h1 { font-size: 20px !important; }
    .sub-page-header p  { font-size: 13px !important; }

    .sub-expiry-banner  { padding: 12px 14px !important; gap: 10px !important; }
    .sub-expiry-title   { font-size: 14px !important; }
    .sub-expiry-desc    { font-size: 12px !important; }

    .sub-current-card        { padding: 16px !important; }
    .sub-current-inner       { gap: 12px !important; }
    .sub-current-icon        { width: 48px !important; height: 48px !important; }
    .sub-current-plan-name   { font-size: 17px !important; }
    .sub-current-meta        { font-size: 13px !important; gap: 10px !important; flex-direction: column !important; }
    .sub-current-price-box   { padding: 10px 14px !important; text-align: left !important; }
    .sub-current-price-num   { font-size: 24px !important; }

    .sub-billing-toggle      { font-size: 13px !important; }

    .sub-plans-grid          { grid-template-columns: 1fr !important; gap: 16px !important; }
    .sub-plan-card           { padding: 18px !important; }
    .sub-plan-name           { font-size: 18px !important; }
    .sub-plan-price-num      { font-size: 26px !important; }
    .sub-plan-limits-grid    { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
    .sub-plan-limit-val      { font-size: 15px !important; }
    .sub-plan-limit-lbl      { font-size: 10px !important; }
    .sub-plan-features-grid  { grid-template-columns: 1fr !important; }
    .sub-plan-feature-item   { font-size: 12px !important; }

    .sub-demo-note           { padding: 12px !important; }
    .sub-demo-title          { font-size: 13px !important; }
    .sub-demo-desc           { font-size: 12px !important; }

    .sub-compare-th-name     { font-size: 13px !important; }
    .sub-compare-th-price    { font-size: 12px !important; }
    .sub-compare-td          { font-size: 13px !important; padding: 12px 12px !important; }
    .sub-compare-feat-td     { font-size: 12px !important; padding: 10px 12px !important; }

    .sub-status-grid         { grid-template-columns: 1fr !important; gap: 16px !important; }
    .sub-status-card         { padding: 16px !important; }
    .sub-status-card h3      { font-size: 15px !important; }
    .sub-status-row          { padding: 10px 12px !important; font-size: 13px !important; }
    .sub-status-row-val      { font-size: 13px !important; }
    .sub-usage-label         { font-size: 13px !important; }
    .sub-usage-value         { font-size: 14px !important; }

    .sub-history-table th    { font-size: 12px !important; padding: 10px 10px !important; }
    .sub-history-table td    { font-size: 12px !important; padding: 12px 10px !important; }
    .sub-history-empty       { padding: 60px 24px !important; }
    .sub-history-empty-title { font-size: 16px !important; }
    .sub-history-empty-desc  { font-size: 13px !important; }

    .sub-tabs-scroll         { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  }

  @media (min-width: 640px) and (max-width: 1023px) {
    .sub-plans-grid   { grid-template-columns: repeat(2, 1fr) !important; }
    .sub-status-grid  { grid-template-columns: 1fr !important; }
  }

  .sub-tabs-scroll::-webkit-scrollbar { display: none; }
`;

export default function CompanySubscription() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug    = companySlug || user?.company?.slug;
  const mobile  = useIsMobile();

  const [plans, setPlans]       = useState([]);
  const [current, setCurrent]   = useState(null);
  const [history, setHistory]   = useState([]);
  const [billing, setBilling]   = useState('monthly');
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(null);
  const [razorKey, setRazorKey] = useState('');
  const [tab, setTab]           = useState('plans');

  /* inject responsive CSS once */
  useEffect(() => {
    const id = 'company-sub-responsive';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = RESPONSIVE_CSS;
      document.head.appendChild(el);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [p, s, k] = await Promise.all([
        subscriptionAPI.getPlans(),
        paymentAPI.getStatus(slug),
        paymentAPI.getKey(),
      ]);
      setPlans(p.data.data || []);
      setCurrent(s.data.data);
      setRazorKey(k.data.key);
      paymentAPI.getHistory(slug).then(h => setHistory(h.data.data || [])).catch(() => {});
    } catch {
      toast.error('Failed to load subscription data.');
    } finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { loadData(); }, [loadData]);

  /* Load Razorpay checkout.js dynamically */
  const loadRazorpayScript = () => new Promise(res => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });

  const handleSubscribe = async (plan) => {
    setPaying(plan._id);
    try {
      // Step 1: Create Razorpay order in backend
      const orderRes = await paymentAPI.createOrder(slug, { planId: plan._id, billingCycle: billing });
      const order    = orderRes.data.data;

      /* ── DEMO MODE (no Razorpay keys configured) ── */
      if (order.isDemoMode) {
        const tid = toast.loading('Processing demo payment… (add RAZORPAY keys for real payments)');
        await new Promise(r => setTimeout(r, 1800));
        try {
          const vr = await paymentAPI.verify(slug, {
            txId:                order.txId,
            razorpay_order_id:   order.orderId,
            razorpay_payment_id: `pay_DEMO_${Date.now()}`,
            planId:              plan._id,
            billingCycle:        billing,
          });
          toast.success(vr.data.message, { id: tid });
          await loadData();
          setTab('status');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Demo payment failed.', { id: tid });
        }
        setPaying(null);
        return;
      }

      /* ── REAL RAZORPAY PAYMENT ── */
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load Razorpay. Check your internet connection.');
        setPaying(null);
        return;
      }

      const options = {
        key:         razorKey,
        amount:      order.amount,
        currency:    'INR',
        name:        'TicketFlow',
        description: `${plan.name} Plan — ${billing}`,
        order_id:    order.orderId,
        prefill:     { name: user?.name || '', email: user?.email || '' },
        theme:       { color: '#1a6fa8' },
        modal: {
          ondismiss: () => {
            setPaying(null);
            toast.error('Payment cancelled. No subscription was activated.');
          },
        },
        handler: async (response) => {
          // Step 2: Verify payment signature on backend — ONLY then activate
          setPaying(plan._id);
          try {
            const vr = await paymentAPI.verify(slug, {
              txId:                order.txId,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId:              plan._id,
              billingCycle:        billing,
            });
            toast.success(vr.data.message || `✅ ${plan.name} plan activated!`);
            await loadData();
            setTab('status');
          } catch (err) {
            toast.error(err.response?.data?.message || '❌ Payment verification failed. Contact support if money was deducted.');
          } finally {
            setPaying(null);
          }
        },
      };

      new window.Razorpay(options).open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment. Try again.');
      setPaying(null);
    }
  };

  if (loading) return <div className="loading-overlay" style={{ minHeight: '60vh' }}><Spinner size={28} /></div>;

  const currentPlanId = current?.plan?._id;
  const isExpired     = current?.status === 'expired';
  const isTrial       = current?.status === 'trial';

  const tabList = [
    { value: 'plans',   label: 'Plans & Pricing' },
    { value: 'compare', label: 'Compare' },
    { value: 'status',  label: 'Details' },
    { value: 'history', label: 'History' },
  ];

  return (
    <div className="fade-in">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="page-header sub-page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 26 }}>Subscription & Billing</h1>
          <p style={{ fontSize: 14 }}>Manage your plan and payment history</p>
        </div>
      </div>

      {/* ── Expiry banner ──────────────────────────────────────────────── */}
      {isExpired && (
        <div className="sub-expiry-banner" style={{
          display: 'flex', gap: 16, padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))',
          border: '2px solid rgba(239,68,68,0.3)', borderRadius: 16, marginBottom: 24,
        }}>
          <AlertCircle size={mobile ? 24 : 32} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="sub-expiry-title" style={{ fontWeight: 700, color: '#ef4444', fontSize: 16 }}>Subscription Expired</div>
            <div className="sub-expiry-desc" style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
              Some features may be restricted. Renew your plan to restore full access.
            </div>
          </div>
        </div>
      )}

      {/* ── Current plan card ──────────────────────────────────────────── */}
      {current?.plan && (
        <div className={`card sub-current-card ${isTrial ? 'trial-card' : isExpired ? 'expired-card' : ''}`} style={{
          marginBottom: 24, padding: 24,
          background: isExpired 
            ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
            : isTrial 
            ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))'
            : 'linear-gradient(135deg, rgba(26,111,168,0.1), rgba(139,92,246,0.05))',
          border: isExpired 
            ? '2px solid rgba(239,68,68,0.25)'
            : isTrial 
            ? '2px solid rgba(245,158,11,0.25)'
            : '2px solid rgba(26,111,168,0.25)',
          borderRadius: 16,
        }}>
          <div className="sub-current-inner" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="sub-current-icon" style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(26,111,168,0.2), rgba(139,92,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(26,111,168,0.2)',
            }}>
              <CreditCard size={mobile ? 24 : 32} color="#1a6fa8" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className="sub-current-plan-name" style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                  {current.plan.name} Plan
                </span>
                <span className={`badge badge-${current.status}`} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px' }}>{current.status}</span>
                {isTrial && <span className="badge badge-trial" style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px' }}>Trial</span>}
              </div>
              <div className="sub-current-meta" style={{ fontSize: 14, color: 'var(--muted)', display: 'flex', gap: 16, flexWrap: 'wrap', fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} style={{ color: '#1a6fa8' }} /> {current.billingCycle} billing</span>
                {current.expiry && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} style={{ color: isTrial ? '#f59e0b' : 'var(--muted)' }} />
                  {isTrial ? getTrialDisplay(current.trialEnd, current.trialDaysRemaining, current.status) : `${isExpired ? 'Expired' : 'Renews'} ${format(new Date(current.expiry), 'dd MMM yyyy')}`}
                </span>}
                {current.usage && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ticket size={14} style={{ color: '#f59e0b' }} /> {current.usage.ticketsThisMonth || 0}/{current.plan.limits?.max_tickets_per_month} tickets</span>}
              </div>
            </div>

            <div className="sub-current-price-box" style={{ textAlign: 'right', background: 'rgba(26,111,168,0.08)', padding: '14px 18px', borderRadius: 12, flexShrink: 0 }}>
              <div className="sub-current-price-num" style={{ fontFamily: 'var(--font-h)', fontSize: 30, fontWeight: 800, color: '#1a6fa8' }}>
                {fmtINR(billing === 'yearly' ? current.plan.price?.yearly : current.plan.price?.monthly)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>/{billing}</div>
            </div>
          </div>

          {current.plan.limits && current.usage && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(26,111,168,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
                <Ticket size={14} style={{ color: '#f59e0b' }} />
                Ticket usage: {current.usage.ticketsThisMonth || 0} / {current.plan.limits.max_tickets_per_month?.toLocaleString()}
              </div>
              <div className="progress-bar" style={{ height: 8, borderRadius: 6 }}>
                <div className="progress-fill" style={{
                  width: `${Math.min(100, ((current.usage.ticketsThisMonth || 0) / current.plan.limits.max_tickets_per_month) * 100)}%`,
                  height: '100%',
                  background: (current.usage.ticketsThisMonth || 0) > current.plan.limits.max_tickets_per_month * 0.9 ? '#ef4444' : '#1a6fa8',
                  borderRadius: 6,
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs (horizontal scroll on mobile) ────────────────────────── */}
      <div className="sub-tabs-scroll">
        <Tabs tabs={tabList} active={tab} onChange={setTab} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: Plans
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'plans' && (
        <>
          {/* billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="sub-billing-toggle" style={{ fontSize: 15, fontWeight: 600, color: billing === 'monthly' ? 'var(--text)' : 'var(--muted)' }}>Monthly</span>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
              style={{ width: 48, height: 28, borderRadius: 14, background: billing === 'yearly' ? '#1a6fa8' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 4, left: billing === 'yearly' ? 22 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }} />
            </button>
            <span className="sub-billing-toggle" style={{ fontSize: 15, fontWeight: 600, color: billing === 'yearly' ? 'var(--text)' : 'var(--muted)' }}>Yearly</span>
            {billing === 'yearly' && (
              <span style={{ fontSize: 12, background: 'rgba(16,185,129,.1)', color: '#10b981', padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>Save ~17%</span>
            )}
          </div>

          {/* plan cards */}
          <div className="sub-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {plans.map(plan => {
              const isCurrent = currentPlanId === plan._id;
              const price     = billing === 'yearly' ? plan.price?.yearly : plan.price?.monthly;
              const isUpgrade = current?.plan && plan.price?.monthly > current?.plan?.price?.monthly && !isCurrent;

              return (
                <div key={plan._id} className="sub-plan-card" style={{
                  border: plan.isPopular ? '2px solid #1a6fa8' : isCurrent ? '2px solid #10b981' : '1px solid var(--border)',
                  borderRadius: 16, padding: 24,
                  background: plan.isPopular ? 'linear-gradient(135deg, rgba(26,111,168,0.03) 0%, rgba(26,111,168,0.01) 100%)' : 'var(--surface)',
                  position: 'relative', transition: 'all 0.3s ease',
                }}>
                  {plan.isPopular && !isCurrent && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #1a6fa8, #8b5cf6)', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(26,111,168,0.3)', whiteSpace: 'nowrap' }}>⭐ Most Popular</div>
                  )}
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}>✓ Current Plan</div>
                  )}

                  <h3 className="sub-plan-name" style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>{plan.name}</h3>
                  {plan.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>{plan.description}</div>}

                  <div style={{ marginBottom: 18, marginTop: 18, padding: '14px', background: 'linear-gradient(135deg, rgba(26,111,168,0.08), rgba(139,92,246,0.08))', borderRadius: 12, border: '1px solid rgba(26,111,168,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span className="sub-plan-price-num" style={{ fontFamily: 'var(--font-h)', fontSize: 32, fontWeight: 800, color: '#1a6fa8' }}>{fmtINR(price)}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>/month</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>{fmtINR(plan.price?.yearly)}/year</div>
                  </div>

                  {/* limits row */}
                  <div className="sub-plan-limits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                    {[
                      { icon: <Users size={18} style={{ color: '#1a6fa8' }} />, val: plan.limits?.max_agents, lbl: 'Agents' },
                      { icon: <Ticket size={18} style={{ color: '#f59e0b' }} />, val: plan.limits?.max_tickets_per_month?.toLocaleString(), lbl: 'Tickets/Mo' },
                      { icon: <Database size={18} style={{ color: '#10b981' }} />, val: plan.limits?.storage_limit_gb, lbl: 'GB Storage' },
                    ].map(({ icon, val, lbl }) => (
                      <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 6px', background: 'var(--surface2)', borderRadius: 10, textAlign: 'center' }}>
                        {icon}
                        <span className="sub-plan-limit-val" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{val}</span>
                        <span className="sub-plan-limit-lbl" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{lbl}</span>
                      </div>
                    ))}
                  </div>

                  {/* features */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Included Features</div>
                    <div className="sub-plan-features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(plan.features_display || []).slice(0, 6).map((f, i) => (
                        <div key={i} className="sub-plan-feature-item" style={{ display: 'flex', gap: 6, fontSize: 12, alignItems: 'center', fontWeight: 500 }}>
                          <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0 }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isCurrent ? (
                    <button className="btn btn-success btn-sm" style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 14 }} disabled>✓ Current Plan</button>
                  ) : (
                    <button className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 14 }}
                      disabled={paying === plan._id} onClick={() => handleSubscribe(plan)}>
                      {paying === plan._id
                        ? <><Spinner size={13} /> Processing…</>
                        : isUpgrade ? `⬆ Upgrade — ${fmtINR(price)}` : `Subscribe — ${fmtINR(price)}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* demo notice */}
          <div className="card sub-demo-note" style={{ marginTop: 24, padding: 16, background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <div>
                <div className="sub-demo-title" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--text)' }}>Demo Mode Active</div>
                <div className="sub-demo-desc" style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                  Payments are in demo mode — no real charge. Add{' '}
                  <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>RAZORPAY_KEY_ID</code> and{' '}
                  <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>RAZORPAY_KEY_SECRET</code> in <code style={{ fontSize: 12 }}>.env</code> for live payments.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: Compare (horizontal scroll on mobile)
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'compare' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Compare Features</h3>
            </div>
          </div>
          {/* scroll wrapper so table doesn't break layout on mobile */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ minWidth: mobile ? 480 : 'auto', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '35%', fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: 'var(--text)', padding: '14px 16px', textAlign: 'left' }}>Feature</th>
                  {plans.map(p => (
                    <th key={p._id} style={{ textAlign: 'center', padding: '14px 16px' }}>
                      <div className="sub-compare-th-name" style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{p.name}</div>
                      <div className="sub-compare-th-price" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginTop: 3 }}>{fmtINR(p.price?.monthly)}/mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'var(--surface2)' }}>
                  <td colSpan={plans.length + 1} style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', padding: '10px 16px' }}>Limits</td>
                </tr>
                {[
                  { l: 'Max Agents',    icon: <Users size={14} style={{ color: '#1a6fa8' }} />, k: p => p.limits?.max_agents === 999 ? 'Unlimited' : p.limits?.max_agents },
                  { l: 'Tickets/Month', icon: <Ticket size={14} style={{ color: '#f59e0b' }} />, k: p => p.limits?.max_tickets_per_month === 999999 ? 'Unlimited' : p.limits?.max_tickets_per_month?.toLocaleString() },
                  { l: 'Storage',       icon: <Database size={14} style={{ color: '#10b981' }} />, k: p => `${p.limits?.storage_limit_gb} GB` },
                ].map(row => (
                  <tr key={row.l}>
                    <td className="sub-compare-td" style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', padding: '14px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{row.icon} {row.l}</span>
                    </td>
                    {plans.map(p => <td key={p._id} className="sub-compare-td" style={{ textAlign: 'center', color: '#1a6fa8', fontWeight: 700, fontSize: 14, padding: '14px 16px' }}>{row.k(p)}</td>)}
                  </tr>
                ))}
                <tr style={{ background: 'var(--surface2)' }}>
                  <td colSpan={plans.length + 1} style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', padding: '10px 16px' }}>Features</td>
                </tr>
                {ALL_FEATURES.map(f => (
                  <tr key={f.k}>
                    <td className="sub-compare-feat-td" style={{ fontSize: 13, color: 'var(--text)', padding: '12px 16px' }}>{f.l}</td>
                    {plans.map(p => (
                      <td key={p._id} style={{ textAlign: 'center', padding: '12px 16px' }}>
                        {p.features?.[f.k] ? <CheckCircle size={18} color="#10b981" /> : <X size={18} color="var(--muted)" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: Status
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'status' && current && (
        <div className="sub-status-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* subscription details */}
          <div className="card sub-status-card" style={{ padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={20} style={{ color: '#1a6fa8' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Subscription Details</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Plan',         value: current.plan?.name || '—' },
                { label: 'Status',       value: <span className={`badge badge-${current.status}`} style={{ fontSize: 12, fontWeight: 600 }}>{current.status}</span> },
                { label: 'Billing',      value: <span style={{ textTransform: 'capitalize' }}>{current.billingCycle}</span> },
                { label: 'Expiry',       value: current.expiry ? format(new Date(current.expiry), 'dd MMM yyyy') : '—' },
                { label: 'Last Payment', value: current.lastPayment ? formatDistanceToNow(new Date(current.lastPayment), { addSuffix: true }) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="sub-status-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--surface2)', borderRadius: 10, gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
                  <span className="sub-status-row-val" style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* usage */}
          <div className="card sub-status-card" style={{ padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={20} style={{ color: '#10b981' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Usage This Month</h3>
            </div>
            {current.plan?.limits && current.usage ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {[
                  { l: 'Tickets',      used: current.usage.ticketsThisMonth || 0,               limit: current.plan.limits.max_tickets_per_month,            icon: <Ticket size={18} style={{ color: '#f59e0b' }} /> },
                  { l: 'Storage (MB)', used: Math.round(current.usage.storageUsedMb || 0),       limit: (current.plan.limits.storage_limit_gb || 1) * 1024,    icon: <Database size={18} style={{ color: '#1a6fa8' }} /> },
                ].map(u => (
                  <div key={u.l}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                      <span className="sub-usage-label" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{u.icon} {u.l}</span>
                      <span className="sub-usage-value" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{u.used?.toLocaleString()} / {u.limit === 999999 ? '∞' : u.limit?.toLocaleString()}</span>
                    </div>
                    {u.limit !== 999999 && (
                      <div className="progress-bar" style={{ height: 8, borderRadius: 6, background: 'var(--surface2)' }}>
                        <div className="progress-fill" style={{
                          width: `${Math.min(100, (u.used / u.limit) * 100)}%`, height: '100%',
                          background: u.used / u.limit > 0.9 ? '#ef4444' : u.used / u.limit > 0.7 ? '#f59e0b' : '#10b981',
                          borderRadius: 6,
                        }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--muted)', fontSize: 14 }}>Usage data unavailable</p>}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: History
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(26,111,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} style={{ color: '#1a6fa8' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Payment History</h3>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="sub-history-empty" style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(26,111,168,0.05)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={36} style={{ color: '#1a6fa8', opacity: 0.4 }} />
              </div>
              <div className="sub-history-empty-title" style={{ fontFamily: 'var(--font-h)', fontWeight: 700, marginBottom: 8, fontSize: 18, color: 'var(--text)' }}>No payments yet</div>
              <div className="sub-history-empty-desc" style={{ fontSize: 14 }}>Payment history will appear here after your first subscription.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="sub-history-table" style={{ minWidth: mobile ? 520 : 'auto', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Plan', 'Billing', 'Amount', 'Type', 'Status'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(tx => (
                    <tr key={tx._id}>
                      <td style={{ fontSize: 13, color: 'var(--text)', padding: '15px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>{format(new Date(tx.createdAt), 'dd MMM yyyy')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text)', padding: '15px 16px', fontSize: 13 }}>{tx.planName || tx.plan?.name}</td>
                      <td style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize', padding: '15px 16px' }}>{tx.billingCycle}</td>
                      <td style={{ fontFamily: 'var(--font-h)', fontWeight: 700, color: '#1a6fa8', padding: '15px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>{tx.amountFormatted || fmtINR(tx.amount)}</td>
                      <td style={{ padding: '15px 16px' }}><span className="badge" style={{ background: 'rgba(26,111,168,.1)', color: '#1a6fa8', fontWeight: 600, fontSize: 11 }}>{tx.changeType || 'payment'}</span></td>
                      <td style={{ padding: '15px 16px' }}><span className={`badge badge-${tx.status === 'paid' ? 'approved' : tx.status === 'failed' ? 'rejected' : 'pending'}`} style={{ fontSize: 11, fontWeight: 600 }}>{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}