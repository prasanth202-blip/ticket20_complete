import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, CheckCircle2, Ticket, Star, AlertCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ticketAPI, ratingAPI } from '../../api';
import { StatCard, StatusBadge, PriorityBadge, Spinner, StarDisplay, Avatar } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS = { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' };

export default function AgentDashboard() {
  const { companySlug } = useParams();
  const { user }        = useAuth();
  const slug = companySlug || user?.company?.slug;

  const [tickets, setTickets]     = useState([]);
  const [ratings, setRatings]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!slug || !user?._id) return;
    setLoading(true);
    Promise.all([
      ticketAPI.getTickets(slug, { limit:50 }),
      ratingAPI.getAgentRatings(slug, user._id).catch(() => ({ data:{ data:[] } })),
    ]).then(([t, r]) => {
      setTickets(t.data.data || []);
      setRatings(r.data.data || []);
      setError('');
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    }).finally(() => setLoading(false));
  }, [slug, user?._id]);

  if (loading) return <div className="loading-overlay" style={{ minHeight:'60vh' }}><Spinner size={28}/></div>;

  if (error) return (
    <div style={{ padding:32, textAlign:'center' }}>
      <AlertCircle size={32} color="var(--danger)" style={{ margin:'0 auto 12px', display:'block' }}/>
      <p style={{ color:'var(--muted)', fontSize:14 }}>{error}</p>
    </div>
  );

  const assigned   = tickets.filter(t=>t.status==='assigned');
  const inProgress = tickets.filter(t=>t.status==='in_progress');
  const resolved   = tickets.filter(t=>['resolved','closed'].includes(t.status));
  const avgRating  = ratings.length ? (ratings.reduce((s,r)=>s+r.score,0)/ratings.length).toFixed(1) : null;

  const byPriority = ['low','medium','high','critical']
    .map(p => ({ name:p, value:tickets.filter(t=>t.priority===p).length, fill:PRIORITY_COLORS[p] }))
    .filter(d=>d.value>0);

  const urgentOpen = tickets.filter(t=>['high','critical'].includes(t.priority)&&['assigned','in_progress'].includes(t.status));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Here's your current workload and performance</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom:20 }}>
        <StatCard label="Assigned"    value={assigned.length}   icon={<Clock size={18}/>}           color="#d97706" sub="awaiting action"/>
        <StatCard label="In Progress" value={inProgress.length} icon={<Ticket size={18}/>}           color="var(--primary)" sub="actively working"/>
        <StatCard label="Resolved"    value={resolved.length}   icon={<CheckCircle2 size={18}/>}     color="var(--success)" sub="all time"/>
        <StatCard label="Avg Rating"  value={avgRating?`${avgRating} ★`:'—'} icon={<Star size={18}/>} color="var(--accent)" sub={`${ratings.length} total ratings`}/>
      </div>

      {urgentOpen.length > 0 && (
        <div className="card" style={{ marginBottom:16, border:'1.5px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.02)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:14, color:'var(--danger)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <AlertCircle size={16}/> Urgent Tickets ({urgentOpen.length})
          </h3>
          {urgentOpen.slice(0,4).map(t=>(
            <Link key={t._id} to={`/${slug}/agent/tickets/${t._id}`}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:'1px solid var(--border)', textDecoration:'none', color:'inherit' }}>
              <PriorityBadge priority={t.priority}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1 }}>{t.ticketNumber} · {formatDistanceToNow(new Date(t.createdAt),{addSuffix:true})}</div>
              </div>
              <StatusBadge status={t.status}/>
              <ArrowRight size={14} color="var(--primary)"/>
            </Link>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {byPriority.length > 0 && (
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:14, fontSize:14 }}>My Tickets by Priority</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={byPriority}>
                <XAxis dataKey="name" tick={{ fontSize:12, fill:'var(--muted)' }}/>
                <YAxis tick={{ fontSize:11, fill:'var(--muted)' }} width={25}/>
                <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {byPriority.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:12, fontSize:14 }}>Recent Customer Feedback</h3>
          {ratings.length===0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:13 }}>
              <Star size={24} style={{ margin:'0 auto 8px', display:'block', opacity:.3 }}/>
              No ratings yet
            </div>
          ) : ratings.slice(0,4).map(r=>(
            <div key={r._id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <StarDisplay score={r.score} size={13}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{r.ticket?.ticketNumber} · {r.ratedBy?.name}</div>
                {r.feedback && <div style={{ fontSize:13, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.feedback}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:14 }}>Recent Tickets</h3>
          <Link to={`/${slug}/agent/tickets`} className="btn btn-ghost btn-sm" style={{ fontSize:12.5 }}>View all →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket</th><th>Customer</th><th>Priority</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {tickets.length===0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>No tickets assigned yet</td></tr>
              ) : tickets.slice(0,8).map(t=>(
                <tr key={t._id} style={{ cursor:'pointer' }} onClick={()=>window.location.href=`/${slug}/agent/tickets/${t._id}`}>
                  <td>
                    <div style={{ fontWeight:700, fontSize:12, color:'var(--primary)' }}>{t.ticketNumber}</div>
                    <div style={{ fontSize:12.5, color:'var(--text2)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Avatar name={t.createdBy?.name||'?'} size={26}/>
                      <div>
                        <div style={{ fontSize:13 }}>{t.createdBy?.name}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>{t.createdBy?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><PriorityBadge priority={t.priority}/></td>
                  <td><StatusBadge status={t.status}/></td>
                  <td style={{ fontSize:12, color:'var(--muted)' }}>{formatDistanceToNow(new Date(t.updatedAt||t.createdAt),{addSuffix:true})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
