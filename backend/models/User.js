const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  phone: String,
  avatar: String,

  // Role hierarchy:
  // platform_owner | company_super_admin | company_admin | employee | agent | user
  role: {
    type: String,
    enum: ['platform_owner', 'company_super_admin', 'company_admin', 'employee', 'agent', 'user'],
    default: 'user',
  },

  // Which company this user belongs to (null for platform_owner)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
  },

  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  lastLogin: Date,

  // Agent-specific: which ticket categories they handle
  specializations: [String],

  // Notification preferences
  notifications: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── Email unique per company (platform_owner globally unique) ─────────────────
userSchema.index({ email: 1, company: 1 }, { unique: true });

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Strip sensitive fields when serializing ───────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
