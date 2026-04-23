const mongoose = require('mongoose');

/**
 * Subscription Plan Model
 * ALL features stored in DB — no hardcoding in code.
 * Feature flags checked in middleware before allowing access.
 */
const subscriptionSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true, trim: true },
  slug:         { type: String, required: true, unique: true, lowercase: true },
  description:  String,
  tagline:      String,   // e.g. "Perfect for small businesses"

  price: {
    monthly:  { type: Number, required: true },   // in paise (INR × 100)
    yearly:   { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },

  // Hard limits
  limits: {
    max_agents:              { type: Number, default: 5 },
    max_admins:              { type: Number, default: 2 },
    max_employees:           { type: Number, default: 10 },
    max_tickets_per_month:   { type: Number, default: 500 },
    storage_limit_gb:        { type: Number, default: 1 },
    max_services:            { type: Number, default: 10 },
  },

  // Feature flags — ALL stored in DB, checked dynamically
  features: {
    email_support:           { type: Boolean, default: true },
    priority_support:        { type: Boolean, default: false },
    advanced_analytics:      { type: Boolean, default: false },
    custom_logo:             { type: Boolean, default: false },
    custom_colors:           { type: Boolean, default: false },
    custom_subdomain:        { type: Boolean, default: false },
    white_labeling:          { type: Boolean, default: false },
    api_access:              { type: Boolean, default: false },
    agent_performance_report:{ type: Boolean, default: false },
    ticket_export:           { type: Boolean, default: false },
    sla_management:          { type: Boolean, default: false },
    multi_language:          { type: Boolean, default: false },
  },

  // Display
  features_display: [String],    // human-readable feature list for pricing page
  highlight_color:  { type: String, default: '#4f46e5' },

  // Razorpay plan IDs (created in Razorpay dashboard for recurring)
  razorpay: {
    monthly_plan_id: String,
    yearly_plan_id:  String,
  },

  isActive:   { type: Boolean, default: true },
  isPopular:  { type: Boolean, default: false },
  sortOrder:  { type: Number,  default: 0 },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
});

subscriptionSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Subscription', subscriptionSchema);
