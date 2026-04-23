import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { platformAPI } from '../../api';
import { Spinner, EmptyState, SearchInput, Pagination, Avatar, RoleBadge, StatusBadge } from '../../components/shared';
import { formatDistanceToNow } from 'date-fns';

export default function PlatformUsers() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    platformAPI.getCompanies({ page, search, limit:20 })
      .then(r => { setCompanies(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>All Users</h1><p>All staff and customers across every company</p></div>
      </div>
      <div style={{ marginBottom:20 }}>
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search companies…"/>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? <div className="loading-overlay"><Spinner/></div> : companies.length===0 ? (
          <EmptyState icon={<Users size={48}/>} title="No companies found" description="No companies match your search."/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Company</th><th>Email</th><th>Status</th><th>Plan</th><th>Registered</th></tr></thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c._id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:12}}><Avatar name={c.name} src={c.branding?.logo} size={36}/><div><div style={{fontWeight:600,fontSize:14,color:'var(--text)'}}>{c.name}</div><div style={{fontSize:12,color:'var(--primary)',fontWeight:500}}>/{c.slug}</div></div></div></td>
                    <td style={{fontSize:13,color:'var(--muted)'}}>{c.email}</td>
                    <td><StatusBadge status={c.status}/></td>
                    <td style={{fontSize:13,color:'var(--text)'}}>{c.subscriptionPlan?.name || '—'}</td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{formatDistanceToNow(new Date(c.createdAt),{addSuffix:true})}</td>
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
