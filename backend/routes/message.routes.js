const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const { detectTenant, ensureSameTenant } = require('../middleware/tenant.middleware');
const upload = require('../middleware/upload.middleware');

router.use('/:companySlug', protect, detectTenant, ensureSameTenant);
router.route('/:companySlug/tickets/:ticketId/messages').get(ctrl.getMessages).post(upload.array('attachments', 3), ctrl.sendMessage);
router.put('/:companySlug/tickets/:ticketId/messages/read', ctrl.markRead);

module.exports = router;
