import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Briefcase, ToggleLeft, ToggleRight, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState, ConfirmDialog, StatCard, useService, IconComponent } from '../../components/shared';

export default function CompanyServices() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const { setServiceDrawerOpen, setService, setOnSave, setSlug } = useService();

  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [delConfirm, setDelConfirm] = useState({ open:false, id:null });

  const fetchServices = () => {
    setLoading(true);
    serviceAPI.getServices(slug).then(r => setServices(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(fetchServices, [slug]);
  useEffect(() => setOnSave(() => fetchServices), [fetchServices, setOnSave]);
  useEffect(() => setSlug(slug), [slug, setSlug]);

  const openCreate = () => { setService(null); setServiceDrawerOpen(true); };
  const openEdit   = s  => { setService(s); setServiceDrawerOpen(true); };

  const handleDelete = async id => {
    try { await serviceAPI.delete(slug, id); toast.success('Service deleted'); fetchServices(); }
    catch { toast.error('Error deleting service'); }
  };

  const handleToggle = async (s) => {
    try { await serviceAPI.update(slug, s._id, { isActive: !s.isActive }); fetchServices(); }
    catch { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Services</h1><p>Manage services your company offers — customers see these when creating tickets</p></div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={15}/> Add Service</button>
      </div>

      {/* Stats */}
      {!loading && services.length > 0 && (
        <div className="stat-grid" style={{ marginBottom:24 }}>
          <StatCard label="Total Services" value={services.length} icon={<Layers size={18}/>} color="#3b82f6"/>
          <StatCard label="Active" value={services.filter(s => s.isActive).length} icon={<Briefcase size={18}/>} color="#10b981"/>
          <StatCard label="Inactive" value={services.filter(s => !s.isActive).length} icon={<ToggleLeft size={18}/>} color="#6b7280"/>
        </div>
      )}

      {loading ? <div className="loading-overlay"><Spinner size={28}/></div> : services.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={44}/>}
          title="No services yet"
          description="Add the services you offer so customers can select them when raising a ticket."
          action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14}/> Add First Service</button>}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
          {services.map(s => (
            <div key={s._id} className="card" style={{ padding:20, opacity: s.isActive ? 1 : 0.6, transition:'opacity 0.2s', border:s.isActive?'1px solid var(--border)':'1px dashed var(--border)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:48, height:48, lineHeight:1, background:'var(--surface2)', padding:10, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <IconComponent iconName={s.icon || 'Wrench'} size={24}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontWeight:700, fontSize:16, color:'var(--text)' }}>{s.name}</span>
                    <span className={`badge ${s.isActive ? 'badge-active' : 'badge-closed'}`} style={{ fontSize:11 }}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {s.description && <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>{s.description}</p>}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:18, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                <button className="btn btn-ghost btn-xs" onClick={() => openEdit(s)}><Pencil size={13}/> Edit</button>
                <button className="btn btn-ghost btn-xs" onClick={() => handleToggle(s)}>
                  {s.isActive ? <><ToggleRight size={13} color="#10b981"/> Disable</> : <><ToggleLeft size={13}/> Enable</>}
                </button>
                <button className="btn btn-ghost btn-xs" style={{ color:'#ef4444', marginLeft:'auto' }} onClick={() => setDelConfirm({ open:true, id:s._id })}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={delConfirm.open} onClose={() => setDelConfirm({ open:false, id:null })}
        onConfirm={() => handleDelete(delConfirm.id)} title="Delete Service" danger
        message="Delete this service? Existing tickets using this service won't be affected." confirmLabel="Delete"/>
    </div>
  );
}
