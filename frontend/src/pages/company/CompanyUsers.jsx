import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Mail, Phone, Eye, UserCheck, UserX, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI, ticketAPI } from '../../api';
import { Spinner, EmptyState, Avatar, SearchInput, Pagination, StatusBadge, Modal, InfoRow, StatCard } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function CompanyUsers() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;

  const [users, setUsers]           = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    userAPI.getUsers(slug, { page, search })
      .then(r => { setUsers(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };
  useEffect(fetchUsers, [slug, page, search]);

  const openUser = async (u) => {
    setSelected(u);
    setTicketsLoading(true);
    try {
      const r = await ticketAPI.getTickets(slug, { limit:10, search: u.email });
      setUserTickets(r.data.data || []);
    } finally { setTicketsLoading(false); }
  };

  const handleToggle = async (uid, name, active) => {
    try {
      await userAPI.toggleUserStatus(slug, uid);
      toast.success(`${name} ${!active ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Customers</h1><p>Manage registered customer accounts</p></div>
      </div>

      {/* Stats */}
      {!loading && users.length > 0 && (
        <div className="stat-grid" style={{ marginBottom:24 }}>
          <StatCard label="Total Customers" value={pagination.total || users.length} icon={<Users size={18}/>} color="#3b82f6"/>
          <StatCard label="Active" value={users.filter(u => u.isActive).length} icon={<UserCheck size={18}/>} color="#10b981"/>
          <StatCard label="Inactive" value={users.filter(u => !u.isActive).length} icon={<UserX size={18}/>} color="#6b7280"/>
          <StatCard label="Total Tickets" value={users.reduce((sum, u) => sum + (u.ticketCount || 0), 0)} icon={<TrendingUp size={18}/>} color="#a855f7"/>
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or email..."/>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:20, borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Customer List</h3>
        </div>
        {loading ? <div className="loading-overlay" style={{ minHeight:200 }}><Spinner/></div> : users.length === 0 ? (
          <EmptyState icon={<Users size={44}/>} title="No customers yet" description="Customers will appear here after they register."/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Tickets</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={u.name} size={34}/>
                        <span style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${u.email}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'var(--muted)' }}>
                        <Mail size={13}/> {u.email}
                      </a>
                    </td>
                    <td style={{ fontSize:14, color:'var(--muted)' }}>
                      {u.phone ? <span style={{ display:'flex', alignItems:'center', gap:6 }}><Phone size={13}/>{u.phone}</span> : '—'}
                    </td>
                    <td style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{u.ticketCount || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: u.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: u.isActive?'#10b981':'#ef4444', fontWeight:500 }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:13, color:'var(--muted)' }}>{formatDistanceToNow(new Date(u.createdAt), { addSuffix:true })}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-secondary btn-xs" onClick={() => openUser(u)}><Eye size={13}/> View</button>
                        <button className="btn btn-ghost btn-xs" style={{ color: u.isActive ? '#ef4444' : '#10b981' }}
                          onClick={() => handleToggle(u._id, u.name, u.isActive)}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination pagination={pagination} onPageChange={setPage}/>

      {/* User detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details" width={580}>
        {selected && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:18, padding:'0 0 20px', borderBottom:'1px solid var(--border)' }}>
              <Avatar name={selected.name} size={56}/>
              <div>
                <div style={{ fontFamily:'var(--font-h)', fontSize:20, fontWeight:800, color:'var(--text)' }}>{selected.name}</div>
                <div style={{ fontSize:14, color:'var(--muted)' }}>{selected.email}</div>
                <span className="badge" style={{ marginTop:6, background: selected.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: selected.isActive?'#10b981':'#ef4444', fontWeight:500 }}>
                  {selected.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <InfoRow label="Phone"    value={selected.phone || '—'}/>
            <InfoRow label="Joined"   value={formatDistanceToNow(new Date(selected.createdAt), { addSuffix:true })}/>
            <InfoRow label="Last Login" value={selected.lastLogin ? formatDistanceToNow(new Date(selected.lastLogin), { addSuffix:true }) : '—'}/>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Recent Tickets</div>
              {ticketsLoading ? <Spinner size={18}/> : userTickets.length === 0 ? (
                <div style={{ fontSize:14, color:'var(--muted)' }}>No tickets found</div>
              ) : userTickets.slice(0,5).map(t => (
                <div key={t._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, color:'var(--primary)', fontWeight:700, width:100 }}>{t.ticketNumber}</span>
                  <span style={{ flex:1, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{t.title}</span>
                  <StatusBadge status={t.status}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
