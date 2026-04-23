import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { platformAPI } from '../../api';
import { Spinner, StatCard } from '../../components/shared';
import { DollarSign, TrendingUp, CreditCard, Building2, TrendingDown } from 'lucide-react';

const formatCurrency = (paise) => {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
};

export default function PlatformRevenue() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformAPI.getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><Spinner size={28}/></div>;

  const monthlyRevenue = data?.monthlyRevenue || 0;
  const annualRunRate = monthlyRevenue * 12;

  return (
    <div className="fade-in">
      <style>{`
        .revenue-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .revenue-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .revenue-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="page-header">
        <div className="page-header-left"><h1>Revenue</h1><p>Subscription billing overview</p></div>
      </div>

      <div className="revenue-stats-grid" style={{ marginBottom:24 }}>
        <div className="revenue-card" style={{ 
          background:'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)', 
          border:'1px solid rgba(16,185,129,0.2)', borderRadius:16, padding:24 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <DollarSign size={24} color="#10b981"/>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Monthly Revenue</span>
          </div>
          <div style={{ fontFamily:'var(--font-h)', fontSize:36, fontWeight:800, color:'#10b981', marginBottom:4 }}>{formatCurrency(monthlyRevenue)}</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>Total monthly subscription income</div>
        </div>

        <div className="revenue-card" style={{ 
          background:'linear-gradient(135deg, rgba(26,111,168,0.1) 0%, rgba(26,111,168,0.05) 100%)', 
          border:'1px solid rgba(26,111,168,0.2)', borderRadius:16, padding:24 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(26,111,168,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={24} color="#1a6fa8"/>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Annual Run Rate</span>
          </div>
          <div style={{ fontFamily:'var(--font-h)', fontSize:36, fontWeight:800, color:'#1a6fa8', marginBottom:4 }}>{formatCurrency(annualRunRate)}</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>Projected annual revenue (ARR)</div>
        </div>

        <div className="revenue-card" style={{ 
          background:'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)', 
          border:'1px solid rgba(59,130,246,0.2)', borderRadius:16, padding:24 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Building2 size={24} color="#3b82f6"/>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Active Companies</span>
          </div>
          <div style={{ fontFamily:'var(--font-h)', fontSize:36, fontWeight:800, color:'#3b82f6', marginBottom:4 }}>{data?.approvedCompanies || 0}</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>Companies with active subscriptions</div>
        </div>

        <div className="revenue-card" style={{ 
          background:'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)', 
          border:'1px solid rgba(245,158,11,0.2)', borderRadius:16, padding:24 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CreditCard size={24} color="#f59e0b"/>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Pending Billing</span>
          </div>
          <div style={{ fontFamily:'var(--font-h)', fontSize:36, fontWeight:800, color:'#f59e0b', marginBottom:4 }}>{data?.pendingCompanies || 0}</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>Companies awaiting approval</div>
        </div>
      </div>

      <div className="card" style={{ padding:20, marginBottom:24 }}>
        <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, marginBottom:20, fontSize:16, color:'var(--text)' }}>Revenue by Company Status</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(data?.companiesByStatus||[]).map(d=>({ name:d._id, count:d.count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3}/>
            <XAxis dataKey="name" tick={{fontSize:12}} stroke="var(--muted)" strokeWidth={0}/>
            <YAxis tick={{fontSize:12}} width={35} stroke="var(--muted)" strokeWidth={0}/>
            <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
            <Bar dataKey="count" fill="#1a6fa8" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding:20, background:'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)', border:'1px solid rgba(26,111,168,0.15)' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(26,111,168,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <TrendingUp size={20} color="#1a6fa8"/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Revenue Tracking Tip</div>
            <p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6, marginBottom:8 }}>
              Full revenue tracking with Razorpay webhooks will provide real-time payment data. Configure your Razorpay webhook at your backend URL:
            </p>
            <code style={{ background:'rgba(26,111,168,0.1)', color:'#1a6fa8', padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:600, display:'inline-block' }}>
              /api/payments/webhook
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
