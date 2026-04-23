import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Ticket, Users, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { platformAPI } from '../../api';
import { StatCard, StatusBadge, PriorityBadge, Spinner, Avatar, useAddCompany } from '../../components/shared';
import { formatDistanceToNow } from 'date-fns';

export default function PlatformDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { setAddDrawerOpen } = useAddCompany();

  useEffect(() => {
    platformAPI.getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><Spinner size={32}/></div>;
  if (!data)   return null;

  const companyStatusData = (data.companiesByStatus || []).map((d, i) => ({
    name: d._id, count: d.count,
    fill: { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444', suspended:'#6b7280' }[d._id] || '#6b7280',
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Platform Overview</h1><p>Global view of all companies and activity</p></div>
        <button className="btn btn-primary" onClick={()=>setAddDrawerOpen(true)}><Plus size={16}/> Add Company</button>
      </div>

      <div className="stat-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Companies"  value={data.totalCompanies}   icon={<Building2 size={18}/>}   color="var(--primary)"/>
        <StatCard label="Awaiting Approval"value={data.pendingCompanies} icon={<Clock size={18}/>}       color="#f59e0b"
          sub={data.pendingCompanies > 0 ? 'Action needed' : 'All clear'}/>
        <StatCard label="Approved"         value={data.approvedCompanies}icon={<CheckCircle size={18}/>} color="#10b981"/>
        <StatCard label="Total Tickets"    value={data.totalTickets}     icon={<Ticket size={18}/>}      color="#3b82f6"/>
        <StatCard label="Open Tickets"     value={data.openTickets}      icon={<AlertCircle size={18}/>} color="#ef4444"/>
        <StatCard label="Total Customers"  value={data.totalUsers}       icon={<Users size={18}/>}       color="#a855f7"/>
        <StatCard label="Agents"           value={data.totalAgents}      icon={<Users size={18}/>}       color="#ec4899"/>
        <StatCard label="Monthly Revenue"  value={`₹${(data.monthlyRevenue||0).toFixed(0)}`} icon={<DollarSign size={18}/>} color="#f59e0b"/>
      </div>

      <div className="charts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Companies by status */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:16, fontSize:16, color:'var(--text)' }}>Companies by Status</h3>
          {companyStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={companyStatusData}>
                <XAxis dataKey="name" tick={{ fontSize:12 }} stroke="var(--muted)" strokeWidth={0}/>
                <YAxis tick={{ fontSize:12 }} width={30} stroke="var(--muted)" strokeWidth={0}/>
                <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {companyStatusData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'var(--muted)', padding:'50px 0', fontSize:13 }}>No data yet</div>}
        </div>

        {/* Pending approvals */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Pending Approvals</h3>
            <Link to="/platform/companies?status=pending" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {data.pendingCompanies === 0 ? (
            <div style={{ textAlign:'center', color:'#10b981', padding:'40px 0', fontSize:13 }}>
              <CheckCircle size={32} style={{ display:'block', margin:'0 auto 12px', color:'#10b981' }}/>
              All caught up! No pending approvals.
            </div>
          ) : (
            <div style={{ padding:'20px', background:'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)', borderRadius:12, border:'1px solid rgba(245,158,11,0.2)', textAlign:'center' }}>
              <div style={{ fontSize:36, fontWeight:800, fontFamily:'var(--font-h)', color:'#f59e0b', marginBottom:4 }}>{data.pendingCompanies}</div>
              <div style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>companies awaiting approval</div>
              <Link to="/platform/companies?status=pending" className="btn btn-sm" style={{ background:'#f59e0b', color:'#fff', padding:'10px 20px', borderRadius:8, fontWeight:600, textDecoration:'none' }}>
                Review Now →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent tickets */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:20, borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Recent Tickets (Global)</h3>
          <Link to="/platform/tickets" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket #</th><th>Title</th><th>Company</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {(data.recentTickets||[]).length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>No tickets yet</td></tr>
              ) : (data.recentTickets||[]).map(t => (
                <tr key={t._id}>
                  <td><span style={{ fontSize:12, fontWeight:700, color:'var(--primary)' }}>{t.ticketNumber}</span></td>
                  <td style={{ fontSize:13, maxWidth:220 }}>{t.title?.slice(0,50)}{t.title?.length > 50 ? '…' : ''}</td>
                  <td>
                    <div style={{ fontSize:13, fontWeight:500 }}>{t.company?.name}</div>
                    <div style={{ fontSize:11, color:'var(--primary)', fontWeight:600 }}>/{t.company?.slug}</div>
                  </td>
                  <td><PriorityBadge priority={t.priority}/></td>
                  <td><StatusBadge status={t.status}/></td>
                  <td style={{ fontSize:12, color:'var(--muted)' }}>{formatDistanceToNow(new Date(t.createdAt), { addSuffix:true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
