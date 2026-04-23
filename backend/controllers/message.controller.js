const Message = require('../models/Message');
const Ticket  = require('../models/Ticket');

// ── Get messages for a ticket ─────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.ticketId, company: req.companyId, isDeleted: false });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Role-based access check
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.user.role === 'agent' && ticket.assignedTo?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const query = { ticket: req.params.ticketId, isDeleted: false };
    // Users can't see internal messages
    if (req.user.role === 'user') query.isInternal = false;

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Send a message ────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { content, isInternal } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Message content required.' });

    const ticket = await Ticket.findOne({ _id: req.params.ticketId, company: req.companyId, isDeleted: false });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Access checks
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.user.role === 'agent' && ticket.assignedTo?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    // Users cannot send internal messages
    const internal = (isInternal === true || isInternal === 'true') && req.user.role !== 'user';

    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      url: `/uploads/attachments/${f.filename}`,
    }));

    const message = await Message.create({
      ticket: req.params.ticketId,
      company: req.companyId,
      sender: req.user._id,
      senderRole: req.user.role,
      content: content.trim(),
      isInternal: internal,
      messageType: attachments.length > 0 ? 'attachment' : 'text',
      attachments,
    });

    // If agent sends a message, auto-move to in_progress
    if (req.user.role === 'agent' && ticket.status === 'assigned') {
      ticket.status = 'in_progress';
      ticket.statusHistory.push({ from: 'assigned', to: 'in_progress', changedBy: req.user._id });
      await ticket.save();
    }

    await message.populate('sender', 'name email avatar role');
    res.status(201).json({ success: true, data: message });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Mark messages as read ─────────────────────────────────────────────────────
exports.markRead = async (req, res) => {
  try {
    await Message.updateMany(
      { ticket: req.params.ticketId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
