const router   = require('express').Router({ mergeParams: true });
const ctrl     = require('../controllers/ticket.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { detectTenant, ensureSameTenant } = require('../middleware/tenant.middleware');
const upload   = require('../middleware/upload.middleware');
const { checkTicketLimit, incrementTicketUsage } = require('../middleware/feature.middleware');

router.use('/:companySlug', protect, detectTenant, ensureSameTenant);

router.get( '/:companySlug/tickets', ctrl.getTickets);

// Create ticket with limit check
router.post('/:companySlug/tickets',
  checkTicketLimit,
  upload.array('attachments', 5),
  async (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = (body) => {
      if (body?.success && req.companyId) {
        incrementTicketUsage(req.companyId).catch(() => {});
      }
      return originalSend(body);
    };
    next();
  },
  ctrl.createTicket
);

router.get(   '/:companySlug/tickets/:id', ctrl.getTicket);
router.put(   '/:companySlug/tickets/:id', authorize('company_super_admin','company_admin','employee','agent'), ctrl.updateTicket);
router.delete('/:companySlug/tickets/:id', authorize('company_super_admin','company_admin'), ctrl.deleteTicket);
router.put(   '/:companySlug/tickets/:id/assign', authorize('company_super_admin','company_admin','employee'), ctrl.assignTicket);
router.put(   '/:companySlug/tickets/:id/status', authorize('company_super_admin','company_admin','employee','agent'), ctrl.updateStatus);
router.post(  '/:companySlug/tickets/:id/notes',  authorize('company_super_admin','company_admin','employee','agent'), ctrl.addInternalNote);

module.exports = router;
