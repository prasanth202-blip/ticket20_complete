const Razorpay = require('razorpay');
const crypto   = require('crypto');

const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes('REPLACE')) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (get test keys from dashboard.razorpay.com)');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

/**
 * Create a Razorpay order.
 * amount is in paise (INR × 100).
 */
exports.createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const razorpay = getRazorpay();
  return razorpay.orders.create({
    amount:   Math.round(amount),
    currency,
    receipt,
    notes,
  });
};

/**
 * Verify Razorpay payment signature.
 * Returns true if valid, false otherwise.
 */
exports.verifySignature = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret.includes('REPLACE')) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};

exports.fetchPayment = async (paymentId) => {
  const razorpay = getRazorpay();
  return razorpay.payments.fetch(paymentId);
};

exports.getRazorpayKeyId = () => {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key || key.includes('REPLACE')) return null;
  return key;
};

exports.isConfigured = () => {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return !!(key && secret && !key.includes('REPLACE') && !secret.includes('REPLACE'));
};
