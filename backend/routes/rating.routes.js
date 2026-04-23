const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/rating.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { detectTenant, ensureSameTenant } = require('../middleware/tenant.middleware');

router.use('/:companySlug', protect, detectTenant, ensureSameTenant);
router.post('/:companySlug/tickets/:ticketId/rate', authorize('user'), ctrl.createRating);
router.get('/:companySlug/ratings', authorize('company_super_admin','company_admin'), ctrl.getCompanyRatings);
router.get('/:companySlug/agents/:agentId/ratings', authorize('company_super_admin','company_admin'), ctrl.getAgentRatings);

module.exports = router;