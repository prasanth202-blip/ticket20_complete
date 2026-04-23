import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle, XCircle, PauseCircle, PlayCircle, Pencil, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformAPI, subscriptionAPI } from '../../api';
import { StatusBadge, Modal, Pagination, SearchInput, Spinner, EmptyState, Avatar, Tabs, useAddCompany, useEditCompany, useFeatureOverride } from '../../components/shared';
import { formatDistanceToNow } from 'date-fns';

const fmtINR = (paise) => paise ? `₹${(paise/100).toLocaleString('en-IN')}` : '₹0';

export default function PlatformCompanies() {
  const [searchParams] = useSearchParams();
  const [companies, setCompanies]   = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status')||'');
  const [page, setPage]             = useState(1);
  const [plans, setPlans]           = useState([]);

  // Modals
  const [rejectModal, setRejectModal]   = useState({ open:false, company:null, reason:'' });
  const { setAddDrawerOpen } = useAddCompany();
  const { setEditDrawerOpen, setEditCompany, setOnSave: setEditOnSave } = useEditCompany();
  const { setFeatureDrawerOpen, setFeatureCompany, setOnSave: setFeatureOnSave } = useFeatureOverride();

  useEffect(() => {
    subscriptionAPI.getPlans().then(r=>setPlans(r.data.data||[])).catch(()=>{});
  }, []);

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    platformAPI.getCompanies({ page, limit:15, status:statusFilter, search })
      .then(r=>{ setCompanies(r.data.data||[]); setPagination(r.data.pagination||{}); })
      .finally(()=>setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => {
    setEditOnSave(() => fetchCompanies);
    setFeatureOnSave(() => fetchCompanies);
  }, [fetchCompanies, setEditOnSave, setFeatureOnSave]);

  useEffect(()=>{ fetchCompanies(); }, [fetchCompanies]);

  const handleApprove = async (id, name) => {
    try { await platformAPI.approveCompany(id); toast.success(`${name} approved!`); fetchCompanies(); }
    catch (e) { toast.error(e.response?.data?.message||'Error'); }
  };

  const handleReject = async () => {
    try {
      await platformAPI.rejectCompany(rejectModal.company._id, { reason:rejectModal.reason });
      toast.success('Company rejected');
      setRejectModal({open:false,company:null,reason:''});
      fetchCompanies();
    } catch (e) { toast.error(e.response?.data?.message||'Error'); }
  };

  const handleToggleSuspend = async (c) => {
    try {
      await platformAPI.toggleSuspend(c._id);
      toast.success(`${c.name} ${c.status==='suspended'?'restored':'suspended'}`);
      fetchCompanies();
    } catch { toast.error('Error'); }
  };

  const openEdit = (c) => {
    setEditCompany(c);
    setEditDrawerOpen(true);
  };

  const openFeatureOverride = (c) => {
    setFeatureCompany(c);
    setFeatureDrawerOpen(true);
  };

  const STATUS_TABS = [
    { value:'',          label:'All',        count:pagination.total },
    { value:'pending',   label:'Pending' },
    { value:'approved',  label:'Approved' },
    { value:'rejected',  label:'Rejected' },
    { value:'suspended', label:'Suspended' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Companies</h1><p>Manage all registered companies and their subscriptions</p></div>
        <button className="btn btn-primary" onClick={()=>setAddDrawerOpen(true)}><Plus size={16}/> Add Company</button>
      </div>

      <Tabs tabs={STATUS_TABS} active={statusFilter} onChange={v=>{setStatusFilter(v);setPage(1);}}/>

      <div style={{ marginBottom:20 }}>
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by name, email, slug…"/>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? <div className="loading-overlay" style={{ minHeight:300 }}><Spinner/></div> : companies.length===0 ? (
          <EmptyState icon={null} title="No companies found" description="No companies match your current filters."/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Company</th><th>Email</th><th>Plan</th><th>Sub Status</th><th>Status</th><th>Registered</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {companies.map(c=>(
                  <tr key={c._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <Avatar name={c.name} src={c.branding?.logo} size={36}/>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{c.name}</div>
                          <div style={{ fontSize:12, color:'var(--primary)', fontWeight:500 }}>/{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:13, color:'var(--muted)' }}>{c.email}</td>
                    <td style={{ fontSize:13 }}>
                      {c.subscriptionPlan ? (
                        <div>
                          <div style={{ fontWeight:600, color:'var(--text)' }}>{c.subscriptionPlan.name}</div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>{fmtINR(c.subscriptionPlan.price?.monthly)}/mo</div>
                        </div>
                      ) : <span style={{ color:'var(--muted)' }}>—</span>}
                    </td>
                    <td><span className={`badge badge-${c.subscriptionStatus||'trial'}`}>{c.subscriptionStatus||'trial'}</span></td>
                    <td><StatusBadge status={c.status}/></td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>{formatDistanceToNow(new Date(c.createdAt),{addSuffix:true})}</td>
                    <td>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {c.status==='pending'&&(
                          <>
                            <button className="btn btn-xs" style={{ background:'rgba(16,185,129,.1)', color:'#10b981', border:'1px solid rgba(16,185,129,.2)', borderRadius:6 }} onClick={()=>handleApprove(c._id,c.name)}>
                              <CheckCircle size={12}/> Approve
                            </button>
                            <button className="btn btn-xs" style={{ background:'rgba(239,68,68,.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,.2)', borderRadius:6 }} onClick={()=>setRejectModal({open:true,company:c,reason:''})}>
                              <XCircle size={12}/> Reject
                            </button>
                          </>
                        )}
                        {c.status==='approved'&&<button className="btn btn-secondary btn-xs" style={{ borderRadius:6 }} onClick={()=>handleToggleSuspend(c)}><PauseCircle size={12}/> Suspend</button>}
                        {c.status==='suspended'&&<button className="btn btn-xs" style={{ background:'rgba(16,185,129,.1)', color:'#10b981', border:'1px solid rgba(16,185,129,.2)', borderRadius:6 }} onClick={()=>handleToggleSuspend(c)}><PlayCircle size={12}/> Restore</button>}
                        <button className="btn btn-secondary btn-xs" style={{ borderRadius:6 }} onClick={()=>openEdit(c)}><Pencil size={12}/> Edit</button>
                        <button className="btn btn-secondary btn-xs" style={{ borderRadius:6 }} onClick={()=>openFeatureOverride(c)}><Zap size={12}/></button>
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

      {/* Reject Modal */}
      <Modal open={rejectModal.open} onClose={()=>setRejectModal({open:false,company:null,reason:''})} title="Reject Company" width={440}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ color:'var(--muted)', fontSize:13.5 }}>Rejecting <strong>{rejectModal.company?.name}</strong>. Optionally provide a reason (sent to admin).</p>
          <div className="form-group"><label className="form-label">Rejection Reason (optional)</label>
            <textarea rows={3} value={rejectModal.reason} onChange={e=>setRejectModal(p=>({...p,reason:e.target.value}))} placeholder="e.g. Incomplete information, duplicate registration…"/>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={()=>setRejectModal({open:false,company:null,reason:''})}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleReject}>Reject Company</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
