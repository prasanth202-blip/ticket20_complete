import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CreditCard, CheckCircle, Users, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformAPI } from '../../api';
import { Spinner, EmptyState, ConfirmDialog, usePlan } from '../../components/shared';

const fmtINR = (paise) => `₹${(paise/100).toLocaleString('en-IN')}`;

export default function PlatformPlans() {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [delConf, setDelConf] = useState({ open:false, id:null });
  const { setPlanDrawerOpen, setPlan, setOnSave } = usePlan();

  const fetchPlans = useCallback(() => {
    setLoading(true);
    platformAPI.getPlans().then(r=>setPlans(r.data.data||[])).finally(()=>setLoading(false));
  }, []);

  useEffect(() => {
    setOnSave(() => fetchPlans);
  }, [fetchPlans, setOnSave]);

  useEffect(fetchPlans, [fetchPlans]);

  const openCreate = () => { setPlan(null); setPlanDrawerOpen(true); };
  const openEdit   = p  => { setPlan(p); setPlanDrawerOpen(true); };

  const handleDelete = async id => {
    try { await platformAPI.deletePlan(id); toast.success('Plan deleted'); fetchPlans(); }
    catch { toast.error('Error deleting plan'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Subscription Plans</h1><p>Manage pricing tiers and features for companies</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> New Plan</button>
      </div>

      {loading ? <div className="loading-overlay"><Spinner/></div> : plans.length===0 ? (
        <EmptyState icon={<CreditCard size={48}/>} title="No plans yet" description="Create your first subscription plan."
          action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14}/> Create Plan</button>}/>
      ) : (
        <div className="plans-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
          {plans.map(plan=>(
            <div key={plan._id} className="plan-card" style={{
              border: plan.isPopular?'2px solid var(--primary)':'1px solid var(--border)',
              borderRadius:16,
              padding:24,
              background: plan.isPopular?'linear-gradient(135deg, rgba(26,111,168,0.03) 0%, rgba(26,111,168,0.01) 100%)':'var(--surface)',
              position:'relative',
              transition:'all 0.3s ease'
            }}>
              {plan.isPopular&&<div className="plan-badge" style={{ 
                position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                background:'linear-gradient(135deg, #1a6fa8 0%, #8b5cf6 100%)',
                color:'#fff', padding:'4px 16px', borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', boxShadow:'0 4px 12px rgba(26,111,168,0.3)'
              }}>⭐ Most Popular</div>}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <h3 style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:22, color:'var(--text)' }}>{plan.name}</h3>
                  {plan.tagline&&<div style={{ fontSize:13, color:'var(--muted)', marginTop:4, fontWeight:500 }}>{plan.tagline}</div>}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-icon" onClick={()=>openEdit(plan)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8 }}>
                    <Pencil size={16}/>
                  </button>
                  <button className="btn btn-ghost btn-icon" style={{ color:'#ef4444', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8 }} onClick={()=>setDelConf({open:true,id:plan._id})}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
              <div style={{ marginBottom:20, padding:'16px', background:'linear-gradient(135deg, rgba(26,111,168,0.08) 0%, rgba(139,92,246,0.08) 100%)', borderRadius:12, border:'1px solid rgba(26,111,168,0.15)' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontFamily:'var(--font-h)', fontSize:32, fontWeight:800, color:'var(--primary)' }}>{fmtINR(plan.price?.monthly)}</span>
                  <span style={{ color:'var(--muted)', fontSize:13, fontWeight:500 }}>/month</span>
                </div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:4, fontWeight:500 }}>{fmtINR(plan.price?.yearly)}/year</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px', background:'var(--surface2)', borderRadius:10, textAlign:'center' }}>
                  <Users size={20} style={{ color:'var(--primary)', marginBottom:6 }}/>
                  <span style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{plan.limits?.max_agents}</span>
                  <span style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Agents</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px', background:'var(--surface2)', borderRadius:10, textAlign:'center' }}>
                  <Ticket size={20} style={{ color:'#f59e0b', marginBottom:6 }}/>
                  <span style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{plan.limits?.max_tickets_per_month?.toLocaleString()}</span>
                  <span style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Tickets/Mo</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px', background:'var(--surface2)', borderRadius:10, textAlign:'center' }}>
                  <CreditCard size={20} style={{ color:'#10b981', marginBottom:6 }}/>
                  <span style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{plan.limits?.storage_limit_gb}</span>
                  <span style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>GB Storage</span>
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 }}>Included Features</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {Object.entries(plan.features||{}).filter(([,v])=>v).map(([k])=>(
                    <div key={k} style={{ display:'flex', gap:8, fontSize:12, alignItems:'center', fontWeight:500 }}>
                      <CheckCircle size={14} color="#10b981" style={{ flexShrink:0 }}/>
                      {k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:'auto', paddingTop:16, borderTop:'1px solid var(--border)', display:'flex', gap:12, alignItems:'center' }}>
                <span className={`badge badge-${plan.isActive?'active':'suspended'}`} style={{ padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{plan.isActive?'Active':'Inactive'}</span>
                {!plan.isActive&&<span className="badge badge-suspended" style={{ padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Hidden</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={delConf.open} onClose={()=>setDelConf({open:false,id:null})}
        onConfirm={()=>handleDelete(delConf.id)} title="Delete Plan" danger
        message="Delete this plan? Companies currently on this plan will not be immediately affected, but no new subscriptions will use it."
        confirmLabel="Delete Plan"/>
    </div>
  );
}
