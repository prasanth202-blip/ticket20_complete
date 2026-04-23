const Company = require('../models/Company');

/**
 * detectTenant — finds company by slug, attaches req.company + req.companyId.
 * By default blocks non-approved companies (pass allowPending:true to skip).
 */
exports.detectTenant = (opts = {}) => async (req, res, next) => {
  try {
    const slug =
      req.params.companySlug ||
      req.headers['x-company-slug'] ||
      req.body?.companySlug;

    if (!slug) return res.status(400).json({ success:false, message:'Company slug required.' });

    const company = await Company.findOne({ slug: slug.toLowerCase() })
      .populate('subscriptionPlan', 'name limits features price');

    if (!company) return res.status(404).json({ success:false, message:'Company not found. Please check the URL.' });

    // For user register/login — only block suspended/rejected
    if (!opts.allowPending && !['approved','trial'].includes(company.status)) {
      if (['rejected','suspended'].includes(company.status)) {
        return res.status(403).json({
          success: false,
          message: `This company account is ${company.status}. Please contact support.`,
        });
      }
      // pending — allow for public endpoints only
      if (company.status === 'pending' && !opts.allowPending) {
        return res.status(403).json({
          success: false,
          message: 'This company is pending approval. Please check back after approval.',
        });
      }
    }

    req.company   = company;
    req.companyId = company._id;
    next();
  } catch (err) { next(err); }
};

// Backwards compat — old middleware used without options
const detectTenantMiddleware = exports.detectTenant();
exports.detectTenant = Object.assign(detectTenantMiddleware, {
  allowPending: exports.detectTenant({ allowPending: true }),
});

exports.ensureSameTenant = (req, res, next) => {
  if (req.user?.role === 'platform_owner') return next();
  if (!req.user?.company) return res.status(403).json({ success:false, message:'User has no associated company.' });

  const userCompanyId = req.user.company._id?.toString() || req.user.company.toString();
  const reqCompanyId  = req.companyId?.toString();

  if (userCompanyId !== reqCompanyId) {
    return res.status(403).json({ success:false, message:'Access denied. Cross-company access is not allowed.' });
  }
  next();
};
