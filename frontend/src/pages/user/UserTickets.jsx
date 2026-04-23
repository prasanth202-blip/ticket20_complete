import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Ticket, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketAPI, ratingAPI } from '../../api';
import { StatusBadge, PriorityBadge, Pagination, SearchInput, Spinner, EmptyState, Tabs, Modal, useTicket } from '../../components/shared';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

// ── Star Rating Component ──────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:6 }}>
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:2, lineHeight:1 }}
        >
          <Star
            size={size}
            fill={(hover || value) >= star ? '#f59e0b' : 'none'}
            color={(hover || value) >= star ? '#f59e0b' : 'var(--border)'}
            style={{ transition:'all 0.15s' }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Rating Modal ──────────────────────────────────────────────────────────────
function RatingModal({ ticket, slug, onClose, onRated }) {
  const [score, setScore]       = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score) { toast.error('Please select a rating.'); return; }
    setSaving(true);
    try {
      await ratingAPI.createRating(slug, ticket._id, { score, feedback });
      toast.success('Thank you for your rating!');
      onRated(ticket._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit rating.');
    } finally { setSaving(false); }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Modal title="Rate Your Support Experience" onClose={onClose} size="sm">
      <div style={{ padding:'0 4px' }}>
        <div style={{ marginBottom:20, padding:16, background:'var(--surface2)', borderRadius:12, border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:4 }}>{ticket.title}</div>
          <div style={{ fontSize:12, color:'var(--primary)', fontWeight:500 }}>{ticket.ticketNumber}</div>
          {ticket.assignedTo?.name && (
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Agent: {ticket.assignedTo.name}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:12 }}>How would you rate your experience?</div>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
              <StarRating value={score} onChange={setScore} size={36}/>
            </div>
            {score > 0 && (
              <div style={{ fontSize:15, fontWeight:700, color:'#f59e0b', marginTop:4 }}>{labels[score]}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Feedback (optional)</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Tell us about your experience…"
              maxLength={1000}
              style={{ resize:'vertical' }}
            />
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{feedback.length}/1000</div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !score} style={{ flex:2 }}>
              {saving ? <><Spinner size={13}/> Submitting…</> : '⭐ Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserTickets() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const ticketContext = useTicket();

  const [tickets, setTickets]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [ratingTicket, setRatingTicket] = useState(null);

  useEffect(() => { sessionStorage.setItem('companySlug', slug); }, [slug]);

  useEffect(() => {
    setLoading(true);
    ticketAPI.getTickets(slug, { page, status, search, limit: 15 })
      .then(r => { setTickets(r.data.data || []); setPagination(r.data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [slug, page, status, search]);

  const handleRated = (ticketId) => {
    setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, isRated: true } : t));
  };

  const canRate = (t) => ['resolved', 'closed'].includes(t.status) && !t.isRated;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1>My Tickets</h1><p>All your support requests</p></div>
        <button
          onClick={() => { ticketContext?.setSlug?.(slug); ticketContext?.setTicketDrawerOpen?.(true); }}
          className="btn btn-primary btn-sm"
          style={{ padding:'10px 20px', borderRadius:10 }}
        >
          <Plus size={14}/> New Ticket
        </button>
      </div>

      <Tabs tabs={STATUS_TABS} active={status} onChange={v => { setStatus(v); setPage(1); }}/>

      <div style={{ marginBottom:14 }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tickets…"/>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? <div className="loading-overlay" style={{ minHeight:200 }}><Spinner/></div> : tickets.length === 0 ? (
          <EmptyState icon={<Ticket size={44}/>} title="No tickets found"
            description={status ? `No ${status.replace('_',' ')} tickets.` : "You haven't submitted any tickets yet."}
            action={<Link to={`/${slug}/my/tickets/new`} className="btn btn-primary btn-sm"><Plus size={13}/> Create First Ticket</Link>}/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Submitted</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} className={`ticket-stripe-${t.status}`}>
                    <td>
                      <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:12.5, color:'var(--primary)' }}>{t.ticketNumber}</span>
                    </td>
                    <td>
                      <Link to={`/${slug}/my/tickets/${t._id}`} style={{ textDecoration:'none', color:'inherit' }}>
                        <div style={{ fontWeight:600, fontSize:13.5, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize:11.5, color:'var(--muted)' }}>{t.category}</div>
                      </Link>
                    </td>
                    <td><PriorityBadge priority={t.priority}/></td>
                    <td><StatusBadge status={t.status}/></td>
                    <td style={{ fontSize:13 }}>
                      {t.assignedTo?.name || <span style={{ color:'var(--muted)' }}>Pending</span>}
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix:true })}
                    </td>
                    <td>
                      {t.isRated ? (
                        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#f59e0b', fontWeight:600 }}>
                          <Star size={13} fill="#f59e0b" color="#f59e0b"/> Rated
                        </span>
                      ) : canRate(t) ? (
                        <button
                          className="btn btn-warning btn-xs"
                          style={{ fontSize:12, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, borderRadius:8, whiteSpace:'nowrap' }}
                          onClick={() => setRatingTicket(t)}
                        >
                          <Star size={12}/> Rate
                        </button>
                      ) : (
                        <span style={{ fontSize:12, color:'var(--muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage}/>

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
