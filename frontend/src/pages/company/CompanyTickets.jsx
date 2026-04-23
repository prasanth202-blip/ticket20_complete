import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Ticket, Filter, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { ticketAPI, companyAPI } from '../../api';
import { StatusBadge, PriorityBadge, Pagination, SearchInput, Spinner, EmptyState, Avatar, Select, Tabs, StatCard, useTicket } from '../../components/shared';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_TABS = [
  { value:'',           label:'All' },
  { value:'open',       label:'Open' },
  { value:'assigned',   label:'Assigned' },
  { value:'in_progress',label:'In Progress' },
  { value:'resolved',   label:'Resolved' },
  { value:'closed',     label:'Closed' },
];

export default function CompanyTickets() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const { setTicketDrawerOpen, setOnSave, setSlug } = useTicket();

  const [tickets, setTickets]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusTab, setStatusTab]   = useState('');
  const [priority, setPriority]     = useState('');
  const [page, setPage]             = useState(1);
  const [counts, setCounts]         = useState({});

  const fetchTickets = useCallback(() => {
    setLoading(true);
    ticketAPI.getTickets(slug, { page, limit:20, status:statusTab, priority, search })
      .then(r => { setTickets(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [slug, page, statusTab, priority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => setOnSave(() => fetchTickets), [fetchTickets, setOnSave]);
  useEffect(() => setSlug(slug), [slug, setSlug]);

  // Fetch counts for tabs
  useEffect(() => {
    Promise.all(
      STATUS_TABS.map(t => ticketAPI.getTickets(slug, { status:t.value, limit:1 }).then(r => [t.value, r.data.pagination?.total||0]))
    ).then(results => {
      const c = {};
      results.forEach(([k,v]) => { c[k] = v; });
      setCounts(c);
    }).catch(() => {});
  }, [slug]);

  const tabsWithCounts = STATUS_TABS.map(t => ({ ...t, count: counts[t.value] }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Tickets</h1><p>All support tickets for {user?.company?.name}</p></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setTicketDrawerOpen(true)}><Plus size={14}/> New Ticket</button>
      </div>

      {/* Stats */}
      {!loading && Object.keys(counts).length > 0 && (
        <div className="stat-grid" style={{ marginBottom:24 }}>
          <StatCard label="Total Tickets" value={counts[''] || 0} icon={<Ticket size={18}/>} color="#3b82f6"/>
          <StatCard label="Open" value={counts['open'] || 0} icon={<AlertCircle size={18}/>} color="#f59e0b"/>
          <StatCard label="Resolved" value={counts['resolved'] || 0} icon={<CheckCircle size={18}/>} color="#10b981"/>
          <StatCard label="Closed" value={counts['closed'] || 0} icon={<Clock size={18}/>} color="#6b7280"/>
        </div>
      )}

      {/* Status tabs */}
      <Tabs tabs={tabsWithCounts} active={statusTab} onChange={v => { setStatusTab(v); setPage(1); }}/>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tickets, numbers..."/>
        <div style={{ minWidth:160 }}>
          <Select value={priority} onChange={v => { setPriority(v); setPage(1); }}
            options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]}
            placeholder="All Priorities"/>
        </div>
        {(priority||search) && <button className="btn btn-ghost btn-sm" onClick={() => { setPriority(''); setSearch(''); setPage(1); }}>Clear</button>}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? <div className="loading-overlay" style={{ minHeight:300 }}><Spinner/></div> : tickets.length===0 ? (
          <EmptyState icon={<Ticket size={44}/>} title="No tickets found" description="No tickets match the current filters."
            action={<Link to={`/${slug}/tickets/new`} className="btn btn-primary btn-sm"><Plus size={14}/> Create Ticket</Link>}/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width:110 }}>Ticket #</th>
                  <th>Subject</th>
                  <th>Customer</th>
                  <th style={{ width:100 }}>Priority</th>
                  <th style={{ width:130 }}>Status</th>
                  <th>Assigned Agent</th>
                  <th style={{ width:130 }}>Date</th>
                  <th style={{ width:80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} className={`ticket-row-${t.status}`}>
                    <td>
                      <span style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:13, color:'var(--primary)' }}>
                        {t.ticketNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:14, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{t.title}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{t.category}</div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={t.createdBy?.name||'?'} size={32}/>
                        <div>
                          <div style={{ fontSize:14, fontWeight:500, color:'var(--text)' }}>{t.createdBy?.name}</div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>{t.createdBy?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><PriorityBadge priority={t.priority}/></td>
                    <td><StatusBadge status={t.status}/></td>
                    <td>
                      {t.assignedTo ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Avatar name={t.assignedTo.name} size={26}/>
                          <span style={{ fontSize:14, color:'var(--text)' }}>{t.assignedTo.name}</span>
                        </div>
                      ) : <span style={{ color:'var(--muted)', fontSize:13 }}>Unassigned</span>}
                    </td>
                    <td style={{ fontSize:13, color:'var(--muted)' }}>
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix:true })}
                    </td>
                    <td>
                      <Link to={`/${slug}/tickets/${t._id}`} className="btn btn-secondary btn-xs">View</Link>
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
