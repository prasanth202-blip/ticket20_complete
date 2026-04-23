import React, { useEffect, useState } from 'react';
import { SearchInput, Pagination, Spinner, EmptyState, Avatar, StatusBadge, Modal, InfoRow, StatCard, Select } from '../../components/shared';
import { paymentAPI, platformAPI } from '../../api';
import { formatDistanceToNow, format } from 'date-fns';
import { Building2, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Filter, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (paise) => {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `Rs ${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `Rs ${(rupees / 100000).toFixed(2)} L`;
  return `Rs ${rupees.toLocaleString('en-IN')}`;
};

const TRANSACTION_TYPES = {
  payment: { label: 'Payment', color: '#10b981' },
  refund: { label: 'Refund', color: '#ef4444' },
  adjustment: { label: 'Adjustment', color: '#f59e0b' },
  failed: { label: 'Failed', color: '#ef4444' },
};

export default function PlatformTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_SIZE = 20;

  const fetchTransactions = () => {
    setLoading(true);
    paymentAPI.getAllTransactions({ 
      page, 
      limit: PAGE_SIZE, 
      search, 
      status: statusFilter,
      type: typeFilter
    })
      .then(r => {
        setTransactions(r.data.data || []);
        setPagination(r.data.pagination || {});
      })
      .catch(err => {
        toast.error('Failed to fetch transactions');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    platformAPI.getDashboard()
      .then(r => setStats(r.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [page, search, statusFilter, typeFilter]);

  const openDetails = (transaction) => {
    setSelected(transaction);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
    fetchStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export feature coming soon');
  };

  const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'payment', label: 'Payment' },
    { value: 'refund', label: 'Refund' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'failed', label: 'Failed' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'refunded': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>View and manage all payment transactions across the platform</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Export
          </button>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <StatCard 
            label="Total Revenue" 
            value={formatCurrency(stats.monthlyRevenue * 12 || 0)} 
            icon={<DollarSign size={18}/>} 
            color="#10b981" 
            sub="Annual run rate"
          />
          <StatCard 
            label="Monthly Revenue" 
            value={formatCurrency(stats.monthlyRevenue || 0)} 
            icon={<TrendingUp size={18}/>} 
            color="#1a6fa8" 
          />
          <StatCard 
            label="Active Companies" 
            value={stats.approvedCompanies || 0} 
            icon={<Building2 size={18}/>} 
            color="#3b82f6" 
          />
          <StatCard 
            label="Total Transactions" 
            value={pagination.total || transactions.length} 
            icon={<CreditCard size={18}/>} 
            color="#a855f7" 
          />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput 
          value={search} 
          onChange={v => { setSearch(v); setPage(1); }} 
          placeholder="Search by company, transaction ID..." 
          style={{ flex: 1, minWidth: 250 }}
        />
        <div style={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="All Status"
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
            placeholder="All Types"
          />
        </div>
        {(search || statusFilter || typeFilter) && (
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            All Transactions
          </h3>
        </div>
        
        {loading ? (
          <div className="loading-overlay" style={{ minHeight: 300 }}>
            <Spinner />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState 
            icon={<CreditCard size={44}/>} 
            title="No transactions found" 
            description="No transactions match your current filters."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                        {tx.transactionId || tx._id.slice(-8)}
                      </div>
                    </td>
                    <td>
                      {tx.company ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={tx.company.name} src={tx.company.branding?.logo} size={28} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                              {tx.company.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}>
                              /{tx.company.slug}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {tx.planName || tx.plan?.name || 'N/A'}
                    </td>
                    <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontSize: 12, 
                          padding: '4px 8px', 
                          borderRadius: 12, 
                          fontWeight: 600,
                          background: `${TRANSACTION_TYPES[tx.type]?.color}20`,
                          color: TRANSACTION_TYPES[tx.type]?.color
                        }}
                      >
                        {TRANSACTION_TYPES[tx.type]?.label || tx.type}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`badge badge-${tx.status}`}
                        style={{ 
                          fontSize: 12,
                          background: `${getStatusColor(tx.status)}20`,
                          color: getStatusColor(tx.status)
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      <div>
                        {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                      </div>
                      <div style={{ fontSize: 11 }}>
                        {format(new Date(tx.createdAt), 'HH:mm')}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-xs"
                        onClick={() => openDetails(tx)}
                        style={{ borderRadius: 6 }}
                      >
                        View
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

      {/* Transaction Details Modal */}
      {selected && (
        <Modal 
          open={!!selected} 
          onClose={() => setSelected(null)} 
          title="Transaction Details" 
          width={600}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Transaction Header */}
            <div style={{ 
              padding: 16, 
              background: 'linear-gradient(135deg, rgba(26,111,168,0.05) 0%, rgba(139,92,246,0.05) 100%)', 
              borderRadius: 12, 
              border: '1px solid rgba(26,111,168,0.15)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>Transaction ID</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                    {selected.transactionId || selected._id}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
                    {formatCurrency(selected.amount)}
                  </div>
                  <span 
                    style={{ 
                      fontSize: 12, 
                      padding: '4px 8px', 
                      borderRadius: 12, 
                      fontWeight: 600,
                      background: `${getStatusColor(selected.status)}20`,
                      color: getStatusColor(selected.status)
                    }}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Transaction Information
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow 
                  label="Type" 
                  value={
                    <span 
                      style={{ 
                        fontSize: 12, 
                        padding: '4px 8px', 
                        borderRadius: 12, 
                        fontWeight: 600,
                        background: `${TRANSACTION_TYPES[selected.type]?.color}20`,
                        color: TRANSACTION_TYPES[selected.type]?.color
                      }}
                    >
                      {TRANSACTION_TYPES[selected.type]?.label || selected.type}
                    </span>
                  } 
                />
                <InfoRow 
                  label="Date" 
                  value={format(new Date(selected.createdAt), 'dd MMM yyyy, HH:mm:ss')} 
                />
                <InfoRow 
                  label="Billing Cycle" 
                  value={<span style={{ textTransform: 'capitalize' }}>{selected.billingCycle || 'monthly'}</span>} 
                />
                {selected.razorpayOrderId && (
                  <InfoRow 
                    label="Razorpay Order ID" 
                    value={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.razorpayOrderId}</span>} 
                  />
                )}
                {selected.razorpayPaymentId && (
                  <InfoRow 
                    label="Razorpay Payment ID" 
                    value={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.razorpayPaymentId}</span>} 
                  />
                )}
                {selected.refundId && (
                  <InfoRow 
                    label="Refund ID" 
                    value={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.refundId}</span>} 
                  />
                )}
              </div>
            </div>

            {/* Company Info */}
            {selected.company && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Company Information
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                  <Avatar name={selected.company.name} src={selected.company.branding?.logo} size={40} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {selected.company.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
                      /{selected.company.slug}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {selected.company.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Info */}
            {(selected.planName || selected.plan) && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Plan Information
                </div>
                <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {selected.planName || selected.plan?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {selected.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing
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
