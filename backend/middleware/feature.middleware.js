const Company      = require('../models/Company');
const Subscription = require('../models/Subscription');

/**
 * Feature flag middleware.
 * Checks if company's plan (+ overrides) has a given feature enabled.
 * Usage: router.post('/analytics', checkFeature('advanced_analytics'), ctrl.getAnalytics)
 */
exports.checkFeature = (featureName) => async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.company?._id;
    if (!companyId) return res.status(403).json({ success:false, message:'No company context.' });

    const company = await Company.findById(companyId).populate('subscriptionPlan', 'features');
    if (!company) return res.status(404).json({ success:false, message:'Company not found.' });

    // Platform owners bypass all checks
    if (req.user?.role === 'platform_owner') return next();

    // Check subscription status
    if (!['active','trial'].includes(company.subscriptionStatus)) {
      return res.status(402).json({
        success: false,
        message: `Your subscription is ${company.subscriptionStatus}. Please renew to access this feature.`,
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    // Check feature override first, then plan
    let hasFeature = false;
    if (company.featureOverrides && company.featureOverrides.has(featureName)) {
      hasFeature = company.featureOverrides.get(featureName);
    } else if (company.subscriptionPlan?.features) {
      hasFeature = !!company.subscriptionPlan.features[featureName];
    }

    if (!hasFeature) {
      return res.status(402).json({
        success: false,
        message: `The feature "${featureName}" is not available on your current plan. Please upgrade.`,
        code: 'FEATURE_NOT_AVAILABLE',
        feature: featureName,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Check ticket creation limit for the month
 */
exports.checkTicketLimit = async (req, res, next) => {
  try {
    if (req.user?.role === 'platform_owner') return next();

    const companyId = req.companyId;
    const company = await Company.findById(companyId).populate('subscriptionPlan', 'limits');
    if (!company) return next();

    // Reset monthly counter if needed
    const now = new Date();
    const lastReset = company.usage?.resetAt;
    if (!lastReset || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      company.usage.ticketsThisMonth = 0;
      company.usage.resetAt = now;
      await company.save({ validateBeforeSave: false });
    }

    const limit = company.subscriptionPlan?.limits?.max_tickets_per_month || 500;
    const used  = company.usage?.ticketsThisMonth || 0;

    if (used >= limit) {
      return res.status(402).json({
        success: false,
        message: `Monthly ticket limit reached (${used}/${limit}). Please upgrade your plan.`,
        code: 'TICKET_LIMIT_EXCEEDED',
        used, limit,
      });
    }

    // Attach to req for post-creation increment
    req.ticketLimitInfo = { company, limit, used };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Increment ticket count after successful creation
 */
exports.incrementTicketUsage = async (companyId) => {
  await Company.findByIdAndUpdate(companyId, { $inc: { 'usage.ticketsThisMonth': 1 } });
};

/**
 * Check storage limit for file uploads
 */
exports.checkStorageLimit = async (req, res, next) => {
  try {
    if (req.user?.role === 'platform_owner') return next();

    const companyId = req.companyId;
    const company = await Company.findById(companyId).populate('subscriptionPlan', 'limits');
    if (!company) return next();

    const limitGb    = company.subscriptionPlan?.limits?.storage_limit_gb || 1;
    const limitMb    = limitGb * 1024;
    const usedMb     = company.usage?.storageUsedMb || 0;

    // Check incoming file sizes
    const incomingMb = (req.files || []).reduce((sum, f) => sum + f.size / 1024 / 1024, 0);
    if (usedMb + incomingMb > limitMb) {
      return res.status(402).json({
        success: false,
        message: `Storage limit exceeded (${usedMb.toFixed(0)} MB / ${limitMb} MB). Please upgrade.`,
        code: 'STORAGE_LIMIT_EXCEEDED',
      });
    }

    req.incomingFileMb = incomingMb;
    next();
  } catch (err) {
    next(err);
  }
};
