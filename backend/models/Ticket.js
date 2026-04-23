const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String, originalName: String, mimetype: String, size: Number, url: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
  uploadedAt: { type:Date, default:Date.now },
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type:String, unique:true },     // e.g. "COOLAIR-000001"
  companyPrefix: { type:String },                 // company slug prefix for isolation
  
  company: { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  title:   { type:String, required:[true,'Title is required'], trim:true },
  description: { type:String, required:[true,'Description is required'] },
  category: { type:String, required:[true,'Category is required'] },
  priority: { type:String, enum:['low','medium','high','critical'], default:'medium' },
  status:   { type:String, enum:['open','assigned','in_progress','resolved','closed','reopened'], default:'open', index:true },

  createdBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  assignedTo: { type:mongoose.Schema.Types.ObjectId, ref:'User', default:null },
  assignedBy: { type:mongoose.Schema.Types.ObjectId, ref:'User', default:null },
  assignedAt: Date,

  contactEmail: String, contactPhone: String,
  attachments:  [attachmentSchema],
  resolvedAt: Date, closedAt: Date, reopenedAt: Date,

  internalNotes: [{
    note: String,
    addedBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' },
    addedAt: { type:Date, default:Date.now },
  }],

  statusHistory: [{
    from: String, to: String,
    changedBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' },
    changedAt: { type:Date, default:Date.now },
    note: String,
  }],

  tags: [String],
  rating: { type:mongoose.Schema.Types.ObjectId, ref:'Rating', default:null },
  isRated:  { type:Boolean, default:false },
  dueDate:  Date,
  isDeleted:{ type:Boolean, default:false },
  createdAt:{ type:Date, default:Date.now },
  updatedAt:{ type:Date, default:Date.now },
});

// ── Auto-generate ticket number PER COMPANY ───────────────────────────────────
// Format: SLUGPREFIX-XXXXXX (e.g. COOLAIR-000001, FASTAC-000002)
// This guarantees no cross-company interference
ticketSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  if (this.isNew && !this.ticketNumber) {
    // Count tickets for THIS company only
    const count = await this.constructor.countDocuments({ company: this.company });
    // Get company slug for prefix
    if (!this.companyPrefix) {
      const Company = require('./Company');
      const company = await Company.findById(this.company).select('slug');
      // Use first 8 chars of slug, uppercase
      this.companyPrefix = (company?.slug || 'TKT').toUpperCase().replace(/-/g,'').slice(0,8);
    }
    this.ticketNumber = `${this.companyPrefix}-${String(count+1).padStart(6,'0')}`;
  }
  next();
});

ticketSchema.index({ company:1, status:1 });
ticketSchema.index({ company:1, createdBy:1 });
ticketSchema.index({ company:1, assignedTo:1 });
ticketSchema.index({ company:1, createdAt:-1 });
// Ensure ticket numbers are unique per company
ticketSchema.index({ company:1, ticketNumber:1 }, { unique:true, sparse:true });

module.exports = mongoose.model('Ticket', ticketSchema);
