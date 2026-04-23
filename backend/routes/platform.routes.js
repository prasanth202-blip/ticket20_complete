const router = require('express').Router();
const ctrl   = require('../controllers/platform.controller');
const { protect, platformOwnerOnly } = require('../middleware/auth.middleware');

router.use(protect, platformOwnerOnly);
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/companies', ctrl.getAllCompanies);
router.get('/companies/:id', ctrl.getCompanyById);
router.put('/companies/:id/approve', ctrl.approveCompany);
router.put('/companies/:id/reject', ctrl.rejectCompany);
router.put('/companies/:id/toggle-suspend', ctrl.toggleSuspendCompany);
router.put('/companies/:id', ctrl.updateCompany);
router.get('/tickets', ctrl.getAllTickets);
router.get('/subscriptions', ctrl.getSubscriptionPlans);
router.post('/subscriptions', ctrl.createSubscriptionPlan);
router.put('/subscriptions/:id', ctrl.updateSubscriptionPlan);
router.delete('/subscriptions/:id', ctrl.deleteSubscriptionPlan);
router.get('/analytics', ctrl.getAnalytics);

// Platform Settings — DB-persisted
router.get('/settings', ctrl.getPlatformSettings);
router.put('/settings', ctrl.updatePlatformSettings);

module.exports = router;
