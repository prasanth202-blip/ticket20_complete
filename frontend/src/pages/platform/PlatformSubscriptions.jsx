import React, { useEffect, useState } from 'react';
import { SearchInput, Pagination, Spinner, EmptyState, Avatar, StatusBadge, Modal, InfoRow, StatCard } from '../../components/shared';
import { platformAPI, paymentAPI, subscriptionAPI } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { Building2, Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Filter } from 'lucide-react';

const formatCurrency = (paise) => {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `Rs ${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `Rs ${(rupees / 100000).toFixed(2)} L`;
  return `Rs ${rupees.toLocaleString('en-IN')}`;
};

const getNextBillingDisplay = (expiry, status) => {
  if (!expiry) {
    if (status === 'trial') return 'Trial period (no end date)';
    if (status === 'active') return 'No expiry date';
    return 'N/A';
  }
  
  const expiryDate = new Date(expiry);
  const formattedDate = expiryDate.toLocaleDateString();
  
  if (status === 'expired') {
    return `Expired ${formattedDate}`;
  }
  
  // Calculate days until expiry
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    return `Expired ${formattedDate}`;
  } else if (status === 'trial') {
    // For trial periods: show "Trial ends in X days" for 7 days or less, otherwise show actual date
    if (daysUntilExpiry <= 7) {
      return `Trial ends in ${daysUntilExpiry} days`;
    } else {
      return `Trial ends ${formattedDate}`;
    }
  } else if (daysUntilExpiry <= 7) {
    return `Expires in ${daysUntilExpiry} days`;
  } else {
    return `Renews ${formattedDate}`;
  }
};

export default function PlatformSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);

  const PAGE_SIZE = 15;

  const fetchSubscriptions = () => {
    setLoading(true);
    // Try to get subscription data first, fallback to company data
    subscriptionAPI.getAllSubscriptions({ page, limit: PAGE_SIZE, search, status: statusFilter })
      .then(r => {
        setSubscriptions(r.data.data || []);
        setPagination(r.data.pagination || {});
      })
      .catch(err => {
        // Fallback to company data if subscription API fails
        console.warn('Subscription API failed, falling back to company data:', err);
        return platformAPI.getCompanies({ page, limit: PAGE_SIZE, search, status: statusFilter });
      })
      .then(r => {
        if (r && r.data) {
          setSubscriptions(r.data.data || []);
          setPagination(r.data.pagination || {});
        }
      })
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    platformAPI.getDashboard()
      .then(r => setStats(r.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, [page, search, statusFilter]);

  const openDetails = (subscription) => {
    setSelected(subscription);
  };

  const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'trial', label: 'Trial' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Subscription Details</h1>
          <p>Manage and monitor all company subscriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <StatCard 
            label="Active Subscriptions" 
            value={stats.approvedCompanies || 0} 
            icon={<CheckCircle size={18}/>} 
            color="#10b981" 
          />
          <StatCard 
            label="Trial Subscriptions" 
            value={subscriptions.filter(s => s.subscriptionStatus === 'trial').length} 
            icon={<Clock size={18}/>} 
            color="#f59e0b" 
          />
          <StatCard 
            label="Expired Subscriptions" 
            value={subscriptions.filter(s => s.subscriptionStatus === 'expired').length} 
            icon={<AlertCircle size={18}/>} 
            color="#ef4444" 
          />
          <StatCard 
            label="Monthly Revenue" 
            value={formatCurrency(stats.monthlyRevenue || 0)} 
            icon={<DollarSign size={18}/>} 
            color="#1a6fa8" 
          />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput 
          value={search} 
          onChange={v => { setSearch(v); setPage(1); }} 
          placeholder="Search by company name, email..." 
          style={{ flex: 1, minWidth: 250 }}
        />
        <div style={{ minWidth: 180 }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13
            }}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {(search || statusFilter) && (
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            All Subscriptions
          </h3>
        </div>
        
        {loading ? (
          <div className="loading-overlay" style={{ minHeight: 300 }}>
            <Spinner />
          </div>
        ) : subscriptions.length === 0 ? (
          <EmptyState 
            icon={<CreditCard size={44}/>} 
            title="No subscriptions found" 
            description="No subscriptions match your current filters."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Billing</th>
                  <th>Next Billing Date</th>
                  <th>Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={sub.name} src={sub.branding?.logo} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                            {sub.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
                            /{sub.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {sub.subscriptionPlan ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                            {sub.subscriptionPlan.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {formatCurrency(sub.subscriptionPlan.price?.monthly)}/mo
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>No Plan</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${sub.subscriptionStatus || 'trial'}`}>
                        {sub.subscriptionStatus || 'Trial'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      <div style={{ textTransform: 'capitalize' }}>
                        {sub.billingCycle || 'monthly'}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {getNextBillingDisplay(sub.expiry, sub.subscriptionStatus)}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {sub.subscriptionPlan ? formatCurrency(sub.subscriptionPlan.price?.monthly) : 'N/A'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-xs"
                        onClick={() => openDetails(sub)}
                        style={{ borderRadius: 6 }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Subscription Details Modal */}
      {selected && (
        <Modal 
          open={!!selected} 
          onClose={() => setSelected(null)} 
          title="Subscription Details" 
          width={600}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Company Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 0 20px', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={selected.name} src={selected.branding?.logo} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 500 }}>
                  /{selected.slug}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  {selected.email}
                </div>
                <span className={`badge badge-${selected.status}`} style={{ marginTop: 8 }}>
                  {selected.status}
                </span>
              </div>
            </div>

            {/* Subscription Info */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Subscription Information
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow 
                  label="Plan" 
                  value={selected.subscriptionPlan?.name || 'No Plan'} 
                />
                <InfoRow 
                  label="Status" 
                  value={
                    <span className={`badge badge-${selected.subscriptionStatus || 'trial'}`}>
                      {selected.subscriptionStatus || 'Trial'}
                    </span>
                  } 
                />
                <InfoRow 
                  label="Billing Cycle" 
                  value={<span style={{ textTransform: 'capitalize' }}>{selected.billingCycle || 'monthly'}</span>} 
                />
                <InfoRow 
                  label="Monthly Price" 
                  value={selected.subscriptionPlan ? formatCurrency(selected.subscriptionPlan.price?.monthly) : 'N/A'} 
                />
                <InfoRow 
                  label="Yearly Price" 
                  value={selected.subscriptionPlan ? formatCurrency(selected.subscriptionPlan.price?.yearly) : 'N/A'} 
                />
                <InfoRow 
                  label="Next Billing" 
                  value={getNextBillingDisplay(selected.expiry, selected.subscriptionStatus)}
                />
                <InfoRow 
                  label="Created" 
                  value={formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })} 
                />
              </div>
            </div>

            {/* Plan Limits */}
            {selected.subscriptionPlan?.limits && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Plan Limits
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, textAlign: 'center' }}>
                    <Users size={20} style={{ color: 'var(--primary)', marginBottom: 6 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {selected.subscriptionPlan.limits.max_agents === 999 ? 'Unlimited' : selected.subscriptionPlan.limits.max_agents}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Agents</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, textAlign: 'center' }}>
                    <CreditCard size={20} style={{ color: '#f59e0b', marginBottom: 6 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {selected.subscriptionPlan.limits.max_tickets_per_month === 999999 ? 'Unlimited' : selected.subscriptionPlan.limits.max_tickets_per_month?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Tickets/Month</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, textAlign: 'center' }}>
                    <TrendingUp size={20} style={{ color: '#10b981', marginBottom: 6 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {selected.subscriptionPlan.limits.storage_limit_gb} GB
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Storage</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
