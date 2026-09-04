
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "./config/db.js";

import User from "./models/User.js";
import Lead from "./models/Lead.js";
import Customer from "./models/Customer.js";
import Deal from "./models/Deal.js";
import Activity from "./models/Activity.js";
import TimelineEvent from "./models/TimelineEvent.js";
import Notification from "./models/Notification.js";

const seedUsers = async () => {
  const admin = await User.create({
    name: "Admin User",
    email: "admin@crm.test",
    password: "password123",
    role: "Admin",
  });

  const manager = await User.create({
    name: "Priya Sharma",
    email: "manager@crm.test",
    password: "password123",
    role: "Sales Manager",
  });

  const exec1 = await User.create({
    name: "Rahul Verma",
    email: "exec1@crm.test",
    password: "password123",
    role: "Sales Executive",
    manager: manager._id,
  });

  const exec2 = await User.create({
    name: "Sneha Iyer",
    email: "exec2@crm.test",
    password: "password123",
    role: "Sales Executive",
    manager: manager._id,
  });

  return { admin, manager, exec1, exec2 };
};

const seedLeadsDealsAndMore = async ({ manager, exec1, exec2 }) => {
  const lead1 = await Lead.create({
    name: "Amit Kumar",
    email: "amit@buyerco.com",
    phone: "9876543210",
    company: "BuyerCo",
    source: "Website",
    status: "Qualified",
    priority: "High",
    assignedTo: exec1._id,
    createdBy: exec1._id,
    notes: [{ text: "Interested in enterprise plan", createdBy: exec1._id }],
  });

  await Lead.create({
    name: "Neha Gupta",
    email: "neha@retailx.com",
    company: "RetailX",
    source: "Referral",
    status: "New",
    priority: "Medium",
    assignedTo: exec2._id,
    createdBy: exec2._id,
  });

  await Lead.create({
    name: "Vikram Singh",
    email: "vikram@techstart.io",
    company: "TechStart",
    source: "Social Media",
    status: "Contacted",
    priority: "Low",
    assignedTo: exec1._id,
    createdBy: manager._id,
  });

  // One lead converted end-to-end so the pipeline/dashboard has real numbers
  const customer = await Customer.create({
    name: lead1.name,
    email: lead1.email,
    phone: lead1.phone,
    company: lead1.company,
    sourceLead: lead1._id,
    assignedTo: exec1._id,
    createdBy: exec1._id,
  });

  const deal = await Deal.create({
    title: "BuyerCo — Enterprise License",
    customer: customer._id,
    sourceLead: lead1._id,
    stage: "Proposal",
    value: 500000,
    probability: 60,
    expectedClosingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    assignedTo: exec1._id,
    createdBy: exec1._id,
  });

  lead1.isConverted = true;
  lead1.status = "Converted";
  lead1.convertedCustomer = customer._id;
  lead1.convertedDeal = deal._id;
  lead1.convertedAt = new Date();
  await lead1.save();

  await Activity.create({
    type: "Call",
    subject: "Follow-up on proposal",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: "Pending",
    relatedTo: { kind: "Deal", item: deal._id },
    assignedTo: exec1._id,
    createdBy: exec1._id,
  });

  await Activity.create({
    type: "Email",
    subject: "Send pricing sheet",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // in the past -> Overdue on next fetch
    status: "Pending",
    relatedTo: { kind: "Lead", item: lead1._id },
    assignedTo: exec1._id,
    createdBy: exec1._id,
  });

  await TimelineEvent.create({
    relatedTo: { kind: "Deal", item: deal._id },
    action: "created",
    description: "Deal created from lead conversion by Rahul Verma",
    performedBy: exec1._id,
  });

  await Notification.create({
    user: exec1._id,
    type: "lead_assigned",
    message: `You were assigned lead: ${lead1.name}`,
    link: `/leads/${lead1._id}`,
  });
};

const importData = async () => {
  await connectDB();
  const users = await seedUsers();
  await seedLeadsDealsAndMore(users);
  console.log("✅ Seed data imported successfully");
  console.log(`
Test credentials (password for all: password123):
  Admin           -> admin@crm.test
  Sales Manager   -> manager@crm.test
  Sales Executive -> exec1@crm.test
  Sales Executive -> exec2@crm.test
`);
  process.exit();
};

const destroyData = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany(),
    Lead.deleteMany(),
    Customer.deleteMany(),
    Deal.deleteMany(),
    Activity.deleteMany(),
    TimelineEvent.deleteMany(),
    Notification.deleteMany(),
  ]);
  console.log("🗑️  All data destroyed");
  process.exit();
};

if (process.argv[2] === "destroy") {
  destroyData();
} else {
  importData();
}