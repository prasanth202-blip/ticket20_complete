import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Paperclip, Lock, ArrowLeft, UserCheck, RefreshCw, Star, X, AlertCircle, CheckCircle2, Clock, Tag, FileText, Calendar, User, MessageSquare, Info, ChevronDown, TrendingDown, Flame, AlertTriangle, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketAPI, messageAPI, ratingAPI, companyAPI } from '../../api';
import { StatusBadge, PriorityBadge, RoleBadge, Avatar, Modal, StarInput, Spinner, InfoRow, ConfirmDialog } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

export default function TicketDetail() {
  const { id, companySlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const slug = companySlug || user?.company?.slug;
  const endRef = useRef(null);

  const [ticket, setTicket]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [sending, setSending]   = useState(false);
  const [msgText, setMsgText]   = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [msgFiles, setMsgFiles] = useState([]);

  const [assignModal, setAssignModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [newStatus, setNewStatus]         = useState('');
  const [statusNote, setStatusNote]       = useState('');
  const [rating, setRating] = useState({ score: 0, feedback: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  const isStaff = ['company_super_admin','company_admin','employee','agent'].includes(user?.role);
  const isAdmin = ['company_super_admin','company_admin'].includes(user?.role);
  const isOwner = user?.role === 'platform_owner';
  const canManage = isAdmin || isOwner;

  const backPath = user?.role === 'user' ? `/${slug}/my/tickets`
    : user?.role === 'agent' ? `/${slug}/agent/tickets`
    : `/${slug}/tickets`;

  const fetchAll = useCallback(async () => {
    try {
      const [tr, mr] = await Promise.all([
        ticketAPI.getTicket(slug, id),
        messageAPI.getMessages(slug, id),
      ]);
      setTicket(tr.data.data);
      setMessages(mr.data.data || []);
      messageAPI.markRead(slug, id).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket not found or access denied.');
    } finally { setLoading(false); }
  }, [slug, id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Poll messages every 8s
  useEffect(() => {
    const iv = setInterval(() => {
      messageAPI.getMessages(slug, id).then(r => setMessages(r.data.data || [])).catch(() => {});
    }, 8000);
    return () => clearInterval(iv);
  }, [slug, id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load agents for assignment
  useEffect(() => {
    if (canManage) {
      companyAPI.getStaff(slug, { role: 'agent' })
        .then(r => setAgents(r.data.data || []))
        .catch(() => {});
    }
  }, [slug, canManage]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgText.trim() && msgFiles.length === 0) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', msgText);
      fd.append('isInternal', isInternal);
      msgFiles.forEach(f => fd.append('attachments', f));
      await messageAPI.sendMessage(slug, id, fd);
      setMsgText('');
      setMsgFiles([]);
      setIsInternal(false);
      await fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send message.'); }
    finally { setSending(false); }
  };

  const handleAssign = async () => {
    if (!selectedAgent) { toast.error('Select an agent'); return; }
    setActionLoading(true);
    try {
      await ticketAPI.assignTicket(slug, id, { agentId: selectedAgent });
      toast.success('Ticket assigned successfully');
      setAssignModal(false);
      setSelectedAgent('');
      await fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign ticket'); }
    finally { setActionLoading(false); }
  };

  const handleStatusChange = async () => {
    if (!newStatus) { toast.error('Select a status'); return; }
    setActionLoading(true);
    try {
      await ticketAPI.updateStatus(slug, id, { status: newStatus, note: statusNote });
      toast.success(`Status updated to "${newStatus.replace('_',' ')}"`);
      setStatusModal(false);
      setStatusNote('');
      await fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
    finally { setActionLoading(false); }
  };

  const handleRating = async () => {
    if (rating.score === 0) { toast.error('Please select a rating'); return; }
    setActionLoading(true);
    try {
      await ratingAPI.createRating(slug, id, rating);
      toast.success('Thank you for your feedback!');
      setRatingModal(false);
      await fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit rating'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-overlay" style={{ minHeight:'80vh' }}><Spinner size={28}/></div>;

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 12px', display: 'block' }}/>
      <h3 style={{ marginBottom: 8 }}>Access Denied</h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
      <Link to={backPath} className="btn btn-secondary btn-sm"><ArrowLeft size={13}/> Go Back</Link>
    </div>
  );

  const canRate = user?.role === 'user' && ['resolved','closed'].includes(ticket?.status) && !ticket?.isRated;
  const statusOptions = ['open','assigned','in_progress','resolved','closed','reopened'];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to={backPath} className="btn btn-ghost btn-sm" style={{ marginBottom: 16, padding: '6px 12px', borderRadius: 8 }}>
          <ArrowLeft size={14}/> Back to Tickets
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: isMobile ? 14 : 15, color: 'var(--primary)', letterSpacing: '.03em', background: 'rgba(26,111,168,0.1)', padding: '6px 12px', borderRadius: 8 }}>{ticket.ticketNumber}</span>
              <StatusBadge status={ticket.status}/>
              <PriorityBadge priority={ticket.priority}/>
            </div>
            <h1 style={{ fontFamily: 'var(--font-h)', fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{ticket.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canManage && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setNewStatus(ticket.status); setStatusModal(true); }} style={{ padding: '10px 16px', borderRadius: 8 }}>
                <RefreshCw size={14}/> Update Status
              </button>
            )}
            {canManage && (
              <button className="btn btn-secondary btn-sm" onClick={() => setAssignModal(true)} style={{ padding: '10px 16px', borderRadius: 8 }}>
                <UserCheck size={14}/> {ticket.assignedTo ? 'Reassign' : 'Assign Agent'}
              </button>
            )}
            {isStaff && !isAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setNewStatus(ticket.status); setStatusModal(true); }} style={{ padding: '10px 16px', borderRadius: 8 }}>
                <RefreshCw size={14}/> Update Status
              </button>
            )}
            {canRate && (
              <button className="btn btn-primary btn-sm" onClick={() => setRatingModal(true)} style={{ padding: '10px 16px', borderRadius: 8 }}>
                <Star size={14}/> Rate Support
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left: Description + Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Description */}
          <div className="card" style={{ padding: isMobile ? 16 : 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a6fa8' }}>
                <FileText size={20}/>
              </div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: 'var(--text)' }}>Description</h3>
            </div>
            <p style={{ fontSize: isMobile ? 14 : 15, lineHeight: 1.75, color: 'var(--text2)', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{ticket.description}</p>
            {ticket.attachments?.length > 0 && (
              <div style={{ padding: 16, background: 'var(--surface2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                  <Paperclip size={14}/> Attachments
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ticket.attachments.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', background: 'rgba(26,111,168,0.1)', color: '#1a6fa8', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(26,111,168,0.2)' }}>
                      📎 {a.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 500 }}>
            <div style={{ padding: isMobile ? 16 : 20, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a6fa8' }}>
                  <MessageSquare size={20}/>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: 'var(--text)' }}>Conversation</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="chat-area" style={{ height: isMobile ? 350 : 400, padding: isMobile ? 16 : 20 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 14 }}>
                  <MessageSquare size={48} style={{ color: 'var(--border)', marginBottom: 16 }}/>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map(m => {
                const isMine = m.sender?._id === user?._id;
                if (m.messageType === 'system') {
                  return <div key={m._id} style={{ textAlign: 'center', padding: '12px 16px', margin: '8px 0', background: 'var(--surface2)', borderRadius: 8, fontSize: 13, color: 'var(--muted)' }}>{m.content}</div>;
                }
                return (
                  <div key={m._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 4, marginBottom: 16 }}>
                    {!isMine && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                        <Avatar name={m.sender?.name || '?'} size={24}/>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{m.sender?.name}</span>
                        <RoleBadge role={m.senderRole}/>
                        {m.isInternal && <span style={{ color: '#f59e0b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 4 }}><Lock size={10}/> Internal</span>}
                      </div>
                    )}
                    <div style={{ maxWidth: '75%', padding: isMobile ? 12 : 14, borderRadius: 16, background: isMine ? '#1a6fa8' : m.isInternal ? 'rgba(245,158,11,0.1)' : 'var(--surface2)', color: isMine ? 'white' : 'var(--text)', border: m.isInternal ? '1px solid rgba(245,158,11,0.3)' : undefined, fontSize: isMobile ? 14 : 15, lineHeight: 1.5 }}>
                      {m.content}
                      {m.attachments?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {m.attachments.map((a, i) => (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: isMine ? 'rgba(255,255,255,.9)' : '#1a6fa8', marginTop: 4, textDecoration: 'none' }}>
                              📎 {a.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted2)' }}>{format(new Date(m.createdAt), 'h:mm a')}</span>
                  </div>
                );
              })}
              <div ref={endRef}/>
            </div>

            {/* Message input */}
            <div style={{ padding: isMobile ? 16 : 20, borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {isStaff && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button className={`btn btn-xs ${!isInternal ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsInternal(false)} style={{ padding: '8px 16px', borderRadius: 6 }}>
                    Public Reply
                  </button>
                  <button className={`btn btn-xs ${isInternal ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsInternal(true)} style={{ padding: '8px 16px', borderRadius: 6 }}>
                    <Lock size={12}/> Internal Note
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder={isInternal ? 'Write an internal note (only staff can see)…' : 'Write a message…'}
                  rows={2}
                  style={{ flex: 1, resize: 'none', fontSize: 14, padding: '12px 14px', borderRadius: 10, background: isInternal ? 'rgba(245,158,11,.05)' : 'var(--surface)', border: `1.5px solid ${isInternal ? 'rgba(245,158,11,.3)' : 'var(--border)'}` }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="btn btn-secondary btn-icon" style={{ cursor: 'pointer', width: 44, height: 44, borderRadius: 10 }} title="Attach file">
                    <Paperclip size={18}/>
                    <input type="file" multiple hidden onChange={e => setMsgFiles(Array.from(e.target.files))} accept="image/*,.pdf,.doc,.docx"/>
                  </label>
                  <button type="submit" className="btn btn-primary btn-icon" disabled={sending} title="Send" style={{ width: 44, height: 44, borderRadius: 10 }}>
                    {sending ? <Spinner size={18}/> : <Send size={18}/>}
                  </button>
                </div>
              </form>
              {msgFiles.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {msgFiles.map(f => (
                    <span key={f.name} style={{ background: 'rgba(26,111,168,0.1)', color: '#1a6fa8', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>
                      📎 {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Ticket Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a6fa8' }}>
                <Info size={20}/>
              </div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: 'var(--text)' }}>Ticket Details</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Number</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1a6fa8', fontSize: 14 }}>{ticket.ticketNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Category</span>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{ticket.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Priority</span>
                <PriorityBadge priority={ticket.priority}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Status</span>
                <StatusBadge status={ticket.status}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Created By</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={ticket.createdBy?.name || '?'} size={24}/>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{ticket.createdBy?.name}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Assigned To</span>
                {ticket.assignedTo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={ticket.assignedTo.name} size={24}/>
                    <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{ticket.assignedTo.name}</span>
                  </div>
                ) : <span style={{ color: 'var(--muted)', fontSize: 13 }}>Unassigned</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Created</span>
                <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
              </div>
              {ticket.resolvedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Resolved</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} style={{ color: '#10b981' }}/> {formatDistanceToNow(new Date(ticket.resolvedAt), { addSuffix: true })}</span>
                </div>
              )}
              {ticket.contactEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Alt Email</span>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{ticket.contactEmail}</span>
                </div>
              )}
              {ticket.contactPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Alt Phone</span>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{ticket.contactPhone}</span>
                </div>
              )}
              {ticket.tags?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14}/> Tags</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ticket.tags.map(t => <span key={t} style={{ fontSize: 12, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 12, color: 'var(--text)' }}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rating result */}
          {ticket.isRated && ticket.rating && (
            <div className="card" style={{ padding: isMobile ? 16 : 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <CheckCircle2 size={20}/>
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>Rated</span>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{ticket.rating.feedback || 'Thank you for your feedback!'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ fontSize: 24, color: i <= (ticket.rating?.score || 0) ? '#f59e0b' : 'var(--border)' }}>★</span>
                ))}
              </div>
            </div>
          )}

          {/* Status history */}
          {ticket.statusHistory?.length > 0 && (
            <div className="card" style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a6fa8' }}>
                  <RefreshCw size={20}/>
                </div>
                <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: 'var(--text)' }}>Status History</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ticket.statusHistory.slice().reverse().slice(0, 5).map((h, i) => (
                  <div key={i} style={{ borderLeft: '3px solid var(--border)', paddingLeft: 12, paddingBottom: 8 }}>
                    <StatusBadge status={h.to}/>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12}/> {h.changedAt ? formatDistanceToNow(new Date(h.changedAt), { addSuffix: true }) : ''}
                    </div>
                    {h.note && <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text2)', background: 'var(--surface2)', padding: '8px 12px', borderRadius: 6 }}>{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Ticket to Agent" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Select Agent</label>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setAgentDropdownOpen(!agentDropdownOpen)} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedAgent ? <><Avatar name={agents.find(a=>a._id===selectedAgent)?.name||'?'} size={18}/> {agents.find(a=>a._id===selectedAgent)?.name}</> : 'Choose an agent'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--muted)' }}/>
              </button>
              {agentDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxHeight: 200, overflowY: 'auto' }}>
                  {agents.map(a => (
                    <button key={a._id} type="button" onClick={() => { setSelectedAgent(a._id); setAgentDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <Avatar name={a.name} size={18}/> {a.name} {a.specializations?.length ? `(${a.specializations.join(', ')})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {agents.length === 0 && (
            <div style={{ fontSize: 13, color: '#f59e0b', display: 'flex', gap: 7, padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: 8 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }}/> No agents found. Add agents in Staff Management.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setAssignModal(false)} style={{ padding: '10px 24px', borderRadius: 8 }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={!selectedAgent || actionLoading} style={{ padding: '10px 24px', borderRadius: 8 }}>
              {actionLoading ? <Spinner size={14}/> : 'Assign Ticket'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Ticket Status" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setStatusDropdownOpen(!statusDropdownOpen)} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {newStatus === 'open' ? <><CheckCircle2 size={18} style={{ color: '#3b82f6'}}/> Open</> :
                   newStatus === 'assigned' ? <><UserCheck size={18} style={{ color: '#8b5cf6'}}/> Assigned</> :
                   newStatus === 'in_progress' ? <><AlertTriangle size={18} style={{ color: '#f59e0b'}}/> In Progress</> :
                   newStatus === 'resolved' ? <><CheckCircle2 size={18} style={{ color: '#10b981'}}/> Resolved</> :
                   newStatus === 'closed' ? <><X size={18} style={{ color: '#6b7280'}}/> Closed</> :
                   newStatus === 'reopened' ? <><RefreshCw size={18} style={{ color: '#ef4444'}}/> Reopened</> :
                   'Select status'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--muted)' }}/>
              </button>
              {statusDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <button type="button" onClick={() => { setNewStatus('open'); setStatusDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <CheckCircle2 size={18} style={{ color: '#3b82f6'}}/> Open
                  </button>
                  <button type="button" onClick={() => { setNewStatus('assigned'); setStatusDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <UserCheck size={18} style={{ color: '#8b5cf6'}}/> Assigned
                  </button>
                  <button type="button" onClick={() => { setNewStatus('in_progress'); setStatusDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <AlertTriangle size={18} style={{ color: '#f59e0b'}}/> In Progress
                  </button>
                  <button type="button" onClick={() => { setNewStatus('resolved'); setStatusDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <CheckCircle2 size={18} style={{ color: '#10b981'}}/> Resolved
                  </button>
                  <button type="button" onClick={() => { setNewStatus('closed'); setStatusDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <X size={18} style={{ color: '#6b7280'}}/> Closed
                  </button>
                  <button type="button" onClick={() => { setNewStatus('reopened'); setStatusDropdownOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <RefreshCw size={18} style={{ color: '#ef4444'}}/> Reopened
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Reason for status change…" style={{ padding: '10px 14px' }}/>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(false)} style={{ padding: '10px 24px', borderRadius: 8 }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleStatusChange} disabled={actionLoading} style={{ padding: '10px 24px', borderRadius: 8 }}>
              {actionLoading ? <Spinner size={14}/> : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal open={ratingModal} onClose={() => setRatingModal(false)} title="Rate Your Experience" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            How satisfied were you with the support you received for this ticket?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <StarInput value={rating.score} onChange={v => setRating(p => ({ ...p, score: v }))}/>
          </div>
          {rating.score > 0 && (
            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>
              {['', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'][rating.score]}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Feedback (optional)</label>
            <textarea rows={3} value={rating.feedback} onChange={e => setRating(p => ({ ...p, feedback: e.target.value }))} placeholder="Tell us about your experience…" style={{ padding: '10px 14px' }}/>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRatingModal(false)} style={{ padding: '10px 24px', borderRadius: 8 }}>Skip</button>
            <button className="btn btn-primary btn-sm" onClick={handleRating} disabled={rating.score === 0 || actionLoading} style={{ padding: '10px 24px', borderRadius: 8 }}>
              {actionLoading ? <Spinner size={14}/> : '⭐ Submit Rating'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
