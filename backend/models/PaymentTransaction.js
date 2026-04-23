const mongoose = require('mongoose');

/**
 * Tracks every payment event for audit and history
 */
const paymentTransactionSchema = new mongoose.Schema({
  company:          { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  plan:             { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  planName:         String,   // snapshot at time of payment

  billingCycle:     { type: String, enum: ['monthly','yearly'], required: true },
  amount:           { type: Number, required: true },          // in paise
  amountFormatted:  String,                                    // e.g. "₹83,000"
  currency:         { type: String, default: 'INR' },

  // Razorpay IDs
  razorpay_order_id:   String,
  razorpay_payment_id: String,
  razorpay_signature:  String,

  status:    { type: String, enum: ['created','paid','failed','refunded'], default: 'created' },
  failReason: String,

  // Plan change tracking
  previousPlan:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  changeType:    { type: String, enum: ['new','upgrade','downgrade','renewal'] },

  // Proration
  proratedAmount: Number,
  daysRemaining:  Number,

  // Billing period
  periodStart: Date,
  periodEnd:   Date,

  isDemo:      { type: Boolean, default: false },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now },
});

paymentTransactionSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
