const Rating = require('../models/Rating');
const Ticket = require('../models/Ticket');

exports.createRating = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    if (!score || score < 1 || score > 5)
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 5.' });

    const ticket = await Ticket.findOne({ _id: req.params.ticketId, company: req.companyId, createdBy: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (!['resolved', 'closed'].includes(ticket.status))
      return res.status(400).json({ success: false, message: 'Can only rate resolved/closed tickets.' });
    if (ticket.isRated)
      return res.status(400).json({ success: false, message: 'Already rated.' });

    const rating = await Rating.create({
      ticket: ticket._id,
      company: req.companyId,
      ratedBy: req.user._id,
      agent: ticket.assignedTo,
      score: parseInt(score),
      feedback,
    });

    ticket.rating  = rating._id;
    ticket.isRated = true;
    await ticket.save();

    res.status(201).json({ success: true, data: rating });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCompanyRatings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total   = await Rating.countDocuments({ company: req.companyId });
    const ratings = await Rating.find({ company: req.companyId })
      .populate('ratedBy', 'name email').populate('agent', 'name email')
      .populate('ticket', 'ticketNumber title')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: ratings, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAgentRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ company: req.companyId, agent: req.params.agentId })
      .populate('ratedBy', 'name').populate('ticket', 'ticketNumber title')
      .sort({ createdAt: -1 });
    const avg = ratings.reduce((s, r) => s + r.score, 0) / (ratings.length || 1);
    res.json({ success: true, data: ratings, avgScore: avg.toFixed(1), total: ratings.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
