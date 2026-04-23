const Ticket  = require('../models/Ticket');
const User    = require('../models/User');
const Message = require('../models/Message');
const { sendTicketCreatedEmail, sendTicketAssignedEmail, sendTicketStatusEmail } = require('../utils/email');
const path = require('path');

// ── Create ticket ─────────────────────────────────────────────────────────────
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, priority, contactEmail, contactPhone, tags } = req.body;
    
    // Handle attachments
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      url: `/uploads/attachments/${f.filename}`,
      uploadedBy: req.user._id,
    }));

    const ticket = await Ticket.create({
      title, description, category,
      priority: priority || 'medium',
      company: req.companyId,
      createdBy: req.user._id,
      contactEmail, contactPhone,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      attachments,
      statusHistory: [{ from: null, to: 'open', changedBy: req.user._id }],
    });

    await ticket.populate('createdBy', 'name email');

    // Email notification
    sendTicketCreatedEmail({
      to: req.user.email,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      companyName: req.company.name,
      dashboardUrl: `${process.env.CLIENT_URL}/${req.company.slug}/tickets/${ticket._id}`,
    });

    // System message
    await Message.create({
      ticket: ticket._id,
      company: req.companyId,
      sender: req.user._id,
      senderRole: req.user.role,
      content: `Ticket #${ticket.ticketNumber} created`,
      messageType: 'system',
      systemEvent: 'ticket_created',
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── List tickets (with role-based filtering) ──────────────────────────────────
exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { company: req.companyId, isDeleted: false };

    // Role-based visibility
    if (req.user.role === 'user') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'agent') {
      query.assignedTo = req.user._id;
    }
    // admin, super_admin, employee see all

    if (status)     query.status   = status;
    if (priority)   query.priority = priority;
    if (category)   query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const total   = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('createdBy',  'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .select('ticketNumber title description category priority status createdBy assignedTo assignedBy assignedAt contactEmail contactPhone attachments resolvedAt closedAt reopenedAt internalNotes statusHistory tags rating isRated dueDate isDeleted createdAt updatedAt')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: tickets, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Get single ticket ─────────────────────────────────────────────────────────
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, company: req.companyId, isDeleted: false })
      .populate('createdBy',  'name email avatar role')
      .populate('assignedTo', 'name email avatar role')
      .populate('assignedBy', 'name email')
      .populate('rating');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Users can only view their own tickets
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    // Agents can only view assigned tickets
    if (req.user.role === 'agent' && ticket.assignedTo?._id?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Assign ticket to agent ────────────────────────────────────────────────────
exports.assignTicket = async (req, res) => {
  try {
    const { agentId } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, company: req.companyId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const agent = await User.findOne({ _id: agentId, company: req.companyId, role: 'agent' });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });

    const prevStatus = ticket.status;
    ticket.assignedTo = agentId;
    ticket.assignedBy = req.user._id;
    ticket.assignedAt = Date.now();
    ticket.status     = 'assigned';
    ticket.statusHistory.push({ from: prevStatus, to: 'assigned', changedBy: req.user._id });
    await ticket.save();

    // System message
    await Message.create({
      ticket: ticket._id, company: req.companyId, sender: req.user._id, senderRole: req.user.role,
      content: `Ticket assigned to ${agent.name}`,
      messageType: 'system', systemEvent: 'ticket_assigned',
    });

    // Email agent
    sendTicketAssignedEmail({ to: agent.email, agentName: agent.name, ticketNumber: ticket.ticketNumber, title: ticket.title });

    await ticket.populate('assignedTo', 'name email avatar');
    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Update ticket status ──────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const ticket = await Ticket.findOne({ _id: req.params.id, company: req.companyId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Agents can only update their assigned tickets
    if (req.user.role === 'agent' && ticket.assignedTo?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const prevStatus = ticket.status;
    ticket.status = status;
    if (status === 'resolved') ticket.resolvedAt = Date.now();
    if (status === 'closed')   ticket.closedAt   = Date.now();
    if (status === 'reopened') ticket.reopenedAt = Date.now();
    ticket.statusHistory.push({ from: prevStatus, to: status, changedBy: req.user._id, note });
    await ticket.save();

    // System message
    await Message.create({
      ticket: ticket._id, company: req.companyId, sender: req.user._id, senderRole: req.user.role,
      content: `Status changed from "${prevStatus}" to "${status}"${note ? ': ' + note : ''}`,
      messageType: 'system', systemEvent: 'status_changed',
    });

    // Notify ticket creator
    const creator = await User.findById(ticket.createdBy);
    if (creator) sendTicketStatusEmail({ to: creator.email, ticketNumber: ticket.ticketNumber, status, message: note });

    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Update ticket details ─────────────────────────────────────────────────────
exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, company: req.companyId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const { title, description, category, priority, tags, dueDate } = req.body;
    if (title)       ticket.title       = title;
    if (description) ticket.description = description;
    if (category)    ticket.category    = category;
    if (priority)    ticket.priority    = priority;
    if (tags)        ticket.tags        = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (dueDate)     ticket.dueDate     = dueDate;
    await ticket.save();

    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Add internal note ─────────────────────────────────────────────────────────
exports.addInternalNote = async (req, res) => {
  try {
    const { note } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, company: req.companyId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    ticket.internalNotes.push({ note, addedBy: req.user._id });
    await ticket.save();
    await ticket.populate('internalNotes.addedBy', 'name role');
    res.json({ success: true, data: ticket.internalNotes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Delete ticket (soft) ──────────────────────────────────────────────────────
exports.deleteTicket = async (req, res) => {
  try {
    await Ticket.findOneAndUpdate({ _id: req.params.id, company: req.companyId }, { isDeleted: true });
    res.json({ success: true, message: 'Ticket deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Note: incrementTicketUsage is called from ticket.routes.js after creation
