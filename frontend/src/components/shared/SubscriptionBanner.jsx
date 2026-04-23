import React from 'react';
import { AlertCircle, Clock, CreditCard, Zap, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SubscriptionBanner({ 
  status, 
  trialEnd, 
  trialDaysRemaining, 
  plan,
  onPaymentClick,
  onDismiss 
}) {
  if (!status) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (onDismiss) onDismiss();
  };

  // Trial banner
  if (status === 'trial' && trialEnd) {
    const isUrgent = trialDaysRemaining <= 3;
    const isExpired = trialDaysRemaining <= 0;
    
    return (
      <div style={{
        display: 'flex',
        gap: 16,
        padding: '16px 20px',
        background: isExpired 
          ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))'
          : isUrgent 
          ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))'
          : 'linear-gradient(135deg, rgba(26,111,168,0.08), rgba(26,111,168,0.03))',
        border: isExpired 
          ? '2px solid rgba(239,68,68,0.3)'
          : isUrgent 
          ? '2px solid rgba(245,158,11,0.3)'
          : '2px solid rgba(26,111,168,0.3)',
        borderRadius: 12,
        marginBottom: 20,
        position: 'relative'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isExpired 
            ? 'rgba(239,68,68,0.15)'
            : isUrgent 
            ? 'rgba(245,158,11,0.15)'
            : 'rgba(26,111,168,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {isExpired ? (
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
          ) : isUrgent ? (
            <Clock size={20} style={{ color: '#f59e0b' }} />
          ) : (
            <Clock size={20} style={{ color: '#1a6fa8' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 16, 
            color: isExpired ? '#ef4444' : isUrgent ? '#f59e0b' : '#1a6fa8',
            marginBottom: 4 
          }}>
            {isExpired ? 'Trial Expired' : trialDaysRemaining === 1 ? 'Trial Ends Tomorrow' : `Trial Ends in ${trialDaysRemaining} Days`}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
            {isExpired 
              ? `Your trial period has ended. Complete payment to continue using ${plan?.name || 'your'} plan features.`
              : `Your ${plan?.name || ''} trial is ${isUrgent ? 'ending soon' : 'active'}. Complete payment to avoid interruption.`
            }
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button
            onClick={onPaymentClick}
            className="btn btn-primary btn-sm"
            style={{ 
              padding: '10px 20px', 
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <CreditCard size={14} />
            {isExpired ? 'Activate Now' : 'Upgrade Now'}
          </button>
          
          {onDismiss && (
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Expired subscription banner
  if (status === 'expired') {
    return (
      <div style={{
        display: 'flex',
        gap: 16,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))',
        border: '2px solid rgba(239,68,68,0.3)',
        borderRadius: 12,
        marginBottom: 20
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertCircle size={20} style={{ color: '#ef4444' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 16, 
            color: '#ef4444',
            marginBottom: 4 
          }}>
            Subscription Expired
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
            Your {plan?.name || 'subscription'} has expired. Renew your plan to restore full access to all features.
          </div>
        </div>

        <button
          onClick={onPaymentClick}
          className="btn btn-primary btn-sm"
          style={{ 
            padding: '10px 20px', 
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0
          }}
        >
          <CreditCard size={14} />
          Renew Now
        </button>
      </div>
    );
  }

  // Past due banner
  if (status === 'past_due') {
    return (
      <div style={{
        display: 'flex',
        gap: 16,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))',
        border: '2px solid rgba(245,158,11,0.3)',
        borderRadius: 12,
        marginBottom: 20
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertCircle size={20} style={{ color: '#f59e0b' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 16, 
            color: '#f59e0b',
            marginBottom: 4 
          }}>
            Payment Overdue
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
            We couldn't process your last payment. Update your payment method to continue using the service.
          </div>
        </div>

        <button
          onClick={onPaymentClick}
          className="btn btn-primary btn-sm"
          style={{ 
            padding: '10px 20px', 
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0
          }}
        >
          <CreditCard size={14} />
          Update Payment
        </button>
      </div>
    );
  }

  return null;
}
