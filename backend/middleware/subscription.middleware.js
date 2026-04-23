const Company = require('../models/Company');

// Middleware to check if company has active subscription
exports.checkSubscription = (req, res, next) => {
  try {
    const company = req.company;
    
    if (!company) {
      return res.status(403).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    const now = new Date();
    let subscriptionStatus = company.subscriptionStatus;
    
    // Auto-update trial to expired if trial period is over
    if (subscriptionStatus === 'trial' && company.trialEnd && now > new Date(company.trialEnd)) {
      subscriptionStatus = 'expired';
      company.subscriptionStatus = 'expired';
      company.save({ validateBeforeSave: false });
    }
    
    // Auto-update active to expired if subscription period is over
    if (subscriptionStatus === 'active' && company.subscriptionExpiry && now > new Date(company.subscriptionExpiry)) {
      subscriptionStatus = 'expired';
      company.subscriptionStatus = 'expired';
      company.save({ validateBeforeSave: false });
    }

    // Allow access if subscription is active or in trial
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trial') {
      req.subscriptionStatus = subscriptionStatus;
      return next();
    }

    // Block access for expired subscriptions
    if (subscriptionStatus === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'Subscription expired. Please renew your plan to continue.',
        requiresPayment: true,
        subscriptionStatus: 'expired'
      });
    }

    // Block access for cancelled subscriptions
    if (subscriptionStatus === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Subscription cancelled. Please contact support.',
        subscriptionStatus: 'cancelled'
      });
    }

    // Block access for past due subscriptions
    if (subscriptionStatus === 'past_due') {
      return res.status(403).json({
        success: false,
        message: 'Payment overdue. Please update your payment method.',
        requiresPayment: true,
        subscriptionStatus: 'past_due'
      });
    }

    // Default: block access
    return res.status(403).json({
      success: false,
      message: 'Invalid subscription status. Please contact support.',
      subscriptionStatus
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error checking subscription status' 
    });
  }
};

// Middleware to check if payment is required (for expired trials)
exports.checkPaymentRequired = (req, res, next) => {
  try {
    const company = req.company;
    
    if (!company) {
      return res.status(403).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    const now = new Date();
    let subscriptionStatus = company.subscriptionStatus;
    
    // Auto-update statuses
    if (subscriptionStatus === 'trial' && company.trialEnd && now > new Date(company.trialEnd)) {
      subscriptionStatus = 'expired';
      company.subscriptionStatus = 'expired';
      company.save({ validateBeforeSave: false });
    }
    
    if (subscriptionStatus === 'active' && company.subscriptionExpiry && now > new Date(company.subscriptionExpiry)) {
      subscriptionStatus = 'expired';
      company.subscriptionStatus = 'expired';
      company.save({ validateBeforeSave: false });
    }

    // Check if payment is required
    const requiresPayment = subscriptionStatus === 'expired' || subscriptionStatus === 'past_due';
    
    if (requiresPayment) {
      return res.status(402).json({
        success: false,
        message: 'Payment required to continue using the service.',
        requiresPayment: true,
        subscriptionStatus,
        trialDaysRemaining: 0,
        plan: company.subscriptionPlan
      });
    }

    // If in trial, include trial info
    let trialDaysRemaining = 0;
    if (subscriptionStatus === 'trial' && company.trialEnd) {
      trialDaysRemaining = Math.ceil((new Date(company.trialEnd) - now) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, trialDaysRemaining);
    }

    req.subscriptionStatus = subscriptionStatus;
    req.trialDaysRemaining = trialDaysRemaining;
    
    next();

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error checking payment requirement' 
    });
  }
};

// Middleware to add subscription info to request
exports.addSubscriptionInfo = (req, res, next) => {
  try {
    const company = req.company;
    
    if (!company) {
      return next();
    }

    const now = new Date();
    let subscriptionStatus = company.subscriptionStatus;
    
    // Auto-update statuses
    if (subscriptionStatus === 'trial' && company.trialEnd && now > new Date(company.trialEnd)) {
      subscriptionStatus = 'expired';
      company.subscriptionStatus = 'expired';
      company.save({ validateBeforeSave: false });
    }
    
    if (subscriptionStatus === 'active' && company.subscriptionExpiry && now > new Date(company.subscriptionExpiry)) {
      subscriptionStatus = 'expired';
      company.subscriptionStatus = 'expired';
      company.save({ validateBeforeSave: false });
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (subscriptionStatus === 'trial' && company.trialEnd) {
      trialDaysRemaining = Math.ceil((new Date(company.trialEnd) - now) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, trialDaysRemaining);
    }

    req.subscriptionStatus = subscriptionStatus;
    req.trialDaysRemaining = trialDaysRemaining;
    req.requiresPayment = subscriptionStatus === 'expired' || subscriptionStatus === 'past_due';
    
    next();

  } catch (error) {
    next();
  }
};
