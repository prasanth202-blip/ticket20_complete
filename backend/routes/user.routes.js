const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { detectTenant, ensureSameTenant } = require('../middleware/tenant.middleware');

router.use('/:companySlug', protect, detectTenant, ensureSameTenant);
router.get('/:companySlug/users/dashboard', ctrl.getUserDashboard);
router.get('/:companySlug/users', authorize('company_super_admin','company_admin','employee'), ctrl.getUsers);
router.get('/:companySlug/users/:userId', authorize('company_super_admin','company_admin'), ctrl.getUserById);
router.put('/:companySlug/users/:userId/toggle', authorize('company_super_admin','company_admin'), ctrl.toggleUserStatus);

module.exports = router;
