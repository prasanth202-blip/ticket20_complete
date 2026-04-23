const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  platformName:             { type: String, default: 'TicketFlow' },
  platformEmail:            { type: String, default: 'admin@ticketflow.com' },
  supportEmail:             { type: String, default: 'support@ticketflow.com' },
  smtpHost:                 { type: String, default: 'smtp.gmail.com' },
  smtpPort:                 { type: String, default: '587' },
  smtpUser:                 { type: String, default: '' },
  smtpPass:                 { type: String, default: '' },
  emailNotifications:       { type: Boolean, default: true },
  maintenanceMode:          { type: Boolean, default: false },
  allowCompanyRegistration: { type: Boolean, default: true },
  requireApproval:          { type: Boolean, default: true },
  maxTrialDays:             { type: Number,  default: 14 },
  updatedAt: { type: Date, default: Date.now },
});

platformSettingsSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);