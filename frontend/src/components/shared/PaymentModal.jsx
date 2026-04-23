import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Modal } from './';

const fmtINR = (paise) => `Rs.${Math.floor(paise / 100).toLocaleString('en-IN')}`;

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  plan, 
  billingCycle = 'monthly',
  forceShow = false,
  message = null 
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [razorKey, setRazorKey] = useState('');
  const [order, setOrder] = useState(null);

  // Load Razorpay key when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRazorpayKey();
    }
  }, [isOpen]);

  const loadRazorpayKey = async () => {
    try {
      const res = await paymentAPI.getKey();
      setRazorKey(res.data.key);
    } catch (error) {
      console.error('Failed to load Razorpay key:', error);
    }
  };

  const handlePayment = async () => {
    if (!plan) {
      toast.error('No plan selected');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const slug = user?.company?.slug;
      const orderRes = await paymentAPI.createOrder(slug, { 
        planId: plan._id, 
        billingCycle 
      });
      const orderData = orderRes.data.data;
      setOrder(orderData);

      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load payment gateway. Check your internet connection.');
        setLoading(false);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: razorKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TicketFlow',
        description: `${plan.name} Plan - ${billingCycle}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#1a6fa8' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled. No subscription was activated.');
          },
        },
        handler: async (response) => {
          setProcessing(true);
          try {
            const slug = user?.company?.slug;
            const verifyRes = await paymentAPI.verify(slug, {
              txId: orderData.txId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
              billingCycle,
            });
            
            toast.success(verifyRes.data.message || 'Payment successful! Subscription activated.');
            onClose();
            
            // Reload page to update subscription status
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed. Contact support if money was deducted.');
          } finally {
            setProcessing(false);
            setLoading(false);
          }
        },
      };

      new window.Razorpay(options).open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment. Try again.');
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleDemoPayment = async () => {
    if (!plan) return;
    
    setLoading(true);
    try {
      const slug = user?.company?.slug;
      
      // Create order first
      const orderRes = await paymentAPI.createOrder(slug, { 
        planId: plan._id, 
        billingCycle 
      });
      const orderData = orderRes.data.data;
      
      // Simulate demo payment
      const tid = toast.loading('Processing demo payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify demo payment
      const verifyRes = await paymentAPI.verify(slug, {
        txId: orderData.txId,
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: `pay_DEMO_${Date.now()}`,
        planId: plan._id,
        billingCycle,
      });
      
      toast.success(verifyRes.data.message, { id: tid });
      onClose();
      
      // Reload page to update subscription status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Demo payment failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDemoMode = !razorKey || razorKey.includes('DEMO');
  const price = billingCycle === 'yearly' ? plan?.price?.yearly : plan?.price?.monthly;

  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <div style={{ padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(26,111,168,0.15), rgba(139,92,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CreditCard size={24} style={{ color: '#1a6fa8' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                Complete Payment
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, marginTop: 2 }}>
                Activate your subscription to continue using all features
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', 
              color: 'var(--muted)', cursor: 'pointer',
              padding: 4, borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning Message */}
        {message && (
          <div style={{ 
            display: 'flex', gap: 12, padding: 14,
            background: 'rgba(245,158,11,0.08)', 
            border: '1px solid rgba(245,158,11,0.2)', 
            borderRadius: 10, marginBottom: 20
          }}>
            <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                Action Required
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                {message}
              </div>
            </div>
          </div>
        )}

        {/* Plan Details */}
        {plan && (
          <div style={{ 
            padding: 20, background: 'var(--surface2)', 
            borderRadius: 12, border: '1px solid var(--border)',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {plan.name} Plan
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, marginTop: 4 }}>
                  {billingCycle === 'yearly' ? 'Annual billing' : 'Monthly billing'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, fontWeight: 800, color: '#1a6fa8' }}>
                  {fmtINR(price)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </div>
              </div>
            </div>

            {/* Features */}
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              What's included:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                `${plan.limits?.max_agents || 'Unlimited'} Agents`,
                `${plan.limits?.max_tickets_per_month?.toLocaleString() || 'Unlimited'} Tickets/month`,
                `${plan.limits?.storage_limit_gb || 'Unlimited'} GB Storage`,
                ...(plan.features_display || []).slice(0, 2)
              ].map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text)' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div style={{ 
            display: 'flex', gap: 12, padding: 14,
            background: 'rgba(16,185,129,0.08)', 
            border: '1px solid rgba(16,185,129,0.2)', 
            borderRadius: 10, marginBottom: 24
          }}>
            <Zap size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                Demo Mode
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                No real payment will be processed. This is a demo payment for testing purposes.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={loading || processing}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={isDemoMode ? handleDemoPayment : handlePayment}
            disabled={loading || processing || !plan}
            className="btn btn-primary"
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {(loading || processing) ? (
              <>
                <Spinner size={16} />
                {processing ? 'Verifying...' : 'Processing...'}
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Pay {fmtINR(price)}
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 8, 
          marginTop: 20, padding: 12, 
          background: 'var(--surface)', borderRadius: 8 
        }}>
          <CheckCircle size={16} style={{ color: '#10b981' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Secured by Razorpay. Your payment information is safe and encrypted.
          </span>
        </div>
      </div>
    </Modal>
  );
}
