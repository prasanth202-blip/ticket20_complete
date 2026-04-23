import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, Briefcase, User, Plus, Bell, ChevronLeft, ChevronRight, Menu, Mail, Settings, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import AdminFooter from './AdminFooter';
import { ThemeToggle, TicketProvider, TicketDrawer, useTicket } from '../shared';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const UserHeader = ({ slug, collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const ticketContext = useTicket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

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
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn btn-ghost btn-icon mobile-hamburger" onClick={()=>setMobileOpen(!mobileOpen)} style={{ color:'var(--muted)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)' }}>
          <Menu size={18}/>
        </button>
        <button className="btn btn-ghost btn-icon desktop-collapse" onClick={()=>setCollapsed(!collapsed)} style={{ color:'var(--muted)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', marginLeft: 8 }}>
          {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
        </button>
        <span className="topbar-title">Customer Support</span>
      </div>
      <div className="topbar-right">
        <ThemeToggle/>
        <button 
          onClick={() => { ticketContext?.setSlug?.(slug); ticketContext?.setTicketDrawerOpen?.(true); }}
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
            transition:'all 0.2s ease',
            boxShadow:'0 1px 2px rgba(0,0,0,0.05)',
            color:'var(--primary)'
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,111,168,0.1)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';}}
          title="New Ticket"
        >
          <Plus size={18}/>
        </button>
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
              borderRadius:10,
              background:'linear-gradient(135deg, #1a6fa8 0%, #1e3669 100%)',
              border:'2px solid rgba(26,111,168,0.3)',
              overflow:'hidden', padding:0, borderRadius:'50%',
              cursor:'pointer',
              transition:'all 0.2s ease',
              boxShadow:'0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,111,168,0.2)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';}}
          >
            {user?.avatar ? (
              <img src={user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`} alt="av"
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
                    overflow:'hidden', flexShrink:0,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    color:'#fff',
                    fontSize:16,
                    fontWeight:700
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
                  onClick={()=>{ navigate(`/${slug}/my/profile`); setProfileDropdownOpen(false); }}
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
                  onClick={()=>{ navigate(`/${slug}/my/profile`); setProfileDropdownOpen(false); }}
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
  );
};

export default function UserLayout() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [{
    label: 'Customer Portal',
    items: [
      { to:`/${slug}/my/dashboard`, icon:<LayoutDashboard size={17}/>, label:'Dashboard', end:true },
      { to:`/${slug}/my/tickets`,   icon:<Ticket size={17}/>,          label:'My Tickets' },
      { to:`/${slug}/my/services`,  icon:<Briefcase size={17}/>,       label:'Services' },
      { to:`/${slug}/my/profile`,   icon:<User size={17}/>,            label:'Profile & Settings' },
    ],
  }];

  return (
    <TicketProvider>
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
        <Sidebar navSections={navSections} brandName={user?.company?.name} brandTagline="Support Portal" brandLogo={user?.company?.branding?.logo} collapsed={collapsed} onToggleCollapse={()=>setCollapsed(!collapsed)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
        <div className="main-content">
          <UserHeader 
            slug={slug}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
          <div className="page-content fade-in"><Outlet/></div>
        <AdminFooter/>
        </div>
        <TicketDrawer/>
      </div>
    </TicketProvider>
  );
}
