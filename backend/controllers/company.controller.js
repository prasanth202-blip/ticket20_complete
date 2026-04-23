const Company  = require('../models/Company');
const User     = require('../models/User');
const Ticket   = require('../models/Ticket');
const Rating   = require('../models/Rating');
const path     = require('path');
const fs       = require('fs');

exports.getCompanyBySlug = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.companySlug })
      .populate('subscriptionPlan', 'name limits');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    // Handle text fields
    const textFields = ['name','phone','address','website','description'];
    textFields.forEach(f => { if (req.body[f] !== undefined) company[f] = req.body[f]; });

    // Handle branding (JSON string or object)
    if (req.body.branding) {
      let branding = req.body.branding;
      if (typeof branding === 'string') branding = JSON.parse(branding);
      // Keep logo URL if uploaded separately
      company.branding = { ...company.branding.toObject?.() || company.branding, ...branding };
    }

    // Handle settings (JSON string or object)
    if (req.body.settings) {
      let settings = req.body.settings;
      if (typeof settings === 'string') settings = JSON.parse(settings);
      company.settings = { ...company.settings.toObject?.() || company.settings, ...settings };
    }

    company.updatedAt = Date.now();
    await company.save();
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Upload company logo ───────────────────────────────────────────────────────
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No logo file uploaded.' });

    const company = await Company.findById(req.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    // Delete old logo if it's a local file
    if (company.branding?.logo && company.branding.logo.startsWith('/uploads/logos/')) {
      const oldPath = path.join(__dirname, '..', company.branding.logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    if (!company.branding) company.branding = {};
    company.branding.logo = logoUrl;
    company.updatedAt = Date.now();
    await company.save();

    res.json({ success: true, data: company, logoUrl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getDashboard = async (req, res) => {
  try {
    const cid = req.companyId;
    const [total, open, assigned, inProgress, resolved, closed, totalAgents, totalUsers] = await Promise.all([
      Ticket.countDocuments({ company: cid }),
      Ticket.countDocuments({ company: cid, status: 'open' }),
      Ticket.countDocuments({ company: cid, status: 'assigned' }),
      Ticket.countDocuments({ company: cid, status: 'in_progress' }),
      Ticket.countDocuments({ company: cid, status: 'resolved' }),
      Ticket.countDocuments({ company: cid, status: 'closed' }),
      User.countDocuments({ company: cid, role: 'agent', isActive: true }),
      User.countDocuments({ company: cid, role: 'user', isActive: true }),
    ]);

    const recentTickets = await Ticket.find({ company: cid })
      .sort({ createdAt: -1 }).limit(5)
      .populate('createdBy', 'name').populate('assignedTo', 'name');

    const avgRatingResult = await Rating.aggregate([
      { $match: { company: cid } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const byPriority = await Ticket.aggregate([
      { $match: { company: cid } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyTickets = await Ticket.aggregate([
      { $match: { company: cid, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        tickets: { total, open, assigned, inProgress, resolved, closed },
        totalAgents, totalUsers,
        avgRating: avgRatingResult[0]?.avg?.toFixed(1) || 0,
        totalRatings: avgRatingResult[0]?.count || 0,
        recentTickets, byPriority, dailyTickets,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getStaff = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = { company: req.companyId };
    if (role) query.role = role;
    else query.role = { $in: ['company_super_admin', 'company_admin', 'employee', 'agent'] };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const total = await User.countDocuments(query);
    const staff = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: staff, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone, specializations } = req.body;
    const allowedRoles = ['company_admin', 'employee', 'agent'];
    if (role === 'company_super_admin' && req.user.role !== 'company_super_admin')
      return res.status(403).json({ success: false, message: 'Only super admin can create another super admin.' });
    if (!allowedRoles.includes(role) && role !== 'company_super_admin')
      return res.status(400).json({ success: false, message: 'Invalid role.' });

    const existing = await User.findOne({ email, company: req.companyId });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });

    const user = await User.create({ name, email, password, role, phone, specializations, company: req.companyId });
    res.status(201).json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateStaff = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, company: req.companyId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { name, phone, isActive, specializations, password } = req.body;
    if (name)            user.name = name;
    if (phone)           user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (specializations) user.specializations = specializations;
    if (password && password.trim()) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      user.password = password;
    }
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, company: req.companyId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'Staff member deactivated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAgentPerformance = async (req, res) => {
  try {
    const agents = await User.find({ company: req.companyId, role: 'agent', isActive: true });
    const performance = await Promise.all(agents.map(async (agent) => {
      const [total, resolved, avgRating] = await Promise.all([
        Ticket.countDocuments({ company: req.companyId, assignedTo: agent._id }),
        Ticket.countDocuments({ company: req.companyId, assignedTo: agent._id, status: { $in: ['resolved', 'closed'] } }),
        Rating.aggregate([
          { $match: { company: req.companyId, agent: agent._id } },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]),
      ]);
      return {
        agent: { _id: agent._id, name: agent.name, email: agent.email, avatar: agent.avatar },
        totalTickets: total, resolvedTickets: resolved,
        avgRating: avgRating[0]?.avg?.toFixed(1) || 0,
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
      };
    }));
    res.json({ success: true, data: performance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getServices = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select('services');
    res.json({ success: true, data: company?.services || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createService = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);
    company.services.push(req.body);
    await company.save();
    res.status(201).json({ success: true, data: company.services });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateService = async (req, res) => {
  try {
    const company  = await Company.findById(req.companyId);
    const service  = company.services.id(req.params.serviceId);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    Object.assign(service, req.body);
    await company.save();
    res.json({ success: true, data: company.services });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteService = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);
    company.services.pull({ _id: req.params.serviceId });
    await company.save();
    res.json({ success: true, message: 'Service deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getPublicServices = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.companySlug }).select('services settings branding name');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    const active = company.services.filter(s => s.isActive).sort((a,b) => a.order - b.order);
    res.json({ success: true, data: active, company: { name: company.name, branding: company.branding, settings: company.settings } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
