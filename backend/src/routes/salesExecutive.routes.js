import express from "express";

import {
  getLeads, getLead, createLead, updateLead, assignLead, addNote, convertLead,
} from "../controllers/sales/lead.controller.js";
import { getCustomers, getCustomer, updateCustomer } from "../controllers/sales/customer.controller.js";
import { getDeals, getDeal, updateDeal, updateDealStage } from "../controllers/sales/deal.controller.js";
import {
  getActivities, createActivity, updateActivity, deleteActivity,
} from "../controllers/sales/activity.controller.js";
import { getDashboard } from "../controllers/sales/dashboard.controller.js";
import { getTimeline } from "../controllers/sales/timeline.controller.js";
import {
  getNotifications, markAsRead, markAllAsRead,
} from "../controllers/sales/notification.controller.js";

import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createLeadValidator, updateLeadValidator, assignLeadValidator, addNoteValidator, convertLeadValidator,
} from "../middleware/validators/leadValidators.js";
import { updateDealValidator, updateDealStageValidator } from "../middleware/validators/dealValidators.js";
import {
  createActivityValidator, updateActivityValidator,
} from "../middleware/validators/activityValidators.js";

// Sales workflow routes — everything a Sales Executive touches day-to-day, plus the
// same endpoints for Sales Manager and Admin. All three roles share these endpoints;
// what differs is DATA SCOPE (enforced inside each controller via buildScopeFilter /
// canAccessRecord — Executive sees only their own records, Manager sees their team,
// Admin sees all) and a handful of actions gated to Manager/Admin only (e.g. reassigning
// a lead). This keeps one consistent API surface instead of duplicating endpoints per role.
const router = express.Router();
router.use(protect);

// ---------------- Leads ----------------

/**
 * @openapi
 * /leads:
 *   get:
 *     summary: List leads (scoped to the caller's role — own/team/all)
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [New, Contacted, Qualified, Unqualified, Converted, Lost] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [Low, Medium, High] }
 *       - in: query
 *         name: source
 *         schema: { type: string, enum: [Website, Referral, Social Media, Email, Phone] }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *         description: Filter by assignee (Admin/Manager only)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, name, status, priority] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated list of leads }
 *   post:
 *     summary: Create a lead
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, source]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               company: { type: string }
 *               source: { type: string, enum: [Website, Referral, Social Media, Email, Phone] }
 *               priority: { type: string, enum: [Low, Medium, High] }
 *     responses:
 *       201: { description: Lead created }
 *       400: { description: Validation error }
 */
router.route("/leads")
  .get(getLeads)
  .post(createLeadValidator, validate, createLead);

/**
 * @openapi
 * /leads/{id}:
 *   get:
 *     summary: Get a single lead by ID
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lead details }
 *       403: { description: Not permitted to access this lead }
 *       404: { description: Lead not found }
 *   put:
 *     summary: Update a lead's editable fields and/or status
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               company: { type: string }
 *               priority: { type: string, enum: [Low, Medium, High] }
 *               status: { type: string, enum: [New, Contacted, Qualified, Unqualified, Converted, Lost] }
 *     responses:
 *       200: { description: Lead updated }
 *       400: { description: Cannot edit an already-converted lead }
 */
router.route("/leads/:id")
  .get(getLead)
  .put(updateLeadValidator, validate, updateLead);

/**
 * @openapi
 * /leads/{id}/assign:
 *   put:
 *     summary: Assign or reassign a lead (Admin / Sales Manager only)
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedTo]
 *             properties:
 *               assignedTo: { type: string, description: User ID to assign the lead to }
 *     responses:
 *       200: { description: Lead reassigned }
 *       403: { description: Only Admin/Sales Manager can reassign }
 */
router.put(
  "/leads/:id/assign",
  authorize("Admin", "Sales Manager"),
  assignLeadValidator,
  validate,
  assignLead
);

/**
 * @openapi
 * /leads/{id}/notes:
 *   post:
 *     summary: Add a note to a lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201: { description: Note added }
 */
router.post("/leads/:id/notes", addNoteValidator, validate, addNote);

/**
 * @openapi
 * /leads/{id}/convert:
 *   post:
 *     summary: Convert a qualified lead into a Customer + Deal
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealTitle, dealValue, expectedClosingDate]
 *             properties:
 *               dealTitle: { type: string }
 *               dealValue: { type: number }
 *               dealProbability: { type: number, minimum: 0, maximum: 100 }
 *               expectedClosingDate: { type: string, format: date }
 *     responses:
 *       201: { description: Lead converted; customer and deal created }
 *       400: { description: Lead already converted, or missing required fields }
 */
router.post("/leads/:id/convert", convertLeadValidator, validate, convertLead);

// ---------------- Customers ----------------

/**
 * @openapi
 * /customers:
 *   get:
 *     summary: List customers (scoped to the caller's role — own/team/all)
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *         description: Filter by assignee (Admin/Manager only)
 *       - in: query
 *         name: dealStatus
 *         schema: { type: string, enum: [open, Won, Lost] }
 *         description: Filter by related deal status
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated list of customers }
 */
router.get("/customers", getCustomers);

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     summary: Get a single customer, including their deals
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Customer details with related deals }
 *       403: { description: Not permitted to access this customer }
 *       404: { description: Customer not found }
 */
router.get("/customers/:id", getCustomer);

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     summary: Update a customer's editable fields
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               company: { type: string }
 *     responses:
 *       200: { description: Customer updated }
 */
router.put("/customers/:id", updateCustomer);

// ---------------- Deals ----------------

/**
 * @openapi
 * /deals:
 *   get:
 *     summary: List deals (scoped to the caller's role — own/team/all)
 *     tags: [Deals]
 *     parameters:
 *       - in: query
 *         name: stage
 *         schema: { type: string, enum: [Qualification, Discovery, Proposal, Negotiation, Won, Lost] }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *         description: Filter by assignee (Admin/Manager only)
 *       - in: query
 *         name: minAmount
 *         schema: { type: number }
 *       - in: query
 *         name: maxAmount
 *         schema: { type: number }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *         description: Filters on expectedClosingDate
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, value, expectedClosingDate, stage] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated list of deals, each including a computed expectedRevenue field }
 */
router.get("/deals", getDeals);

/**
 * @openapi
 * /deals/{id}:
 *   get:
 *     summary: Get a single deal by ID
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deal details }
 *       403: { description: Not permitted to access this deal }
 *       404: { description: Deal not found }
 */
router.get("/deals/:id", getDeal);

/**
 * @openapi
 * /deals/{id}:
 *   put:
 *     summary: Update a deal's value, probability, title, or expected closing date
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               value: { type: number, minimum: 0 }
 *               probability: { type: number, minimum: 0, maximum: 100 }
 *               expectedClosingDate: { type: string, format: date }
 *     responses:
 *       200: { description: Deal updated }
 *       400: { description: Cannot edit a closed (Won/Lost) deal }
 */
router.put("/deals/:id", updateDealValidator, validate, updateDeal);

/**
 * @openapi
 * /deals/{id}/stage:
 *   put:
 *     summary: Move a deal to a new pipeline stage (backend enforces valid transitions)
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stage]
 *             properties:
 *               stage: { type: string, enum: [Qualification, Discovery, Proposal, Negotiation, Won, Lost] }
 *     responses:
 *       200: { description: Stage updated; Won/Lost also sets isClosed and closedAt }
 *       400: { description: Invalid stage transition, or deal already closed }
 */
router.put("/deals/:id/stage", updateDealStageValidator, validate, updateDealStage);

// ---------------- Activities (follow-ups) ----------------

/**
 * @openapi
 * /activities:
 *   get:
 *     summary: List follow-up activities (scoped to the caller's role)
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Completed, Overdue] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Call, Email, Meeting, Demo, Reminder] }
 *       - in: query
 *         name: relatedKind
 *         schema: { type: string, enum: [Lead, Customer, Deal] }
 *       - in: query
 *         name: relatedId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of activities. Any Pending activity past its dueDate is auto-flipped to Overdue before the list is returned.
 *   post:
 *     summary: Create a follow-up activity
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, subject, dueDate, relatedTo]
 *             properties:
 *               type: { type: string, enum: [Call, Email, Meeting, Demo, Reminder] }
 *               subject: { type: string }
 *               notes: { type: string }
 *               dueDate: { type: string, format: date }
 *               relatedTo:
 *                 type: object
 *                 required: [kind, item]
 *                 properties:
 *                   kind: { type: string, enum: [Lead, Customer, Deal] }
 *                   item: { type: string, description: "ID of the related Lead/Customer/Deal" }
 *               assignedTo: { type: string, description: "Defaults to the creator if omitted" }
 *     responses:
 *       201: { description: Activity created }
 */
router.route("/activities")
  .get(getActivities)
  .post(createActivityValidator, validate, createActivity);

/**
 * @openapi
 * /activities/{id}:
 *   put:
 *     summary: Update an activity (subject, notes, due date, or status)
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject: { type: string }
 *               notes: { type: string }
 *               dueDate: { type: string, format: date }
 *               status: { type: string, enum: [Pending, Completed, Overdue] }
 *     responses:
 *       200: { description: Activity updated }
 *   delete:
 *     summary: Delete an activity
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Activity deleted }
 */
router.route("/activities/:id")
  .put(updateActivityValidator, validate, updateActivity)
  .delete(deleteActivity);

// ---------------- Dashboard ----------------

/**
 * @openapi
 * /dashboard:
 *   get:
 *     summary: Get sales analytics scoped to the caller's role (own data, team, or all)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: >
 *           Aggregated metrics — leads (total/new/qualified/converted/lost/conversionRate),
 *           customers (total/newLast30Days), deals (total/open/won/lost/pipelineValue/wonRevenue/expectedRevenue),
 *           activities (pending/completed/overdue), and teamPerformance (Admin/Manager only, null for Sales Executive).
 */
router.get("/dashboard", getDashboard);

// ---------------- Timeline ----------------

/**
 * @openapi
 * /timeline/{kind}/{id}:
 *   get:
 *     summary: Get the audit-trail timeline for a Lead, Customer, or Deal
 *     tags: [Timeline]
 *     parameters:
 *       - in: path
 *         name: kind
 *         required: true
 *         schema: { type: string, enum: [Lead, Customer, Deal] }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of timeline events, most recent first }
 *       400: { description: Invalid kind }
 */
router.get("/timeline/:kind/:id", getTimeline);

// ---------------- Notifications ----------------

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Get the caller's notifications (most recent 50) plus unread count
 *     tags: [Notifications]
 *     responses:
 *       200: { description: List of notifications and unreadCount }
 */
router.get("/notifications", getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     summary: Mark all of the caller's notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200: { description: All notifications marked as read }
 */
router.put("/notifications/read-all", markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked as read }
 *       404: { description: Notification not found }
 */
router.put("/notifications/:id/read", markAsRead);

export default router;