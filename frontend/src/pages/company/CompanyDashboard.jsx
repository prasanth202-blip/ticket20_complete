import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ticket, Users, UserCog, Star, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { companyAPI, paymentAPI } from '../../api';
import { StatCard, StatusBadge, PriorityBadge, Spinner, Avatar } from '../../components/shared';
import PaymentModal from '../../components/shared/PaymentModal';
import SubscriptionBanner from '../../components/shared/SubscriptionBanner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_COLORS = { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' };
const STATUS_COLORS   = { open:'#3b82f6', assigned:'#a855f7', in_progress:'#f59e0b', resolved:'#10b981', closed:'#6b7280', reopened:'#ef4444' };

export default function CompanyDashboard() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    Promise.all([
      companyAPI.getDashboard(slug),
      paymentAPI.getStatus(slug)
    ]).then(([dashboardRes, subscriptionRes]) => {
      setData(dashboardRes.data.data);
      setSubscription(subscriptionRes.data.data);
    }).catch(() => {
      // Still load dashboard even if subscription fails
      companyAPI.getDashboard(slug).then(r => setData(r.data.data));
    }).finally(() => setLoading(false));
  }, [slug]);

  // Auto-show payment modal for expired trials
  useEffect(() => {
    if (subscription && 
        (subscription.status === 'expired' || 
         (subscription.status === 'trial' && subscription.trialDaysRemaining <= 0)) &&
        !dismissedBanner) {
      // Don't auto-show immediately, let user see the banner first
      const timer = setTimeout(() => {
        setShowPaymentModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [subscription, dismissedBanner]);

  if (loading) return <div className="loading-overlay"><Spinner size={32}/></div>;
  if (!data)   return null;

  const { tickets, totalAgents, totalUsers, avgRating, recentTickets, byPriority, dailyTickets } = data;

  const statusPieData = [
    { name:'Open',       value: tickets.open,       fill: STATUS_COLORS.open },
    { name:'In Progress',value: tickets.inProgress,  fill: STATUS_COLORS.in_progress },
    { name:'Resolved',   value: tickets.resolved,    fill: STATUS_COLORS.resolved },
    { name:'Closed',     value: tickets.closed,      fill: STATUS_COLORS.closed },
  ].filter(d => d.value > 0);

  const priorityBarData = (byPriority||[]).map(d => ({
    name: d._id, value: d.count, fill: PRIORITY_COLORS[d._id] || '#6b7280',
  }));

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return <div className="custom-tooltip">{payload.map((p,i) => <div key={i} style={{ color:p.fill||p.color }}>{p.name||p.dataKey}: <b>{p.value}</b></div>)}</div>;
  };

  return (
    <div className="fade-in">
      {/* Subscription Banner */}
      {subscription && !dismissedBanner && (
        <SubscriptionBanner
          status={subscription.status}
          trialEnd={subscription.trialEnd}
          trialDaysRemaining={subscription.trialDaysRemaining}
          plan={subscription.plan}
          onPaymentClick={() => setShowPaymentModal(true)}
          onDismiss={() => setDismissedBanner(true)}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Support operations overview for {user?.company?.name}</p>
        </div>
        <Link to={`/${slug}/tickets/new`} className="btn btn-primary btn-sm"><Plus size={14}/> New Ticket</Link>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Tickets"   value={tickets.total}       icon={<Ticket size={18}/>}        color="#3b82f6" sub={`${tickets.open} open`}/>
        <StatCard label="In Progress"     value={tickets.inProgress}  icon={<Clock size={18}/>}          color="#f59e0b"/>
        <StatCard label="Resolved"        value={tickets.resolved}    icon={<CheckCircle size={18}/>}   color="#10b981"/>
        <StatCard label="Open"            value={tickets.open}        icon={<AlertCircle size={18}/>}    color="#ef4444"/>
        <StatCard label="Agents"          value={totalAgents}         icon={<UserCog size={18}/>}        color="#ec4899"/>
        <StatCard label="Customers"       value={totalUsers}          icon={<Users size={18}/>}          color="#a855f7"/>
        <StatCard label="Avg Rating"      value={avgRating > 0 ? `${avgRating}★` : '—'} icon={<Star size={18}/>} color="#f59e0b"/>
        <StatCard label="Closed"          value={tickets.closed}      icon={<CheckCircle size={18}/>}   color="#6b7280"/>
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <style>{`
          @media (max-width: 768px) {
            .charts-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:16, fontSize:16, color:'var(--text)' }}>Daily Tickets (7 Days)</h3>
          {dailyTickets?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyTickets}>
                <XAxis dataKey="_id" tick={{ fontSize:12 }} tickFormatter={v => v?.slice(5)} stroke="var(--muted)" strokeWidth={0}/>
                <YAxis tick={{ fontSize:12 }} width={30} stroke="var(--muted)" strokeWidth={0}/>
                <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Bar dataKey="count" fill="#3b82f6" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'var(--muted)', padding:'50px 0', fontSize:13 }}>No data yet</div>}
        </div>

        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:16, fontSize:16, color:'var(--text)' }}>Status Distribution</h3>
          {statusPieData.length > 0 ? (
            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {statusPieData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1 }}>
                {statusPieData.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:13 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:d.fill, flexShrink:0 }}/>
                    <span style={{ flex:1, color:'var(--text)' }}>{d.name}</span>
                    <strong style={{ color:'var(--text)' }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ textAlign:'center', color:'var(--muted)', padding:'50px 0', fontSize:13 }}>No data yet</div>}
        </div>
      </div>

      {/* Priority bar */}
      {priorityBarData.length > 0 && (
        <div className="card" style={{ padding:20, marginBottom:24 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:16, fontSize:16, color:'var(--text)' }}>Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={priorityBarData} layout="vertical">
              <XAxis type="number" tick={{ fontSize:12 }} stroke="var(--muted)" strokeWidth={0}/>
              <YAxis dataKey="name" type="category" tick={{ fontSize:12 }} width={70} stroke="var(--muted)" strokeWidth={0}/>
              <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              <Bar dataKey="value" radius={[0,5,5,0]}>
                {priorityBarData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent tickets */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:20, borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Recent Tickets</h3>
          <Link to={`/${slug}/tickets`} className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket #</th><th>Title</th><th>Customer</th><th>Priority</th><th>Status</th><th>Agent</th><th>Created</th></tr></thead>
            <tbody>
              {!recentTickets?.length ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>No tickets yet</td></tr>
              ) : recentTickets.map(t => (
                <tr key={t._id} style={{ cursor:'pointer' }} onClick={() => window.location.href=`/${slug}/tickets/${t._id}`}>
                  <td><span style={{ fontSize:12, fontWeight:700, color:'var(--primary)' }}>{t.ticketNumber}</span></td>
                  <td style={{ fontSize:13, maxWidth:220 }}>{t.title?.slice(0,50)}{t.title?.length > 50 ? '…' : ''}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar name={t.createdBy?.name||'?'} size={28}/>
                      <span style={{ fontSize:13 }}>{t.createdBy?.name}</span>
                    </div>
                  </td>
                  <td><PriorityBadge priority={t.priority}/></td>
                  <td><StatusBadge status={t.status}/></td>
                  <td style={{ fontSize:13 }}>{t.assignedTo?.name || <span style={{ color:'var(--muted)' }}>—</span>}</td>
                  <td style={{ fontSize:12, color:'var(--muted)' }}>{formatDistanceToNow(new Date(t.createdAt), { addSuffix:true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && subscription?.plan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={subscription.plan}
          billingCycle={subscription.billingCycle || 'monthly'}
          forceShow={subscription.status === 'expired' || (subscription.status === 'trial' && subscription.trialDaysRemaining <= 0)}
          message={subscription.status === 'expired' 
            ? 'Your subscription has expired. Complete payment to continue using all features.'
            : subscription.status === 'trial' && subscription.trialDaysRemaining <= 0
            ? 'Your trial has ended. Complete payment to activate your subscription.'
            : null
          }
        />
      )}
    </div>
  );
}
