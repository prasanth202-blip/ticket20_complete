const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/company.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { detectTenant, ensureSameTenant } = require('../middleware/tenant.middleware');
const upload = require('../middleware/upload.middleware');

// Public
router.get('/:companySlug/public', ctrl.getCompanyBySlug);
router.get('/plans', require('../controllers/platform.controller').getSubscriptionPlans);
router.get('/:companySlug/services/public', ctrl.getPublicServices);

// Protected
router.use('/:companySlug', protect, detectTenant, ensureSameTenant);
router.get('/:companySlug/dashboard', ctrl.getDashboard);
router.put('/:companySlug/settings', authorize('company_super_admin', 'company_admin'), ctrl.updateCompany);
router.post('/:companySlug/logo', authorize('company_super_admin', 'company_admin'), upload.logoUpload.single('logo'), ctrl.uploadLogo);
router.get('/:companySlug/staff', authorize('company_super_admin', 'company_admin'), ctrl.getStaff);
router.post('/:companySlug/staff', authorize('company_super_admin', 'company_admin'), ctrl.createStaff);
router.put('/:companySlug/staff/:userId', authorize('company_super_admin', 'company_admin'), ctrl.updateStaff);
router.delete('/:companySlug/staff/:userId', authorize('company_super_admin'), ctrl.deleteStaff);
router.get('/:companySlug/agents/performance', authorize('company_super_admin', 'company_admin'), ctrl.getAgentPerformance);

// Services
router.get('/:companySlug/services', ctrl.getServices);
router.post('/:companySlug/services', authorize('company_super_admin','company_admin'), ctrl.createService);
router.put('/:companySlug/services/:serviceId', authorize('company_super_admin','company_admin'), ctrl.updateService);
router.delete('/:companySlug/services/:serviceId', authorize('company_super_admin'), ctrl.deleteService);

module.exports = router;
