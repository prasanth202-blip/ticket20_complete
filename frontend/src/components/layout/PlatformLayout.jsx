import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Ticket, BarChart3, CreditCard,
  Settings, Users, Bell, Plus, Globe, Shield, ChevronLeft, ChevronRight, Menu, LogOut, Home, DollarSign, User, ChevronDown, Mail
} from 'lucide-react';
import Sidebar from './Sidebar';
import AdminFooter from './AdminFooter';
import { ThemeToggle, useAddCompany, useEditCompany, useFeatureOverride, usePlan, AddCompanyDrawer, EditCompanyDrawer, FeatureOverrideDrawer, PlanDrawer } from '../shared';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to:'/platform/dashboard', icon:<LayoutDashboard size={17}/>, label:'Dashboard', end:true },
      { to:'/platform/analytics', icon:<BarChart3 size={17}/>,       label:'Analytics' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to:'/platform/companies', icon:<Building2 size={17}/>,   label:'Companies' },
      { to:'/platform/tickets',   icon:<Ticket size={17}/>,      label:'All Tickets' },
      { to:'/platform/users',     icon:<Users size={17}/>,       label:'All Users' },
    ],
  },
  {
    label: 'Billing & Plans',
    items: [
      { to:'/platform/plans',           icon:<CreditCard size={17}/>,  label:'Subscription Plans' },
      { to:'/platform/subscriptions',   icon:<DollarSign size={17}/>,  label:'Subscription Details' },
      { to:'/platform/transactions',    icon:<Globe size={17}/>,       label:'Transactions' },
      { to:'/platform/revenue',         icon:<Globe size={17}/>,       label:'Revenue' },
    ],
  },
  {
    label: 'System',
    items: [
      { to:'/platform/settings',  icon:<Settings size={17}/>,    label:'Settings' },
      { to:'/platform/profile',   icon:<User size={17}/>,       label:'My Profile' },
    ],
  },
];

export default function PlatformLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setAddDrawerOpen } = useAddCompany();
  const { editDrawerOpen, setEditDrawerOpen, editCompany, setEditCompany, onSave: onEditSave } = useEditCompany();
  const { featureDrawerOpen, setFeatureDrawerOpen, featureCompany, setFeatureCompany, onSave: onFeatureSave } = useFeatureOverride();
  const { planDrawerOpen, setPlanDrawerOpen, plan, setPlan, onSave: onPlanSave } = usePlan();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="app-layout">
      <style>{`
        .mobile-hamburger {
          display: none !important;
        }
        @media (max-width: 768px) {
          .mobile-hamburger {
            display: flex !important;
          }
        }
        .desktop-collapse {
          display: flex !important;
        }
        @media (max-width: 768px) {
          .desktop-collapse {
            display: none !important;
          }
        }
      `}</style>
      <Sidebar navSections={navSections} brandName="TicketFlow" brandTagline="Platform Admin" collapsed={collapsed} onToggleCollapse={()=>setCollapsed(!collapsed)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-ghost btn-icon mobile-hamburger" onClick={()=>setMobileOpen(!mobileOpen)} style={{ color:'var(--muted)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)' }}>
              <Menu size={18}/>
            </button>
            <button className="btn btn-ghost btn-icon desktop-collapse" onClick={()=>setCollapsed(!collapsed)} style={{ color:'var(--muted)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', marginLeft: 8 }}>
              {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
            </button>
            <span className="topbar-title">Platform Administration</span>
          </div>
          <div className="topbar-right">
            <button
              onClick={()=>setAddDrawerOpen(true)}
              style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                width:38,
                height:38,
                borderRadius:10,
                background:'var(--surface)',
                border:'1px solid var(--border)',
                cursor:'pointer',
                color:'var(--primary)',
                transition:'all 0.2s ease',
                boxShadow:'0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,111,168,0.1)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';}}
              title="Add Company"
            >
              <Plus size={18}/>
            </button>
            <ThemeToggle/>
       
            <div ref={profileDropdownRef} style={{ position:'relative', marginLeft:8 }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={()=>setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  width:38,
                  height:38,
                  background:'linear-gradient(135deg, #1a6fa8 0%, #1e3669 100%)',
                  border:'2px solid rgba(26,111,168,0.3)',
                  borderRadius:'50%',
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                  boxShadow:'0 1px 2px rgba(0,0,0,0.05)',
                  overflow:'hidden',
                  padding:0,
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,111,168,0.25)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';}}
              >
                {user?.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`} alt="avatar"
                    style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <span style={{ color:'#fff', fontSize:15, fontWeight:600 }}>
                    {user?.name?.charAt(0)?.toUpperCase()||'?'}
                  </span>
                )}
              </button>
              {profileDropdownOpen && (
                <div style={{
                  position:'absolute',
                  top:'calc(100% + 8px)',
                  right:0,
                  width:240,
                  background:'var(--surface)',
                  border:'1px solid var(--border)',
                  borderRadius:12,
                  boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                  zIndex:100,
                  overflow:'hidden',
                  animation:'fadeIn 0.15s ease'
                }}>
                  <div style={{ padding:'16px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:40,
                        height:40,
                        borderRadius:50,
                        background:'linear-gradient(135deg, #1a6fa8 0%, #1e3669 100%)',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        color:'#fff',
                        fontSize:16,
                        fontWeight:700,
                        overflow:'hidden',
                        flexShrink:0,
                      }}>
                        {user?.avatar ? (
                          <img src={user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`} alt="av"
                            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        ) : (
                          <span>{user?.name?.charAt(0)?.toUpperCase()||'?'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{user?.name}</div>
                        <div style={{ fontSize:12, color:'var(--muted)', display:'flex', alignItems:'center', gap:4 }}>
                          <Mail size={12}/>{user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:6 }}>
                    <button
                      onClick={()=>{ navigate('/platform/profile'); setProfileDropdownOpen(false); }}
                      style={{
                        width:'100%',
                        display:'flex',
                        alignItems:'center',
                        gap:12,
                        padding:'10px 14px',
                        background:'transparent',
                        border:'none',
                        borderRadius:8,
                        cursor:'pointer',
                        fontSize:13,
                        color:'var(--text)',
                        textAlign:'left',
                        transition:'all 0.15s ease'
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <User size={18} style={{ color:'var(--muted)' }}/>
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={()=>{ navigate('/platform/settings'); setProfileDropdownOpen(false); }}
                      style={{
                        width:'100%',
                        display:'flex',
                        alignItems:'center',
                        gap:12,
                        padding:'10px 14px',
                        background:'transparent',
                        border:'none',
                        borderRadius:8,
                        cursor:'pointer',
                        fontSize:13,
                        color:'var(--text)',
                        textAlign:'left',
                        transition:'all 0.15s ease'
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <Settings size={18} style={{ color:'var(--muted)' }}/>
                      <span>Settings</span>
                    </button>
                    <div style={{ height:1, background:'var(--border)', margin:'6px 0' }}/>
                    <button
                      onClick={handleLogout}
                      style={{
                        width:'100%',
                        display:'flex',
                        alignItems:'center',
                        gap:12,
                        padding:'10px 14px',
                        background:'transparent',
                        border:'none',
                        borderRadius:8,
                        cursor:'pointer',
                        fontSize:13,
                        color:'#ef4444',
                        textAlign:'left',
                        transition:'all 0.15s ease'
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <LogOut size={18} style={{ color:'#ef4444' }}/>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-content fade-in">
          <Outlet/>
        </div>
        <AdminFooter/>
      </div>
      <AddCompanyDrawer/>
      <EditCompanyDrawer open={editDrawerOpen} onClose={()=>setEditDrawerOpen(false)} company={editCompany} onSave={onEditSave}/>
      <FeatureOverrideDrawer open={featureDrawerOpen} onClose={()=>setFeatureDrawerOpen(false)} company={featureCompany} onSave={onFeatureSave}/>
      <PlanDrawer open={planDrawerOpen} onClose={()=>setPlanDrawerOpen(false)} plan={plan} onSave={onPlanSave}/>
    </div>
  );
}
