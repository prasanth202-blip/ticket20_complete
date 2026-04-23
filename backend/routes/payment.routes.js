const router = require('express').Router();
const ctrl   = require('../controllers/payment.controller');
const { protect, authorize, platformOwnerOnly } = require('../middleware/auth.middleware');
const { detectTenant, ensureSameTenant } = require('../middleware/tenant.middleware');

// Public key endpoint
router.get('/key', ctrl.getKey);

// Platform admin routes (must be before /:companySlug)
router.post('/admin/override-feature', protect, platformOwnerOnly, ctrl.overrideFeature);
router.get('/admin/transactions', protect, platformOwnerOnly, async (req, res) => {
  try {
    const PaymentTransaction = require('../models/PaymentTransaction');
    const { page=1, limit=20, companyId } = req.query;
    const query = companyId ? { company: companyId } : {};
    const [txs, total] = await Promise.all([
      PaymentTransaction.find(query).populate('company','name slug').populate('plan','name').sort({ createdAt:-1 }).skip((page-1)*limit).limit(parseInt(limit)),
      PaymentTransaction.countDocuments(query),
    ]);
    res.json({ success:true, data:txs, pagination:{ total, page:parseInt(page), pages:Math.ceil(total/limit) } });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// Company subscription management
router.use('/:companySlug', protect, detectTenant, ensureSameTenant);
router.post('/:companySlug/create-order',     authorize('company_super_admin','company_admin'), ctrl.createSubscriptionOrder);
router.post('/:companySlug/verify',           authorize('company_super_admin','company_admin'), ctrl.verifyPayment);
router.get( '/:companySlug/status',           ctrl.getSubscriptionStatus);
router.get( '/:companySlug/history',          ctrl.getPaymentHistory);
router.post('/:companySlug/proration',        authorize('company_super_admin','company_admin'), ctrl.calculateProration);

module.exports = router;
