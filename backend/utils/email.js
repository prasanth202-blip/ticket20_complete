const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, error: err.message };
  }
};

// ── Email templates ───────────────────────────────────────────────────────────
exports.sendTicketCreatedEmail = async ({ to, ticketNumber, title, companyName, dashboardUrl }) => {
  return sendEmail({
    to,
    subject: `[${companyName}] Ticket #${ticketNumber} Created`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Ticket Created Successfully</h2>
        <p>Your support ticket has been created and our team will get back to you shortly.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Title:</strong> ${title}</p>
        </div>
        <a href="${dashboardUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          View Ticket
        </a>
      </div>
    `,
  });
};

exports.sendTicketAssignedEmail = async ({ to, agentName, ticketNumber, title }) => {
  return sendEmail({
    to,
    subject: `Ticket #${ticketNumber} Assigned to You`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">New Ticket Assigned</h2>
        <p>Hello ${agentName}, a new ticket has been assigned to you.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Title:</strong> ${title}</p>
        </div>
      </div>
    `,
  });
};

exports.sendTicketStatusEmail = async ({ to, ticketNumber, status, message }) => {
  return sendEmail({
    to,
    subject: `Ticket #${ticketNumber} Status Updated: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Ticket Status Updated</h2>
        <p>Your ticket #${ticketNumber} status has been updated to <strong>${status}</strong>.</p>
        ${message ? `<p>${message}</p>` : ''}
      </div>
    `,
  });
};

exports.sendCompanyApprovedEmail = async ({ to, companyName, slug }) => {
  return sendEmail({
    to,
    subject: `Your company "${companyName}" has been approved!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to TicketFlow! 🎉</h2>
        <p>Your company <strong>${companyName}</strong> has been approved.</p>
        <p>Your portal URL: <strong>${process.env.CLIENT_URL}/${slug}</strong></p>
        <a href="${process.env.CLIENT_URL}/${slug}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
};

exports.sendEmail = sendEmail;
