import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import { Building2, Ticket, TrendingUp, DollarSign, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { platformAPI } from '../../api';
import { Spinner, StatCard } from '../../components/shared';

const STATUS_COLORS  = { open:'#3b82f6', assigned:'#a855f7', in_progress:'#f59e0b', resolved:'#10b981', closed:'#6b7280', reopened:'#ef4444' };
const PRIORITY_COLORS= { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#7f1d1d' };
const PIE_COLORS     = ['#1a6fa8','#f59e0b','#10b981','#ef4444','#3b82f6','#a855f7','#ec4899'];

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  const lakhs = amount / 100000;
  const crores = amount / 10000000;
  if (crores >= 1) return `₹${crores.toFixed(2)} Cr`;
  if (lakhs >= 1) return `₹${lakhs.toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      {label && <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => <div key={i} style={{ color: p.color || p.fill }}>{p.name || p.dataKey}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

export default function PlatformAnalytics() {
  const [data, setData]     = useState(null);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      platformAPI.getAnalytics(),
      platformAPI.getDashboard(),
    ]).then(([a, d]) => {
      setData(a.data.data);
      setStats(d.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><Spinner size={32}/></div>;

  const statusData   = (data?.byStatus   || []).map(d => ({ name: d._id?.replace(/_/g,' '), value: d.count, fill: STATUS_COLORS[d._id] || '#6b7280' }));
  const priorityData = (data?.byPriority || []).map(d => ({ name: d._id, value: d.count, fill: PRIORITY_COLORS[d._id] || '#6b7280' }));
  const planData     = (data?.companiesByPlan || []).map((d,i) => ({ name: d._id || 'No Plan', value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] }));
  const trendData    = (data?.monthlyTickets  || []).map(d => ({ date: d._id?.slice(5), tickets: d.count }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Platform Analytics</h1><p>Global insights across all companies</p></div>
      </div>

      {/* Summary stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Companies" value={stats?.totalCompanies} icon={<Building2 size={18}/>} color="var(--primary)"/>
        <StatCard label="Total Tickets" value={stats?.totalTickets} icon={<Ticket size={18}/>} color="#3b82f6"/>
        <StatCard label="Open Tickets" value={stats?.openTickets} icon={<AlertCircle size={18}/>} color="#f59e0b"/>
        <StatCard label="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue)} icon={<DollarSign size={18}/>} color="#10b981"/>
      </div>

      {/* Charts row 1 */}
      <div className="charts-grid" style={{ display:'grid', gap:20, marginBottom:24 }}>
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Tickets by Status</h3>
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={3}>
                  {statusData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, minWidth:120 }}>
              {statusData.map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:13 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:d.fill, flexShrink:0 }}/>
                  <span style={{ flex:1, textTransform:'capitalize', fontWeight:500 }}>{d.name}</span>
                  <strong style={{ fontSize:14 }}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Tickets by Priority</h3>
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={3}>
                  {priorityData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, minWidth:120 }}>
              {priorityData.map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:13 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:d.fill, flexShrink:0 }}/>
                  <span style={{ flex:1, textTransform:'capitalize', fontWeight:500 }}>{d.name}</span>
                  <strong style={{ fontSize:14 }}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-grid" style={{ display:'grid', gap:20, marginBottom:24 }}>
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Companies by Plan</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={planData} layout="vertical">
              <XAxis type="number" tick={{ fontSize:12 }} stroke="var(--muted)" strokeWidth={0}/>
              <YAxis dataKey="name" type="category" tick={{ fontSize:13 }} width={90} stroke="var(--muted)" strokeWidth={0}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="value" radius={[0,6,6,0]}>
                {planData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Ticket Trend (30 Days)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                <XAxis dataKey="date" tick={{ fontSize:12 }} stroke="var(--muted)" strokeWidth={0}/>
                <YAxis tick={{ fontSize:12 }} width={35} stroke="var(--muted)" strokeWidth={0}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="tickets" stroke="var(--primary)" strokeWidth={3} dot={false} activeDot={{ r:5 }}/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0', fontSize:13 }}>No ticket data yet</div>
          )}
        </div>
      </div>

      {/* Recent companies */}
      <div className="card" style={{ padding:20 }}>
        <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Company Status Overview</h3>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          {(data?.companiesByPlan || []).length === 0 ? (
            <p style={{ color:'var(--muted)', fontSize:13 }}>No company data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name:'Pending',   count: stats?.pendingCompanies||0,  fill:'#f59e0b' },
                { name:'Approved',  count: stats?.approvedCompanies||0, fill:'#10b981' },
                { name:'Total',     count: stats?.totalCompanies||0,    fill:'#1a6fa8' },
              ]}>
                <XAxis dataKey="name" tick={{ fontSize:12 }} stroke="var(--muted)" strokeWidth={0}/>
                <YAxis tick={{ fontSize:12 }} width={35} stroke="var(--muted)" strokeWidth={0}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {[{fill:'#f59e0b'},{fill:'#10b981'},{fill:'#1a6fa8'}].map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
