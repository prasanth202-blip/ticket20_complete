const Company            = require('../models/Company');
const Subscription       = require('../models/Subscription');
const PaymentTransaction = require('../models/PaymentTransaction');
const { createOrder, verifySignature, getRazorpayKeyId, isConfigured } = require('../utils/razorpay');

// ── Get Razorpay key (frontend needs it to init checkout) ─────────────────────
exports.getKey = (req, res) => {
  const key = getRazorpayKeyId();
  res.json({ success: true, key, configured: !!key });
};

// ── Create Razorpay order ─────────────────────────────────────────────────────
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const plan = await Subscription.findById(planId);
    if (!plan) return res.status(404).json({ success:false, message:'Plan not found.' });

    // Amount in paise
    const amountPaise = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;

    // Create transaction record
    const tx = await PaymentTransaction.create({
      company:         req.user.company,
      plan:            plan._id,
      planName:        plan.name,
      billingCycle,
      amount:          amountPaise,
      amountFormatted: `₹${(amountPaise/100).toLocaleString('en-IN')}`,
      status:          'created',
      initiatedBy:     req.user._id,
      isDemo:          false,
    });

    // Razorpay MUST be configured — no demo bypass
    if (!isConfigured()) {
      await PaymentTransaction.findByIdAndDelete(tx._id);
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file (get test keys from dashboard.razorpay.com).',
      });
    }

    let order;
    try {
      order = await createOrder({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  `tx_${tx._id}`,
        notes:    { txId: tx._id.toString(), planId, billingCycle },
      });
      await PaymentTransaction.findByIdAndUpdate(tx._id, { razorpay_order_id: order.id });
    } catch (razorErr) {
      await PaymentTransaction.findByIdAndUpdate(tx._id, { status: 'failed', failReason: razorErr.message });
      return res.status(502).json({ success: false, message: `Razorpay error: ${razorErr.message}` });
    }

    res.json({
      success: true,
      data: {
        txId:        tx._id,
        orderId:     order.id,
        amount:      order.amount,
        currency:    order.currency,
        keyId:       getRazorpayKeyId(),
        planName:    plan.name,
        billingCycle,
        isDemoMode:  order.id.startsWith('order_DEMO'),
      },
    });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── Verify payment & activate subscription ────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { txId, razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;

    const tx = await PaymentTransaction.findById(txId);
    if (!tx) return res.status(404).json({ success:false, message:'Transaction not found.' });

    // Verify Razorpay signature — MANDATORY for all real payments
    const isDemoMode = razorpay_order_id?.startsWith('order_DEMO') || tx.isDemo;
    if (!isDemoMode) {
      if (!razorpay_signature || !razorpay_payment_id) {
        await PaymentTransaction.findByIdAndUpdate(txId, { status:'failed', failReason:'Missing payment credentials' });
        return res.status(400).json({ success:false, message:'Payment credentials missing. Payment not activated.' });
      }
      const isValid = verifySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
      if (!isValid) {
        await PaymentTransaction.findByIdAndUpdate(txId, { status:'failed', failReason:'Invalid signature' });
        return res.status(400).json({ success:false, message:'Payment verification failed — invalid signature. Subscription NOT activated.' });
      }
    }

    const plan    = await Subscription.findById(planId || tx.plan);
    const company = await Company.findById(req.user.company).populate('subscriptionPlan');
    if (!plan || !company) return res.status(404).json({ success:false, message:'Plan or company not found.' });

    // Determine change type
    const previousPlanId = company.subscriptionPlan?._id;
    let changeType = 'new';
    if (previousPlanId) {
      const prevPlan = await Subscription.findById(previousPlanId);
      if (prevPlan) {
        changeType = plan.price.monthly > prevPlan.price.monthly ? 'upgrade' : 'downgrade';
        if (plan._id.toString() === prevPlan._id.toString()) changeType = 'renewal';
      }
    }

    // Calculate expiry
    const now    = new Date();
    const expiry = new Date(now);
    if ((billingCycle || tx.billingCycle) === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
    else expiry.setMonth(expiry.getMonth() + 1);

    // Update transaction
    await PaymentTransaction.findByIdAndUpdate(txId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status:       'paid',
      changeType,
      previousPlan: previousPlanId,
      periodStart:  now,
      periodEnd:    expiry,
    });

    // Update company
    company.subscriptionPlan         = plan._id;
    company.subscriptionStatus        = 'active';
    company.subscriptionExpiry        = expiry;
    company.subscriptionBillingCycle  = billingCycle || tx.billingCycle;
    company.subscriptionStartedAt     = company.subscriptionStartedAt || now;
    company.lastPaymentAt             = now;
    company.nextBillingAt             = expiry;
    company.razorpay.orderId          = razorpay_order_id;
    company.razorpay.paymentId        = razorpay_payment_id;
    // Clear trial dates when payment is successful
    company.trialStart                = undefined;
    company.trialEnd                  = undefined;

    // Reset ticket usage on renewal
    if (changeType === 'renewal') company.usage.ticketsThisMonth = 0;

    company.auditLog.push({
      action:  `Subscription ${changeType}: ${plan.name}`,
      by:      req.user._id,
      details: { planId: plan._id, billingCycle, amount: tx.amount, isDemoMode },
    });

    await company.save();

    res.json({
      success: true,
      message: isDemoMode
        ? `✅ Demo payment successful! ${plan.name} plan activated.`
        : `✅ Payment confirmed! ${plan.name} plan activated.`,
      data: {
        plan:    plan.name,
        expiry,
        status:  'active',
        txId,
        isDemoMode,
      },
    });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── Get subscription status ───────────────────────────────────────────────────
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company).populate('subscriptionPlan');
    if (!company) return res.status(404).json({ success:false, message:'Company not found.' });

    const now = new Date();
    
    // Handle trial expiration
    if (company.subscriptionStatus === 'trial' && company.trialEnd && now > new Date(company.trialEnd)) {
      company.subscriptionStatus = 'expired';
      await company.save({ validateBeforeSave: false });
    }
    
    // Auto-expire check for active subscriptions
    if (company.subscriptionExpiry && now > new Date(company.subscriptionExpiry) && company.subscriptionStatus === 'active') {
      company.subscriptionStatus = 'expired';
      await company.save({ validateBeforeSave: false });
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (company.subscriptionStatus === 'trial' && company.trialEnd) {
      trialDaysRemaining = Math.ceil((new Date(company.trialEnd) - now) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, trialDaysRemaining);
    }

    res.json({
      success: true,
      data: {
        plan:         company.subscriptionPlan,
        status:       company.subscriptionStatus,
        expiry:       company.subscriptionExpiry,
        trialEnd:     company.trialEnd,
        trialDaysRemaining,
        billingCycle: company.subscriptionBillingCycle,
        startedAt:    company.subscriptionStartedAt,
        lastPayment:  company.lastPaymentAt,
        nextBilling:  company.nextBillingAt,
        usage:        company.usage,
        featureOverrides: Object.fromEntries(company.featureOverrides || new Map()),
      },
    });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── Get payment history for a company ────────────────────────────────────────
exports.getPaymentHistory = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.user.company;
    const txs = await PaymentTransaction.find({ company: companyId })
      .populate('plan', 'name price').sort({ createdAt: -1 }).limit(50);
    res.json({ success:true, data: txs });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── Platform admin: override feature for company ──────────────────────────────
exports.overrideFeature = async (req, res) => {
  try {
    const { companyId, feature, enabled } = req.body;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success:false, message:'Company not found.' });

    if (!company.featureOverrides) company.featureOverrides = new Map();
    company.featureOverrides.set(feature, !!enabled);
    company.auditLog.push({
      action:  `Feature override: ${feature} = ${enabled}`,
      by:      req.user._id,
      details: { feature, enabled },
    });
    await company.save();

    res.json({ success:true, message:`Feature "${feature}" ${enabled ? 'enabled' : 'disabled'} for ${company.name}` });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── Prorated upgrade calculation ──────────────────────────────────────────────
exports.calculateProration = async (req, res) => {
  try {
    const { newPlanId, billingCycle } = req.body;
    const company = await Company.findById(req.user.company).populate('subscriptionPlan');
    const newPlan = await Subscription.findById(newPlanId);
    if (!company || !newPlan) return res.status(404).json({ success:false, message:'Not found.' });

    const now      = new Date();
    const expiry   = new Date(company.subscriptionExpiry || now);
    const total    = expiry.getTime() - (company.subscriptionStartedAt || now).getTime();
    const remaining= expiry.getTime() - now.getTime();
    const daysRem  = Math.max(0, Math.round(remaining / 86400000));

    const currentMonthly = company.subscriptionPlan?.price?.monthly || 0;
    const newMonthly     = billingCycle === 'yearly' ? newPlan.price.yearly : newPlan.price.monthly;
    const credit         = total > 0 ? Math.round((remaining / total) * currentMonthly) : 0;
    const proratedAmount = Math.max(0, newMonthly - credit);

    res.json({
      success: true,
      data: {
        currentPlan:    company.subscriptionPlan?.name,
        newPlan:        newPlan.name,
        daysRemaining:  daysRem,
        creditAmount:   credit,
        fullAmount:     newMonthly,
        proratedAmount,
        displayAmount:  `₹${(proratedAmount/100).toLocaleString('en-IN')}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};
