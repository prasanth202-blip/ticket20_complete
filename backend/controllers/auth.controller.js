const User         = require('../models/User');
const fs           = require('fs');
const path         = require('path');
const crypto       = require('crypto');
const Company      = require('../models/Company');
const Subscription = require('../models/Subscription');
const { generateToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
const slugify      = require('slugify');

// ── Platform Login ────────────────────────────────────────────────────────────
exports.platformLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required.' });
    const user = await User.findOne({ email, role:'platform_owner' }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success:false, message:'Invalid credentials.' });
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave:false });
    res.json({ success:true, token:generateToken(user._id, user.role), user:user.toJSON() });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Register Company ──────────────────────────────────────────────────────────
exports.registerCompany = async (req, res) => {
  try {
    const { companyName, companyEmail, companyPhone, companyAddress, adminName, adminEmail, adminPassword, subscriptionPlanId } = req.body;

    if (!companyName || !companyEmail || !adminName || !adminEmail || !adminPassword)
      return res.status(400).json({ success:false, message:'All required fields must be filled.' });

    if (await Company.findOne({ email:companyEmail.toLowerCase() }))
      return res.status(400).json({ success:false, message:'A company with this email is already registered.' });

    let base = slugify(companyName, { lower:true, strict:true });
    if (!base) base = 'company';
    let slug = base, n = 1;
    while (await Company.findOne({ slug })) slug = `${base}-${n++}`;

    let plan = null;
    if (subscriptionPlanId) plan = await Subscription.findById(subscriptionPlanId);
    if (!plan) plan = await Subscription.findOne({ slug:'starter' });

    // Set 7-day trial period
    const trialDays = 7;
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const company = await Company.create({
      name: companyName, slug, email: companyEmail,
      phone: companyPhone, address: companyAddress,
      subscriptionPlan: plan?._id,
      subscriptionStatus: 'trial',
      subscriptionExpiry: trialEnd,
      subscriptionStartedAt: trialStart,
      trialStart,
      trialEnd,
      status: 'pending',
    });

    const existingAdmin = await User.findOne({ email:adminEmail.toLowerCase() });
    if (existingAdmin) {
      await Company.findByIdAndDelete(company._id);
      return res.status(400).json({ success:false, message:'Admin email is already registered.' });
    }

    await User.create({
      name: adminName, email: adminEmail, password: adminPassword,
      role: 'company_super_admin', company: company._id,
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted! Awaiting platform approval.',
      data: { companySlug: slug, status: 'pending' },
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Company Staff Login ───────────────────────────────────────────────────────
exports.companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = req.company;
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required.' });
    const user = await User.findOne({ email:email.toLowerCase(), company:company._id }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success:false, message:'Invalid email or password.' });
    if (!user.isActive) return res.status(403).json({ success:false, message:'Account deactivated. Contact admin.' });
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave:false });
    await company.populate('subscriptionPlan', 'name limits features');
    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { ...user.toJSON(), companySlug: company.slug, company: { _id:company._id, name:company.name, slug:company.slug, branding:company.branding, settings:company.settings, subscriptionPlan:company.subscriptionPlan, subscriptionStatus:company.subscriptionStatus } },
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Register User (Customer) ──────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const company = req.company;

    if (!name || !email || !password)
      return res.status(400).json({ success:false, message:'Name, email, and password are required.' });
    if (!phone || !phone.trim())
      return res.status(400).json({ success:false, message:'Phone number is required.' });
    if (password.length < 6)
      return res.status(400).json({ success:false, message:'Password must be at least 6 characters.' });

    if (company.settings && !company.settings.allowUserRegistration)
      return res.status(403).json({ success:false, message:'This company has disabled self-registration.' });

    const existing = await User.findOne({ email:email.toLowerCase(), company:company._id });
    if (existing) return res.status(400).json({ success:false, message:'Email already registered.' });

    const user = await User.create({ name, email, password, phone, role:'user', company:company._id });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: generateToken(user._id, user.role),
      user: { ...user.toJSON(), companySlug: company.slug, company: { _id:company._id, name:company.name, slug:company.slug, branding:company.branding, settings:company.settings } },
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── User Login ────────────────────────────────────────────────────────────────
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = req.company;
    const user = await User.findOne({ email:email.toLowerCase(), company:company._id, role:'user' }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success:false, message:'Invalid email or password.' });
    if (!user.isActive) return res.status(403).json({ success:false, message:'Account deactivated.' });
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave:false });
    await company.populate('subscriptionPlan', 'name');
    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { ...user.toJSON(), companySlug: company.slug, company: { _id:company._id, name:company.name, slug:company.slug, branding:company.branding, settings:company.settings } },
    });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('company', 'name slug status settings branding subscriptionPlan subscriptionStatus');
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ success:false, message:'Name is required.' });
    if (!phone || !phone.trim())
      return res.status(400).json({ success:false, message:'Phone number is required.' });
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, updatedAt:Date.now() }, { new:true, runValidators:true });
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success:false, message:'New password must be at least 6 characters.' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success:false, message:'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    res.json({ success:true, message:'Password changed successfully.' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Upload Avatar ─────────────────────────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:'No image file uploaded.' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });

    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar    = avatarUrl;
    user.updatedAt = Date.now();
    await user.save({ validateBeforeSave:false });
    res.json({ success:true, user, avatarUrl });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.avatar    = null;
    user.updatedAt = Date.now();
    await user.save({ validateBeforeSave:false });
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Forgot Password (send reset email) ───────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email, companySlug } = req.body;
    if (!email) return res.status(400).json({ success:false, message:'Email is required.' });

    let user;
    if (companySlug) {
      const company = await Company.findOne({ slug: companySlug });
      if (company) user = await User.findOne({ email:email.toLowerCase(), company:company._id });
    } else {
      // Platform owner
      user = await User.findOne({ email:email.toLowerCase(), role:'platform_owner' });
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success:true, message:'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save({ validateBeforeSave:false });

    const resetUrl = companySlug
      ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/${companySlug}/reset-password/${resetToken}`
      : `${process.env.CLIENT_URL || 'http://localhost:5173'}/platform/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1a6fa8;margin-bottom:8px;">Reset Your Password</h2>
          <p style="color:#374151;margin-bottom:24px;">We received a request to reset the password for your account.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1a6fa8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
          <p style="color:#6b7280;margin-top:24px;font-size:13px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px;">If the button doesn't work, copy this link:<br/><a href="${resetUrl}" style="color:#1a6fa8;">${resetUrl}</a></p>
        </div>
      `,
    });

    res.json({ success:true, message:'If an account with that email exists, a reset link has been sent.' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ success:false, message:'Password must be at least 6 characters.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success:false, message:'Reset link is invalid or has expired.' });

    user.password             = password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpiry  = undefined;
    await user.save();

    res.json({ success:true, message:'Password reset successfully. You can now log in.' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};
