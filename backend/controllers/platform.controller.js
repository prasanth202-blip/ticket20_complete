const Company            = require('../models/Company');
const User               = require('../models/User');
const Ticket             = require('../models/Ticket');
const Subscription       = require('../models/Subscription');
const Rating             = require('../models/Rating');
const PlatformSettings   = require('../models/PlatformSettings');
const { sendCompanyApprovedEmail, sendEmail } = require('../utils/email');

const SETTINGS_KEY = 'global';

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalCompanies, pendingCompanies, approvedCompanies,
      totalUsers, totalTickets, openTickets, totalAgents,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'pending' }),
      Company.countDocuments({ status: 'approved' }),
      User.countDocuments({ role: 'user' }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['open', 'assigned', 'in_progress'] } }),
      User.countDocuments({ role: 'agent' }),
    ]);

    const activeCompanies = await Company.find({ status: 'approved' }).populate('subscriptionPlan', 'price');
    const monthlyRevenue = activeCompanies.reduce((sum, c) => sum + (c.subscriptionPlan?.price?.monthly || 0), 0);

    const recentTickets = await Ticket.find()
      .sort({ createdAt: -1 }).limit(10)
      .populate('company', 'name slug')
      .populate('createdBy', 'name email');

    const companiesByStatus = await Company.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    res.json({ success: true, data: { totalCompanies, pendingCompanies, approvedCompanies, totalUsers, totalTickets, openTickets, totalAgents, monthlyRevenue, recentTickets, companiesByStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await Company.countDocuments(query);
    const companies = await Company.find(query).populate('subscriptionPlan', 'name price').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: companies, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('subscriptionPlan');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    const [ticketCount, userCount, agentCount] = await Promise.all([
      Ticket.countDocuments({ company: company._id }),
      User.countDocuments({ company: company._id, role: 'user' }),
      User.countDocuments({ company: company._id, role: 'agent' }),
    ]);
    res.json({ success: true, data: { ...company.toObject(), stats: { ticketCount, userCount, agentCount } } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.approveCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { status: 'approved', rejectionReason: null }, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    // Apply current trial period from platform settings
    const settings = await PlatformSettings.findOne({ key: SETTINGS_KEY });
    const trialDays = settings?.maxTrialDays || 14;
    company.subscriptionExpiry = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    await company.save({ validateBeforeSave: false });

    const admin = await User.findOne({ company: company._id, role: 'company_super_admin' });
    if (admin) await sendCompanyApprovedEmail({ to: admin.email, companyName: company.name, slug: company.slug });
    res.json({ success: true, message: 'Company approved.', data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.rejectCompany = async (req, res) => {
  try {
    const { reason } = req.body;
    const company = await Company.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason }, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    const admin = await User.findOne({ company: company._id, role: 'company_super_admin' });
    if (admin) await sendEmail({ to: admin.email, subject: 'Registration Rejected', html: `<p>Your company <strong>${company.name}</strong> was rejected. ${reason ? 'Reason: ' + reason : ''}</p>` });
    res.json({ success: true, message: 'Company rejected.', data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleSuspendCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    company.status = company.status === 'suspended' ? 'approved' : 'suspended';
    await company.save();
    res.json({ success: true, message: `Company ${company.status}.`, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await Subscription.find().sort({ order: 1 });
    res.json({ success: true, data: plans });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createSubscriptionPlan = async (req, res) => {
  try {
    const plan = await Subscription.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const plan = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, data: plan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, companyId } = req.query;
    const query = {};
    if (status)    query.status   = status;
    if (priority)  query.priority = priority;
    if (companyId) query.company  = companyId;
    const total   = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('company', 'name slug').populate('createdBy', 'name email').populate('assignedTo', 'name email')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: tickets, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [byStatus, byPriority, companiesByPlan, monthlyTickets] = await Promise.all([
      require('../models/Ticket').aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      require('../models/Ticket').aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      require('../models/Company').aggregate([
        { $lookup: { from: 'subscriptions', localField: 'subscriptionPlan', foreignField: '_id', as: 'plan' } },
        { $group: { _id: { $arrayElemAt: ['$plan.name', 0] }, count: { $sum: 1 } } },
      ]),
      require('../models/Ticket').aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    res.json({ success: true, data: { byStatus, byPriority, companiesByPlan, monthlyTickets } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCompany = async (req, res) => {
  try {
    const { name, phone, address, website, description, subscriptionPlanId, subscriptionStatus } = req.body;
    const updates = {};
    if (name)               updates.name               = name;
    if (phone !== undefined)updates.phone               = phone;
    if (address !== undefined) updates.address          = address;
    if (website !== undefined) updates.website          = website;
    if (description !== undefined) updates.description  = description;
    if (subscriptionPlanId) updates.subscriptionPlan    = subscriptionPlanId;
    if (subscriptionStatus) updates.subscriptionStatus  = subscriptionStatus;
    updates.updatedAt = Date.now();

    const company = await require('../models/Company').findByIdAndUpdate(req.params.id, updates, { new:true, runValidators:true });
    if (!company) return res.status(404).json({ success:false, message:'Company not found.' });

    company.auditLog.push({ action:'Company updated by platform admin', by:req.user._id, details:updates });
    await company.save({ validateBeforeSave: false });

    res.json({ success:true, message:'Company updated.', data:company });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Platform Settings (persisted in DB) ─────────────────────────────────────
exports.getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({ key: SETTINGS_KEY });
    if (!settings) {
      settings = await PlatformSettings.create({ key: SETTINGS_KEY });
    }
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updatePlatformSettings = async (req, res) => {
  try {
    const {
      platformName, platformEmail, supportEmail,
      smtpHost, smtpPort, smtpUser, smtpPass,
      emailNotifications, maintenanceMode,
      allowCompanyRegistration, requireApproval, maxTrialDays,
    } = req.body;

    const updates = { updatedAt: Date.now() };
    if (platformName !== undefined)             updates.platformName             = platformName;
    if (platformEmail !== undefined)            updates.platformEmail            = platformEmail;
    if (supportEmail !== undefined)             updates.supportEmail             = supportEmail;
    if (smtpHost !== undefined)                 updates.smtpHost                 = smtpHost;
    if (smtpPort !== undefined)                 updates.smtpPort                 = smtpPort;
    if (smtpUser !== undefined)                 updates.smtpUser                 = smtpUser;
    if (smtpPass !== undefined)                 updates.smtpPass                 = smtpPass;
    if (emailNotifications !== undefined)       updates.emailNotifications       = emailNotifications;
    if (maintenanceMode !== undefined)          updates.maintenanceMode          = maintenanceMode;
    if (allowCompanyRegistration !== undefined) updates.allowCompanyRegistration = allowCompanyRegistration;
    if (requireApproval !== undefined)          updates.requireApproval          = requireApproval;
    if (maxTrialDays !== undefined)             updates.maxTrialDays             = Number(maxTrialDays);

    const settings = await PlatformSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings, message: 'Settings saved successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
