import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, X, LogOut, Zap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  platform_owner:'#d97706', company_super_admin:'#dc2626',
  company_admin:'#7c3aed', employee:'#2563eb', agent:'#059669', user:'#6b7280',
};
const ROLE_LABELS = {
  platform_owner:'Platform Owner', company_super_admin:'Super Admin',
  company_admin:'Admin', employee:'Employee', agent:'Agent', user:'Customer',
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Sidebar({ navSections=[], brandName, brandTagline, brandLogo, collapsed, onToggleCollapse, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const resolveLogoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  };

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };
  const avatarBg = ROLE_COLORS[user?.role] || '#1a6fa8';
  const roleLabel = ROLE_LABELS[user?.role] || user?.role;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={()=>setMobileOpen(false)}/>}

      {/* Mobile hamburger */}
      <button className="btn btn-ghost btn-icon mobile-menu-btn"
        onClick={()=>setMobileOpen(!mobileOpen)}
        style={{ position:'fixed', top:12, left:12, zIndex:300, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', boxShadow:'var(--shadow-sm)' }}>
        <Menu size={18}/>
      </button>

      <aside className={`sidebar${collapsed?' collapsed':''}${mobileOpen?' mobile-open':''}`}>
        {/* Brand */}
        <div className="sidebar-brand" style={{ height:64 }}>
          {collapsed ? (
            <img 
              src={brandLogo ? resolveLogoUrl(brandLogo) : (theme === 'dark' ? '/Ultrakey_white_fav.png' : '/Ultrakey_fav.png')} 
              alt="logo" 
              style={{ width:48, height:48, objectFit:'contain', margin:'0 auto' }}
            />
          ) : (
            <img 
              src={brandLogo ? resolveLogoUrl(brandLogo) : (theme === 'dark' ? '/logo_white.png' : '/logo.png')} 
              alt="logo" 
              style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }}
            />
          )}
          {mobileOpen && (
            <button className="btn btn-ghost btn-icon" onClick={()=>setMobileOpen(false)} style={{ position:'absolute', top:8, right:8, color:'var(--muted)' }}>
              <X size={18}/>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section, si) => (
            <div key={si} className="sidebar-section">
              {section.label && <div className="sidebar-section-label">{section.label}</div>}
              {(section.items||[]).filter(Boolean).map(item => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => `nav-link${isActive?' active':''}`}
                  onClick={()=>setMobileOpen(false)}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Welcome message for platform owner */}
        {user?.role === 'platform_owner' && !collapsed && (
          <div style={{
            margin: '0 10px 8px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(26,111,168,0.1) 0%, rgba(30,54,105,0.12) 100%)',
            borderRadius: 10,
            border: '1px solid rgba(26,111,168,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1a6fa8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
              Welcome Back 👋
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Platform Owner</div>
          </div>
        )}

        {/* Footer */}
       
      </aside>
    </>
  );
}
