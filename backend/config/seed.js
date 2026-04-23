require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose     = require('mongoose');
const User         = require('../models/User');
const Subscription = require('../models/Subscription');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ticketflow';

const plans = [
  {
    name:'Starter', slug:'starter',
    description:'Perfect for small businesses',
    tagline:'Get started',
    price: { monthly:83000, yearly:830000, currency:'INR' }, // ₹83,000/mo = ₹830 * 100 paise
    limits: { max_agents:5, max_admins:2, max_employees:10, max_tickets_per_month:500, storage_limit_gb:1, max_services:10 },
    features: { email_support:true, priority_support:false, advanced_analytics:false, custom_logo:false, custom_colors:false, custom_subdomain:false, white_labeling:false, api_access:false, agent_performance_report:false, ticket_export:false, sla_management:false, multi_language:false },
    features_display:['5 Agents','500 tickets/month','1 GB storage','Email support','Basic analytics','Service catalog'],
    isActive:true, isPopular:false, sortOrder:1,
  },
  {
    name:'Growth', slug:'growth',
    description:'For growing support teams',
    tagline:'Most popular',
    price: { monthly:208000, yearly:2080000, currency:'INR' },
    limits: { max_agents:20, max_admins:5, max_employees:50, max_tickets_per_month:2000, storage_limit_gb:10, max_services:50 },
    features: { email_support:true, priority_support:true, advanced_analytics:true, custom_logo:true, custom_colors:true, custom_subdomain:false, white_labeling:false, api_access:false, agent_performance_report:true, ticket_export:true, sla_management:false, multi_language:false },
    features_display:['20 Agents','2,000 tickets/month','10 GB storage','Priority support','Advanced analytics','Custom logo & colors','Agent performance','Ticket export'],
    isActive:true, isPopular:true, sortOrder:2,
  },
  {
    name:'Enterprise', slug:'enterprise',
    description:'Full power for large organizations',
    tagline:'Everything unlimited',
    price: { monthly:665000, yearly:6650000, currency:'INR' },
    limits: { max_agents:999, max_admins:999, max_employees:9999, max_tickets_per_month:999999, storage_limit_gb:100, max_services:999 },
    features: { email_support:true, priority_support:true, advanced_analytics:true, custom_logo:true, custom_colors:true, custom_subdomain:true, white_labeling:true, api_access:true, agent_performance_report:true, ticket_export:true, sla_management:true, multi_language:true },
    features_display:['Unlimited agents','Unlimited tickets','100 GB storage','Dedicated support','Custom subdomain','White labeling','Full API access','SLA management','Multi-language'],
    isActive:true, isPopular:false, sortOrder:3,
  },
];

const fmtINR = (paise) => `₹${(paise/100).toLocaleString('en-IN')}`;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  const existing = await User.findOne({ role:'platform_owner' });
  if (!existing) {
    await User.create({
      name:'Platform Admin',
      email: process.env.PLATFORM_EMAIL || 'admin@ticketflow.com',
      password: process.env.PLATFORM_PASSWORD || 'Admin@123',
      role:'platform_owner',
    });
    console.log('✅ Platform owner: admin@ticketflow.com / Admin@123');
  } else { console.log('ℹ️  Platform owner already exists'); }

  for (const plan of plans) {
    await Subscription.findOneAndUpdate({ slug:plan.slug }, plan, { upsert:true, new:true });
    console.log(`✅ Plan: ${plan.name} — ${fmtINR(plan.price.monthly)}/month`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 Seed done! Login: /platform/login → admin@ticketflow.com / Admin@123');
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
