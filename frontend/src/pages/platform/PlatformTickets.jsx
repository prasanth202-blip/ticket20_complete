// PlatformTickets.jsx
import React, { useEffect, useState } from 'react';
import { platformAPI } from '../../api';
import { StatusBadge, PriorityBadge, Pagination, SearchInput, Spinner, EmptyState, Select } from '../../components/shared';
import { Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PlatformTickets() {
  const [tickets, setTickets]   = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    setLoading(true);
    platformAPI.getTickets({ page, limit:20, status, priority })
      .then(r => { setTickets(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page, status, priority]);

  const statusOpts = [{value:'',label:'All Status'},{value:'open',label:'Open'},{value:'assigned',label:'Assigned'},{value:'in_progress',label:'In Progress'},{value:'resolved',label:'Resolved'},{value:'closed',label:'Closed'}];
  const prioOpts   = [{value:'',label:'All Priority'},{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'},{value:'critical',label:'Critical'}];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>All Tickets</h1><p>Global view of tickets across all companies</p></div>
      </div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Select
          value={status}
          onChange={v=>{ setStatus(v); setPage(1); }}
          options={statusOpts}
          placeholder="All Status"
          style={{minWidth:160}}
        />
        <Select
          value={priority}
          onChange={v=>{ setPriority(v); setPage(1); }}
          options={prioOpts}
          placeholder="All Priority"
          style={{minWidth:160}}
        />
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {loading ? <div className="loading-overlay"><Spinner/></div> : tickets.length===0 ? (
          <EmptyState icon={<Ticket size={48}/>} title="No tickets" description="No tickets match your filters." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ticket</th><th>Company</th><th>Created By</th><th>Priority</th><th>Status</th><th>Age</th></tr></thead>
              <tbody>
                {tickets.map(t=>(
                  <tr key={t._id}>
                    <td>
                      <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>{t.ticketNumber}</div>
                      <div style={{color:'var(--muted)',fontSize:12,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    </td>
                    <td><div style={{fontSize:13,color:'var(--text)'}}>{t.company?.name}</div><div style={{fontSize:11,color:'var(--primary)',fontWeight:500}}>/{t.company?.slug}</div></td>
                    <td style={{fontSize:13,color:'var(--text)'}}>{t.createdBy?.name}</td>
                    <td><PriorityBadge priority={t.priority}/></td>
                    <td><StatusBadge status={t.status}/></td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{formatDistanceToNow(new Date(t.createdAt),{addSuffix:true})}</td>
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

export default PlatformTickets;
