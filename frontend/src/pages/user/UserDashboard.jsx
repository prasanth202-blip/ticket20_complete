import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Ticket, Clock, CheckCircle2, AlertCircle, Star, ArrowRight, Briefcase, Mail, HeadphonesIcon, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI, serviceAPI, ratingAPI, ticketAPI } from '../../api';
import { StatCard, StatusBadge, Spinner, Modal, useTicket } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// ── Star Rating inline ────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
          <Star size={size} fill={(hover||value) >= star ? '#f59e0b' : 'none'}
            color={(hover||value) >= star ? '#f59e0b' : 'var(--border)'}
            style={{ transition:'all 0.15s' }}/>
        </button>
      ))}
    </div>
  );
}

function RatingModal({ ticket, slug, onClose, onRated }) {
  const [score, setScore]       = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving]     = useState(false);
  const labels = ['','Poor','Fair','Good','Very Good','Excellent'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score) { toast.error('Please select a rating.'); return; }
    setSaving(true);
    try {
      await ratingAPI.createRating(slug, ticket._id, { score, feedback });
      toast.success('Thank you for your rating!');
      onRated(ticket._id);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not submit rating.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Rate Your Support Experience" onClose={onClose} size="sm">
      <div style={{ padding:'0 4px' }}>
        <div style={{ marginBottom:16, padding:14, background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{ticket.title}</div>
          <div style={{ fontSize:12, color:'var(--primary)', fontWeight:500, marginTop:3 }}>{ticket.ticketNumber}</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:10 }}>How was your experience?</div>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
              <StarRating value={score} onChange={setScore} size={34}/>
            </div>
            {score > 0 && <div style={{ fontSize:14, fontWeight:700, color:'#f59e0b' }}>{labels[score]}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Feedback (optional)</label>
            <textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Tell us about your experience…" maxLength={1000}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving||!score} style={{ flex:2 }}>
              {saving ? <><Spinner size={13}/> Submitting…</> : '⭐ Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default function UserDashboard() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const ticketContext = useTicket();

  const [data, setData]         = useState(null);
  const [services, setServices] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [ratingTicket, setRatingTicket] = useState(null);

  useEffect(() => { sessionStorage.setItem('companySlug', slug); }, [slug]);

  useEffect(() => {
    Promise.all([
      userAPI.getUserDashboard(slug),
      serviceAPI.getPublic(slug).catch(() => ({ data: { data: [] } })),
      ticketAPI.getTickets(slug, { limit: 8, page: 1 }).catch(() => ({ data: { data: [] } })),
    ]).then(([d, s, t]) => {
      setData(d.data.data);
      setServices(s.data.data || []);
      setRecentTickets(t.data.data || []);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleRated = (ticketId) => {
    setRecentTickets(prev => prev.map(t => t._id === ticketId ? { ...t, isRated: true } : t));
    if (data) setData(prev => ({ ...prev, tickets: { ...prev.tickets, rated: (prev.tickets?.rated || 0) + 1 } }));
  };

  const canRate = (t) => ['resolved','closed'].includes(t.status) && !t.isRated;
  const pendingRatings = recentTickets.filter(canRate);

  if (loading) return <div className="loading-overlay" style={{ minHeight:'60vh' }}><Spinner size={28}/></div>;

  const welcomeMsg = user?.company?.settings?.welcomeMessage;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom:24 }}>
        <div className="page-header-left">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageSquare size={24} style={{ color:'#1a6fa8' }}/>
            </div>
            <div>
              <h1 style={{ fontSize:26, margin:0 }}>Hello, {user?.name?.split(' ')[0]}! 👋</h1>
              <p style={{ fontSize:14, margin:0, color:'var(--muted)' }}>{welcomeMsg || `Welcome to ${user?.company?.name} support portal`}</p>
            </div>
          </div>
        </div>
        <button onClick={() => { ticketContext?.setSlug?.(slug); ticketContext?.setTicketDrawerOpen?.(true); }}
          className="btn btn-primary btn-sm" style={{ padding:'10px 20px', borderRadius:10 }}>
          <Plus size={14}/> New Ticket
        </button>
      </div>

      {/* Pending ratings alert */}
      {pendingRatings.length > 0 && (
        <div style={{ marginBottom:20, padding:'14px 18px', background:'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))', border:'2px solid rgba(245,158,11,0.3)', borderRadius:14, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>
              You have {pendingRatings.length} resolved ticket{pendingRatings.length>1?'s':''} waiting for a rating
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Your feedback helps us improve our service.</div>
          </div>
          <button className="btn btn-warning btn-sm" style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}
            onClick={() => setRatingTicket(pendingRatings[0])}>
            <Star size={13}/> Rate Now
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Tickets"  value={data?.tickets?.total}    icon={<Ticket size={18}/>}        color="#1a6fa8"/>
        <StatCard label="Open"           value={data?.tickets?.open}     icon={<AlertCircle size={18}/>}   color="#f59e0b" sub="awaiting response"/>
        <StatCard label="Resolved"       value={data?.tickets?.resolved} icon={<CheckCircle2 size={18}/>}  color="#10b981"/>
        <StatCard label="Closed"         value={data?.tickets?.closed}   icon={<CheckCircle2 size={18}/>}  color="#6b7280"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        {/* Recent tickets */}
        <div className="card" style={{ padding:0, overflow:'hidden', borderRadius:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 24px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg, rgba(26,111,168,0.03) 0%, rgba(139,92,246,0.03) 100%)' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(26,111,168,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ticket size={20} style={{ color:'#1a6fa8' }}/>
            </div>
            <div style={{ flex:1 }}>
              <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, margin:0, color:'var(--text)' }}>Recent Tickets</h3>
              <p style={{ fontSize:12, margin:0, color:'var(--muted)', marginTop:2 }}>Your latest support requests</p>
            </div>
            <Link to={`/${slug}/my/tickets`} className="btn btn-ghost btn-sm" style={{ fontSize:13 }}>View all <ArrowRight size={14} style={{ marginLeft:4 }}/></Link>
          </div>
          <div>
            {!recentTickets.length ? (
              <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--muted)', fontSize:14 }}>
                <Ticket size={40} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
                No tickets yet.{' '}
                <Link to={`/${slug}/my/tickets/new`} style={{ color:'#1a6fa8', fontWeight:600 }}>Create one</Link>
              </div>
            ) : recentTickets.map(t => (
              <div key={t._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
                <Link to={`/${slug}/my/tickets/${t._id}`} style={{ flex:1, minWidth:0, textDecoration:'none', color:'inherit' }}>
                  <div style={{ fontWeight:600, fontSize:13.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{t.title}</div>
                  <div style={{ fontSize:12, color:'#1a6fa8', marginTop:2, fontWeight:500 }}>{t.ticketNumber}</div>
                </Link>
                <StatusBadge status={t.status}/>
                {canRate(t) && (
                  <button className="btn btn-warning btn-xs" style={{ fontSize:11, padding:'4px 8px', display:'flex', alignItems:'center', gap:3, borderRadius:8, flexShrink:0 }}
                    onClick={() => setRatingTicket(t)}>
                    <Star size={11}/> Rate
                  </button>
                )}
                {t.isRated && (
                  <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600, display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b"/> Rated
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="card" style={{ padding:24, borderRadius:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Briefcase size={20} style={{ color:'#10b981' }}/>
            </div>
            <div style={{ flex:1 }}>
              <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, margin:0, color:'var(--text)' }}>Our Services</h3>
              <p style={{ fontSize:12, margin:0, color:'var(--muted)', marginTop:2 }}>Select a service to create ticket</p>
            </div>
            <Link to={`/${slug}/my/services`} className="btn btn-ghost btn-sm" style={{ fontSize:13 }}>All <ArrowRight size={14} style={{ marginLeft:4 }}/></Link>
          </div>
          {services.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)', fontSize:14 }}>
              <Briefcase size={36} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }}/>
              No services listed yet
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {services.slice(0,5).map(s => (
                <Link key={s._id} to={`/${slug}/my/tickets/new?service=${encodeURIComponent(s.name)}`}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10, border:'1px solid var(--border)', textDecoration:'none', color:'inherit', background:'var(--surface2)', transition:'all 0.2s ease' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#1a6fa8'; e.currentTarget.style.background='rgba(26,111,168,0.05)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface2)'; }}>
                  <span style={{ fontSize:22 }}>{s.icon}</span>
                  <span style={{ fontSize:14, fontWeight:500, flex:1, color:'var(--text)' }}>{s.name}</span>
                  <ArrowRight size={16} style={{ color:'#1a6fa8' }}/>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Support info */}
      {(user?.company?.settings?.workingHours || user?.company?.settings?.supportEmail) && (
        <div className="card" style={{ padding:24, borderRadius:16, background:'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)', border:'1px solid rgba(26,111,168,0.2)' }}>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(26,111,168,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <HeadphonesIcon size={24} style={{ color:'#1a6fa8' }}/>
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:6, fontSize:16, color:'var(--text)' }}>Need Help?</div>
              <div style={{ fontSize:13, color:'var(--muted)', display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
                {user?.company?.settings?.workingHours && (
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Clock size={14} style={{ color:'#1a6fa8' }}/> {user.company.settings.workingHours}
                  </span>
                )}
                {user?.company?.settings?.supportEmail && (
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Mail size={14} style={{ color:'#1a6fa8' }}/> {user.company.settings.supportEmail}
                  </span>
                )}
              </div>
            </div>
            <Link to={`/${slug}/my/tickets/new`} className="btn btn-primary btn-sm" style={{ padding:'12px 24px', borderRadius:10 }}>
              <Plus size={14}/> Raise a Ticket
            </Link>
          </div>
        </div>
      )}

      {ratingTicket && (
        <RatingModal
          ticket={ratingTicket}
          slug={slug}
          onClose={() => setRatingTicket(null)}
          onRated={handleRated}
        />
      )}
    </div>
  );
}
