const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  icon:        { type: String, default: '🔧' },
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

const companySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  subdomain:   { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       String,
  address:     String,
  website:     String,
  description: String,

  // Branding (only available if plan allows)
  branding: {
    logo:             String,
    favicon:          String,
    primaryColor:     { type: String, default: '#4f46e5' },
    secondaryColor:   { type: String, default: '#f59e0b' },
    tagline:          String,
    showLogoOnPortal: { type: Boolean, default: true },
  },

  // ── SUBSCRIPTION ─────────────────────────────────────────────────────────
  subscriptionPlan:        { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  subscriptionStatus:      { type: String, enum: ['trial','active','expired','cancelled','past_due'], default: 'trial' },
  subscriptionExpiry:      Date,
  subscriptionBillingCycle:{ type: String, enum: ['monthly','yearly'], default: 'monthly' },
  subscriptionStartedAt:   Date,
  trialStart:              Date,
  trialEnd:                Date,
  lastPaymentAt:           Date,
  nextBillingAt:           Date,

  // Feature overrides: platform admin can grant/revoke individual features
  featureOverrides: {
    type: Map,
    of: Boolean,
    default: {},
  },

  // Monthly usage tracking (reset each billing cycle)
  usage: {
    ticketsThisMonth: { type: Number, default: 0 },
    storageUsedMb:    { type: Number, default: 0 },
    resetAt:          Date,
  },

  // Razorpay
  razorpay: {
    customerId:     String,
    subscriptionId: String,
    orderId:        String,
    paymentId:      String,
  },

  // Platform status
  status:          { type: String, enum: ['pending','approved','rejected','suspended'], default: 'pending' },
  rejectionReason: String,

  // Services
  services: [serviceSchema],

  // Settings
  settings: {
    allowUserRegistration:   { type: Boolean, default: true },
    requireEmailVerification:{ type: Boolean, default: false },
    autoAssignTickets:       { type: Boolean, default: false },
    defaultTicketPriority:   { type: String, default: 'medium' },
    ticketCategories:        [String],
    workingHours:            { type: String, default: '9:00 AM – 6:00 PM' },
    supportEmail:            String,
    welcomeMessage:          String,
  },

  // Audit log
  auditLog: [{
    action:    String,
    by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at:        { type: Date, default: Date.now },
    details:   mongoose.Schema.Types.Mixed,
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

companySchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

// Check if a specific feature is enabled (considering both plan and overrides)
companySchema.methods.hasFeature = function(featureName) {
  // Check override first
  if (this.featureOverrides && this.featureOverrides.has(featureName)) {
    return this.featureOverrides.get(featureName);
  }
  // Then check plan
  if (this.subscriptionPlan && this.subscriptionPlan.features) {
    return !!this.subscriptionPlan.features[featureName];
  }
  return false;
};

module.exports = mongoose.model('Company', companySchema);
