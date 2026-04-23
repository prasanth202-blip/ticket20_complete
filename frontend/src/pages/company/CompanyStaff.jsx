import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, UserCog, ToggleRight, ToggleLeft, Pencil, Users, Shield, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState, Avatar, SearchInput, RoleBadge, StatCard, Select, useStaff, Pagination } from '../../components/shared';

export default function CompanyStaff() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const { setStaffDrawerOpen, setStaff, setOnSave, setSlug } = useStaff();

  const [staff, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const PAGE_SIZE = 10;

  const fetchStaff = () => {
    setLoading(true);
    companyAPI.getStaff(slug, { role:roleFilter, search, page, limit:PAGE_SIZE })
      .then(r => { setStaffList(r.data.data||[]); setPagination(r.data.pagination||{ page, pages: Math.ceil((r.data.data||[]).length/PAGE_SIZE)||1, total:(r.data.data||[]).length }); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { setPage(1); }, [roleFilter, search]);
  useEffect(fetchStaff, [slug, roleFilter, search, page]);
  useEffect(() => setOnSave(() => fetchStaff), [fetchStaff, setOnSave]);
  useEffect(() => setSlug(slug), [slug, setSlug]);

  const openCreate = () => { setStaff(null); setStaffDrawerOpen(true); };
  const openEdit   = (m) => { setStaff(m); setStaffDrawerOpen(true); };

  const handleToggle = async (m) => {
    try {
      await companyAPI.updateStaff(slug, m._id, { isActive:!m.isActive });
      toast.success(`${m.name} ${!m.isActive?'activated':'deactivated'}`);
      fetchStaff();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Staff Management</h1><p>Manage your admins, employees, and agents</p></div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Add Staff</button>
      </div>

      {/* Stats */}
      {!loading && staff.length > 0 && (
        <div className="stat-grid" style={{ marginBottom:24 }}>
          <StatCard label="Total Staff" value={staff.length} icon={<Users size={18}/>} color="#3b82f6"/>
          <StatCard label="Active" value={staff.filter(s => s.isActive).length} icon={<UserCheck size={18}/>} color="#10b981"/>
          <StatCard label="Admins" value={staff.filter(s => s.role === 'company_admin' || s.role === 'company_super_admin').length} icon={<Shield size={18}/>} color="#a855f7"/>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={v=>{setSearch(v);}} placeholder="Search staff…"/>
        <div style={{ minWidth:180 }}>
          <Select value={roleFilter} onChange={v=>setRoleFilter(v)}
            options={[{value:'',label:'All Roles'},{value:'company_admin',label:'Admin'},{value:'employee',label:'Employee'},{value:'agent',label:'Agent'}]}
            placeholder="All Roles"/>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:20, borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Staff Members</h3>
        </div>
        {loading ? <div className="loading-overlay" style={{ minHeight:200 }}><Spinner/></div> :
        staff.length===0 ? (
          <EmptyState icon={<UserCog size={44}/>} title="No staff found" description="Add staff members to manage and handle tickets."
            action={<button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Add First Staff</button>}/>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Specializations</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {staff.map(s=>(
                    <tr key={s._id}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar name={s.name} size={32}/><span style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{s.name}</span></div></td>
                      <td style={{ fontSize:13, color:'var(--muted)' }}>{s.email}</td>
                      <td><RoleBadge role={s.role}/></td>
                      <td style={{ fontSize:13, color:'var(--muted)' }}>{s.specializations?.join(', ')||'—'}</td>
                      <td>
                        <span className="badge" style={{ background:s.isActive?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)', color:s.isActive?'#10b981':'#ef4444', fontWeight:500 }}>
                          {s.isActive?'Active':'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-secondary btn-xs" onClick={()=>openEdit(s)}><Pencil size={11}/> Edit</button>
                          <button className="btn btn-ghost btn-xs" style={{ color:s.isActive?'#ef4444':'#10b981' }} onClick={()=>handleToggle(s)}>
                            {s.isActive?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage}/>
          </>
        )}
      </div>
    </div>
  );
}
