const router  = require('express').Router();
const auth    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { detectTenant } = require('../middleware/tenant.middleware');
const upload  = require('../middleware/upload.middleware');

// Platform
router.post('/platform/login',         auth.platformLogin);
router.post('/register/company',       auth.registerCompany);
router.post('/:companySlug/login',     detectTenant, auth.companyLogin);

// User (customer)
router.post('/:companySlug/user/register', detectTenant.allowPending, auth.registerUser);
router.post('/:companySlug/user/login',    detectTenant.allowPending, auth.userLogin);

// Forgot / Reset password
router.post('/forgot-password',            auth.forgotPassword);
router.post('/:companySlug/forgot-password', auth.forgotPassword);
router.post('/reset-password/:token',      auth.resetPassword);

// Protected
router.get('/me',              protect, auth.getMe);
router.put('/profile',         protect, auth.updateProfile);
router.put('/change-password', protect, auth.changePassword);
router.post('/avatar',         protect, upload.avatarUpload.single('avatar'), auth.uploadAvatar);
router.delete('/avatar',       protect, auth.removeAvatar);

module.exports = router;
