import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Briefcase, ArrowRight, Ticket, MessageSquare, Zap } from 'lucide-react';
import { serviceAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState, useTicket } from '../../components/shared';

export default function UserServices() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;
  const ticketContext = useTicket();

  const [services, setServices]   = useState([]);
  const [company, setCompany]     = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    sessionStorage.setItem('companySlug', slug);
  }, [slug]);

  useEffect(() => {
    serviceAPI.getPublic(slug)
      .then(r => { setServices(r.data.data || []); setCompany(r.data.company); })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleServiceClick = (service) => {
    ticketContext?.setSlug?.(slug);
    ticketContext?.setTicketDrawerOpen?.(true);
    // Store the selected service in sessionStorage to pre-fill it
    sessionStorage.setItem('selectedService', JSON.stringify(service));
  };

  if (loading) return <div className="loading-overlay"><Spinner size={28}/></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-left">
          <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(26,111,168,0.15) 0%, rgba(139,92,246,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={24} style={{ color: '#1a6fa8' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 26, margin: 0 }}>Our Services</h1>
              <p style={{ fontSize: 14, margin: 0, color: 'var(--muted)' }}>{company?.settings?.welcomeMessage || `Services provided by ${company?.name}`}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { ticketContext?.setSlug?.(slug); ticketContext?.setTicketDrawerOpen?.(true); }}
          className="btn btn-primary btn-sm" 
          style={{ padding: '10px 20px', borderRadius: 10 }}
        >
          <Plus size={14}/> New Ticket
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={<Briefcase size={44}/>} title="No services listed" description="This company hasn't added their services yet."/>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            {services.map(s => (
              <div 
                key={s._id} 
                className="card" 
                style={{ 
                  padding: 24, 
                  borderRadius: 16, 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}
                onClick={() => handleServiceClick(s)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#1a6fa8';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(26,111,168,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 14, 
                  background: 'linear-gradient(135deg, rgba(26,111,168,0.1) 0%, rgba(139,92,246,0.1) 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: 16 
                }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                </div>
                <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize: 18, marginBottom: 8, color: 'var(--text)' }}>{s.name}</h3>
                {s.description && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>{s.description}</p>}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  color: '#1a6fa8', 
                  fontWeight: 600, 
                  fontSize: 13 
                }}>
                  <Ticket size={16}/> Raise a Ticket <ArrowRight size={16}/>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ 
            padding: 28, 
            borderRadius: 16, 
            background: 'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)', 
            border: '1px solid rgba(26,111,168,0.2)', 
            textAlign: 'center' 
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(26,111,168,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} style={{ color: '#1a6fa8' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize: 18, margin: 0, color: 'var(--text)' }}>Can't find what you need?</h3>
                <p style={{ color:'var(--muted)', fontSize: 14, margin: 0, marginTop: 4 }}>Raise a general support ticket and our team will help you.</p>
              </div>
            </div>
            <button 
              onClick={() => { ticketContext?.setSlug?.(slug); ticketContext?.setTicketDrawerOpen?.(true); }}
              className="btn btn-primary btn-sm" 
              style={{ padding: '12px 24px', borderRadius: 10 }}
            >
              <Plus size={14}/> Create General Ticket
            </button>
          </div>
        </>
      )}
    </div>
  );
}
