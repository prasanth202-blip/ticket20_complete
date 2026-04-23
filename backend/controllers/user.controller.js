const User   = require('../models/User');
const Ticket = require('../models/Ticket');

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { company: req.companyId, role: 'user' };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, company: req.companyId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const tickets = await Ticket.find({ company: req.companyId, createdBy: user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: { ...user.toJSON(), tickets } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, company: req.companyId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getUserDashboard = async (req, res) => {
  try {
    const uid = req.user._id;
    const cid = req.companyId;
    const [total, open, resolved, closed] = await Promise.all([
      Ticket.countDocuments({ company: cid, createdBy: uid }),
      Ticket.countDocuments({ company: cid, createdBy: uid, status: { $in: ['open', 'assigned', 'in_progress'] } }),
      Ticket.countDocuments({ company: cid, createdBy: uid, status: 'resolved' }),
      Ticket.countDocuments({ company: cid, createdBy: uid, status: 'closed' }),
    ]);
    const recentTickets = await Ticket.find({ company: cid, createdBy: uid })
      .sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name');
    res.json({ success: true, data: { tickets: { total, open, resolved, closed }, recentTickets } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
