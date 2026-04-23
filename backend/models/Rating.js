const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    unique: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  createdAt: { type: Date, default: Date.now },
});

ratingSchema.index({ company: 1, agent: 1 });
ratingSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
