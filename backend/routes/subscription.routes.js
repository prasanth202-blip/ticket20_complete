const router       = require('express').Router();
const Subscription = require('../models/Subscription');

// Public endpoint - no auth needed
router.get('/', async (req, res) => {
  try {
    const plans = await Subscription.find({ isActive:true }).sort({ sortOrder:1 });
    res.json({ success:true, data:plans });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
