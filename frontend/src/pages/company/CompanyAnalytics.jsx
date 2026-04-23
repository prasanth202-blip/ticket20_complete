import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Ticket, Users, UserCog, Star, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { companyAPI, ratingAPI } from '../../api';
import { Spinner, StarDisplay, StatCard, Avatar } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS  = { open:'#3b82f6', assigned:'#a855f7', in_progress:'#f59e0b', resolved:'#10b981', closed:'#6b7280', reopened:'#ef4444' };
const PRIORITY_COLORS= { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' };

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      {label && <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => <div key={i} style={{ color: p.color || p.fill }}>{p.name || p.dataKey}: <b>{p.value}</b></div>)}
    </div>
  );
};

export default function CompanyAnalytics() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;

  const [dash, setDash]     = useState(null);
  const [ratings, setRatings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      companyAPI.getDashboard(slug),
      ratingAPI.getCompanyRatings(slug, { limit: 100 }),
      companyAPI.getAgentPerformance(slug),
    ]).then(([d, r, a]) => {
      setDash(d.data.data);
      setRatings(r.data.data || []);
      setAgents(a.data.data || []);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading-overlay"><Spinner size={32}/></div>;

  const statusData   = (dash?.byPriority || []).map(d => ({ name: d._id, value: d.count, fill: PRIORITY_COLORS[d._id] || '#6b7280' }));
  const trendData    = (dash?.dailyTickets || []).map(d => ({ date: d._id?.slice(5), tickets: d.count }));

  // Ratings distribution
  const ratingDist = [5,4,3,2,1].map(s => ({
    stars: `${s}★`,
    count: ratings.filter(r => r.score === s).length,
    fill: s>=4?'#10b981':s===3?'#f59e0b':'#ef4444',
  }));
  const avgRating = ratings.length ? (ratings.reduce((s,r) => s+r.score,0)/ratings.length).toFixed(1) : 0;

  // Ticket status summary
  const statusSummary = Object.entries(dash?.tickets || {})
    .filter(([k]) => k !== 'total')
    .map(([k,v]) => ({ name: k.replace(/([A-Z])/g,' $1').trim(), value: v, fill: STATUS_COLORS[k.toLowerCase().replace(' ','_')] || '#6b7280' }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Analytics & Reports</h1><p>Insights for your support operations</p></div>
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Tickets"    value={dash?.tickets?.total}      icon={<Ticket size={18}/>}      color="#3b82f6"/>
        <StatCard label="Open"             value={dash?.tickets?.open}        icon={<AlertCircle size={18}/>}    color="#f59e0b"/>
        <StatCard label="Resolved"         value={dash?.tickets?.resolved}    icon={<CheckCircle size={18}/>}   color="#10b981"/>
        <StatCard label="Avg Rating"       value={avgRating > 0 ? `${avgRating} ★` : '—'} icon={<Star size={18}/>}        color="#f59e0b"/>
        <StatCard label="Total Agents"     value={dash?.totalAgents}          icon={<UserCog size={18}/>}       color="#ec4899"/>
        <StatCard label="Total Customers"  value={dash?.totalUsers}           icon={<Users size={18}/>}         color="#a855f7"/>
      </div>

      {/* Row 1 */}
      <div className="charts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <style>{`
          @media (max-width: 768px) {
            .charts-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Ticket Status Breakdown</h3>
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={statusSummary} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={3}>
                  {statusSummary.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, minWidth:120 }}>
              {statusSummary.map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:13 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:d.fill, flexShrink:0 }}/>
                  <span style={{ flex:1, textTransform:'capitalize', fontWeight:500, color:'var(--text)' }}>{d.name}</span>
                  <strong style={{ fontSize:14, color:'var(--text)' }}>{d.value}</strong>
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
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={3}>
                  {statusData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, minWidth:120 }}>
              {statusData.map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:13 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:d.fill, flexShrink:0 }}/>
                  <span style={{ flex:1, textTransform:'capitalize', fontWeight:500, color:'var(--text)' }}>{d.name}</span>
                  <strong style={{ fontSize:14, color:'var(--text)' }}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="charts-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Ticket Volume (7 Days)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                <XAxis dataKey="date" tick={{ fontSize:12 }} stroke="var(--muted)" strokeWidth={0}/>
                <YAxis tick={{ fontSize:12 }} width={35} stroke="var(--muted)" strokeWidth={0}/>
                <Tooltip contentStyle={{ backgroundColor:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fill="url(#cg)" strokeWidth={3}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0', fontSize:13 }}>No data yet</div>}
        </div>

        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Rating Distribution</h3>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-h)', fontSize:36, fontWeight:800, color:'#f59e0b' }}>{avgRating}</div>
            <StarDisplay score={Math.round(avgRating)} size={20}/>
            <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>{ratings.length} ratings</div>
          </div>
          {ratingDist.map(r => (
            <div key={r.stars} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:13, width:28, color:'var(--muted)' }}>{r.stars}</span>
              <div className="progress-bar" style={{ flex:1, background:'var(--surface2)', height:8, borderRadius:4 }}>
                <div className="progress-fill" style={{ width: ratings.length ? `${(r.count/ratings.length)*100}%` : '0%', background: r.fill, height:8, borderRadius:4 }}/>
              </div>
              <span style={{ fontSize:13, width:24, textAlign:'right', color:'var(--text)' }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance Table */}
      {agents.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:20, borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Agent Performance</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Agent</th><th>Total Tickets</th><th>Resolved</th><th>Resolution Rate</th><th>Avg Rating</th></tr></thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.agent._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={a.agent.name||'?'} size={32}/>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{a.agent.name}</div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>{a.agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight:700, fontSize:16, fontFamily:'var(--font-h)', color:'var(--text)' }}>{a.totalTickets}</td>
                    <td style={{ color:'#10b981', fontWeight:600 }}>{a.resolvedTickets}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ width:80, background:'var(--surface2)', height:6, borderRadius:3 }}>
                          <div className="progress-fill" style={{ width:`${a.resolutionRate}%`, background:'#10b981', height:6, borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:13, color:'var(--text)' }}>{a.resolutionRate}%</span>
                      </div>
                    </td>
                    <td><StarDisplay score={Math.round(a.avgRating)}/> <span style={{ fontSize:13, color:'var(--muted)', marginLeft:4 }}>{a.avgRating}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
