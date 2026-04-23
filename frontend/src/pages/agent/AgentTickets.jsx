import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { ticketAPI } from '../../api';
import { StatusBadge, PriorityBadge, Pagination, SearchInput, Spinner, EmptyState, Avatar, Tabs } from '../../components/shared';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function AgentTickets() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;

  const [tickets, setTickets]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);

  useEffect(() => {
    setLoading(true);
    ticketAPI.getTickets(slug, { page, status, search, limit: 20 })
      .then(r => { setTickets(r.data.data || []); setPagination(r.data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [slug, page, status, search]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1>My Tickets</h1><p>Tickets assigned to you</p></div>
      </div>

      <Tabs tabs={STATUS_TABS} active={status} onChange={v => { setStatus(v); setPage(1); }}/>

      <div style={{ marginBottom: 14 }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tickets…"/>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="loading-overlay" style={{ minHeight: 200 }}><Spinner/></div> : tickets.length === 0 ? (
          <EmptyState icon={<Ticket size={44}/>} title="No tickets found" description="No tickets match your current filter."/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Ticket #</th><th>Subject</th><th>Customer</th><th>Priority</th><th>Status</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} className={`ticket-stripe-${t.status}`} style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = `/${slug}/agent/tickets/${t._id}`}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5, color: 'var(--primary)' }}>{t.ticketNumber}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.category}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Avatar name={t.createdBy?.name || '?'} size={26}/>
                        <div>
                          <div style={{ fontSize: 13 }}>{t.createdBy?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.createdBy?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><PriorityBadge priority={t.priority}/></td>
                    <td><StatusBadge status={t.status}/></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {formatDistanceToNow(new Date(t.updatedAt || t.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination pagination={pagination} onPageChange={setPage}/>
    </div>
  );
}
