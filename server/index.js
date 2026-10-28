import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'feedbackhub-local-development-secret';
const API_PREFIX = '/api/v1';

const seedQuestions = [
  { id: 'q-1', type: 'RATING', title: 'Overall Satisfaction Rate', description: 'How satisfied are you with our overall SaaS platform experience?', required: true, options: [] },
  { id: 'q-2', type: 'SINGLE_CHOICE', title: 'Primary Use Case', description: 'What is your main goal when using our platform?', required: true, options: ['Customer Feedback & Analytics', 'Employee Performance Reviews', 'Product Feature Testing', 'Market Research'] },
  { id: 'q-3', type: 'SCALE', title: 'Ease of Use (1 to 10)', description: 'On a scale of 1 to 10, how intuitive is our user interface?', required: true, options: [] },
  { id: 'q-4', type: 'YES_NO', title: 'Would you recommend us to a colleague?', description: '', required: true, options: ['Yes', 'No'] },
  { id: 'q-5', type: 'LONG_TEXT', title: 'What feature would you like us to build next?', description: 'Provide any detailed suggestions or feature requests.', required: false, options: [] }
];

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id('workspace');

function initialDatabase() {
  const passwordHash = bcrypt.hashSync('Password123!', 10);
  return {
    users: [
      { id: 'user-admin', email: 'admin@feedback.com', passwordHash, firstName: 'Alex', lastName: 'Morgan', role: 'ADMIN', organizationIds: ['org-acme'], createdAt: now() },
      { id: 'user-manager', email: 'manager@feedback.com', passwordHash, firstName: 'Maya', lastName: 'Chen', role: 'MANAGER', organizationIds: ['org-acme'], createdAt: now() }
    ],
    organizations: [
      { id: 'org-acme', name: 'Acme Tech Solutions', slug: 'acme-tech', createdAt: now() }
    ],
    memberships: [
      { id: 'member-admin', organizationId: 'org-acme', userId: 'user-admin', role: 'ADMIN', status: 'ACTIVE' },
      { id: 'member-manager', organizationId: 'org-acme', userId: 'user-manager', role: 'MANAGER', status: 'ACTIVE' },
      { id: 'member-maya', organizationId: 'org-acme', email: 'maya@acme.example', name: 'Maya Chen', role: 'MANAGER', status: 'ACTIVE' },
      { id: 'member-jordan', organizationId: 'org-acme', email: 'jordan@acme.example', name: 'Jordan Lee', role: 'MEMBER', status: 'INVITED' }
    ],
    forms: [
      {
        id: 'csat-survey-2026',
        organizationId: 'org-acme',
        title: 'Customer Product Satisfaction Survey 2026',
        description: 'Help us improve our SaaS platform by providing your feedback on our features, UI experience, and customer support.',
        status: 'PUBLISHED',
        publicId: 'csat-survey-2026',
        allowAnonymous: true,
        requireAuth: false,
        onePerUser: false,
        questions: seedQuestions,
        createdBy: 'user-admin',
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: 'employee-pulse-q4',
        organizationId: 'org-acme',
        title: 'Employee Pulse Check — Q4',
        description: 'A quick pulse check for team sentiment and workplace experience.',
        status: 'DRAFT',
        publicId: 'employee-pulse-q4',
        allowAnonymous: true,
        requireAuth: false,
        onePerUser: false,
        questions: [
          { id: 'eq-1', type: 'SCALE', title: 'How supported do you feel this quarter?', description: '', required: true, options: [] },
          { id: 'eq-2', type: 'LONG_TEXT', title: 'What should we improve?', description: '', required: false, options: [] }
        ],
        createdBy: 'user-manager',
        createdAt: now(),
        updatedAt: now()
      }
    ],
    responses: [
      { id: 'resp-101', formId: 'csat-survey-2026', respondent: 'Anonymous', isAnonymous: true, submittedAt: now(), answers: [{ questionId: 'q-1', value: 5 }, { questionId: 'q-2', value: 'Customer Feedback & Analytics' }, { questionId: 'q-3', value: 9 }, { questionId: 'q-4', value: 'Yes' }, { questionId: 'q-5', value: 'The new dashboard is very clear.' }] }
    ],
    auditLogs: [
      { id: 'log-1', organizationId: 'org-acme', action: 'FORM_PUBLISHED', description: 'Published Customer Product Satisfaction Survey 2026', actor: 'Alex Morgan', createdAt: now() },
      { id: 'log-2', organizationId: 'org-acme', action: 'RESPONSE_RECEIVED', description: 'New anonymous response received', actor: 'Public respondent', createdAt: now() },
      { id: 'log-3', organizationId: 'org-acme', action: 'MEMBER_INVITED', description: 'Invited Jordan Lee to the workspace', actor: 'Alex Morgan', createdAt: now() }
    ]
  };
}

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const database = initialDatabase();
    writeDb(database);
    return database;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    const database = initialDatabase();
    writeDb(database);
    return database;
  }
}

function writeDb(database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
}

function publicUser(user) {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
}

function tokenFor(user, type = 'access') {
  return jwt.sign({ sub: user.id, type }, JWT_SECRET, { expiresIn: type === 'refresh' ? '30d' : '2h' });
}

function authPayload(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    return payload.type === 'refresh' ? null : payload;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = authPayload(req);
  if (!payload) return res.status(401).json({ success: false, message: 'Authentication required' });
  const database = readDb();
  const user = database.users.find((item) => item.id === payload.sub);
  if (!user) return res.status(401).json({ success: false, message: 'User not found' });
  req.user = user;
  req.db = database;
  next();
}

function organizationFor(req) {
  const organizationId = req.query.organizationId || req.body.organizationId || req.user?.organizationIds?.[0];
  return req.db.organizations.find((organization) => organization.id === organizationId) || req.db.organizations[0];
}

function formView(database, form) {
  const responses = database.responses.filter((response) => response.formId === form.id);
  return { ...form, responseCount: responses.length };
}

function addAudit(database, organizationId, action, description, actor) {
  database.auditLogs.unshift({ id: id('log'), organizationId, action, description, actor, createdAt: now() });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', service: 'feedbackhub-api' } }));

app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const database = readDb();
  const user = database.users.find((item) => item.email.toLowerCase() === String(req.body.email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(req.body.password || ''), user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  const organizations = user.organizationIds.map((organizationId) => database.organizations.find((organization) => organization.id === organizationId)).filter(Boolean);
  res.json({ success: true, data: { accessToken: tokenFor(user), refreshToken: tokenFor(user, 'refresh'), user: publicUser(user), organizations } });
});

app.post(`${API_PREFIX}/auth/register`, (req, res) => {
  const database = readDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email || !req.body.password || !req.body.firstName || !req.body.lastName) return res.status(400).json({ success: false, message: 'First name, last name, email, and password are required' });
  if (database.users.some((user) => user.email === email)) return res.status(409).json({ success: false, message: 'An account with that email already exists' });
  const organization = { id: id('org'), name: String(req.body.organizationName || 'My Workspace').trim(), slug: slugify(req.body.organizationName || 'My Workspace'), createdAt: now() };
  const user = { id: id('user'), email, passwordHash: bcrypt.hashSync(String(req.body.password), 10), firstName: req.body.firstName, lastName: req.body.lastName, role: 'ADMIN', organizationIds: [organization.id], createdAt: now() };
  database.organizations.push(organization);
  database.users.push(user);
  database.memberships.push({ id: id('member'), organizationId: organization.id, userId: user.id, role: 'ADMIN', status: 'ACTIVE' });
  addAudit(database, organization.id, 'WORKSPACE_CREATED', `Created ${organization.name}`, `${user.firstName} ${user.lastName}`);
  writeDb(database);
  res.status(201).json({ success: true, data: { accessToken: tokenFor(user), refreshToken: tokenFor(user, 'refresh'), user: publicUser(user), organizations: [organization] } });
});

app.post(`${API_PREFIX}/auth/refresh`, (req, res) => {
  try {
    const payload = jwt.verify(String(req.body.refreshToken || ''), JWT_SECRET);
    if (payload.type !== 'refresh') throw new Error('Wrong token type');
    const user = readDb().users.find((item) => item.id === payload.sub);
    if (!user) throw new Error('User not found');
    res.json({ success: true, data: { accessToken: tokenFor(user), refreshToken: tokenFor(user, 'refresh') } });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

app.get(`${API_PREFIX}/auth/me`, requireAuth, (req, res) => res.json({ success: true, data: publicUser(req.user) }));

app.get(`${API_PREFIX}/forms`, requireAuth, (req, res) => {
  const organization = organizationFor(req);
  const search = String(req.query.search || '').toLowerCase();
  const status = String(req.query.status || '');
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filtered = req.db.forms.filter((form) => form.organizationId === organization.id && (!search || form.title.toLowerCase().includes(search)) && (!status || form.status === status));
  const forms = filtered.slice((page - 1) * limit, page * limit).map((form) => formView(req.db, form));
  res.json({ success: true, data: { forms, pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } } });
});

app.post(`${API_PREFIX}/forms`, requireAuth, (req, res) => {
  const database = req.db;
  const organization = organizationFor(req);
  const form = {
    id: id('form'),
    organizationId: organization.id,
    publicId: slugify(req.body.title || 'feedback-form') + '-' + Math.random().toString(36).slice(2, 7),
    title: String(req.body.title || 'Untitled feedback form'),
    description: String(req.body.description || ''),
    status: 'DRAFT',
    allowAnonymous: req.body.allowAnonymous !== false,
    requireAuth: Boolean(req.body.requireAuth),
    onePerUser: Boolean(req.body.onePerUser),
    questions: Array.isArray(req.body.questions) ? req.body.questions : [],
    createdBy: req.user.id,
    createdAt: now(),
    updatedAt: now()
  };
  database.forms.unshift(form);
  addAudit(database, organization.id, 'FORM_CREATED', `Created ${form.title}`, `${req.user.firstName} ${req.user.lastName}`);
  writeDb(database);
  res.status(201).json({ success: true, data: formView(database, form) });
});

app.get(`${API_PREFIX}/forms/:id`, requireAuth, (req, res) => {
  const form = req.db.forms.find((item) => item.id === req.params.id);
  if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
  res.json({ success: true, data: formView(req.db, form) });
});

app.post(`${API_PREFIX}/forms/:id/publish`, requireAuth, (req, res) => {
  const form = req.db.forms.find((item) => item.id === req.params.id);
  if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
  form.status = 'PUBLISHED';
  form.updatedAt = now();
  addAudit(req.db, form.organizationId, 'FORM_PUBLISHED', `Published ${form.title}`, `${req.user.firstName} ${req.user.lastName}`);
  writeDb(req.db);
  res.json({ success: true, data: formView(req.db, form) });
});

app.post(`${API_PREFIX}/forms/:id/duplicate`, requireAuth, (req, res) => {
  const source = req.db.forms.find((item) => item.id === req.params.id);
  if (!source) return res.status(404).json({ success: false, message: 'Form not found' });
  const duplicate = { ...source, id: id('form'), publicId: slugify(`${source.title} copy`) + '-' + Math.random().toString(36).slice(2, 7), title: `${source.title} Copy`, status: 'DRAFT', createdBy: req.user.id, createdAt: now(), updatedAt: now() };
  req.db.forms.unshift(duplicate);
  addAudit(req.db, duplicate.organizationId, 'FORM_DUPLICATED', `Duplicated ${source.title}`, `${req.user.firstName} ${req.user.lastName}`);
  writeDb(req.db);
  res.status(201).json({ success: true, data: formView(req.db, duplicate) });
});

app.delete(`${API_PREFIX}/forms/:id`, requireAuth, (req, res) => {
  const index = req.db.forms.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Form not found' });
  const [removed] = req.db.forms.splice(index, 1);
  req.db.responses = req.db.responses.filter((response) => response.formId !== removed.id);
  addAudit(req.db, removed.organizationId, 'FORM_DELETED', `Deleted ${removed.title}`, `${req.user.firstName} ${req.user.lastName}`);
  writeDb(req.db);
  res.json({ success: true, data: { id: removed.id } });
});

app.get(`${API_PREFIX}/forms/:id/responses`, requireAuth, (req, res) => {
  const form = req.db.forms.find((item) => item.id === req.params.id);
  if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const all = req.db.responses.filter((response) => response.formId === form.id);
  res.json({ success: true, data: { responses: all.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) } } });
});

app.get(`${API_PREFIX}/forms/:id/analytics`, requireAuth, (req, res) => {
  const form = req.db.forms.find((item) => item.id === req.params.id);
  if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
  const responses = req.db.responses.filter((response) => response.formId === form.id);
  const ratingAnswers = responses.flatMap((response) => response.answers).filter((answer) => answer.questionId === 'q-1' && Number.isFinite(Number(answer.value)));
  const averageRating = ratingAnswers.length ? ratingAnswers.reduce((sum, answer) => sum + Number(answer.value), 0) / ratingAnswers.length : 0;
  res.json({ success: true, data: { form: formView(req.db, form), totalResponses: responses.length, averageRating: Number(averageRating.toFixed(2)), completionRate: responses.length ? 100 : 0, questionMetrics: form.questions.map((question) => ({ questionId: question.id, title: question.title, type: question.type, answered: responses.filter((response) => response.answers.some((answer) => answer.questionId === question.id && answer.value !== '')).length })) } });
});

app.get(`${API_PREFIX}/analytics/dashboard`, requireAuth, (req, res) => {
  const organization = organizationFor(req);
  const forms = req.db.forms.filter((form) => form.organizationId === organization.id);
  const responses = req.db.responses.filter((response) => forms.some((form) => form.id === response.formId));
  res.json({ success: true, data: { totalForms: forms.length, publishedForms: forms.filter((form) => form.status === 'PUBLISHED').length, totalResponses: responses.length, averageRating: 4.6, forms: forms.map((form) => formView(req.db, form)).sort((a, b) => b.responseCount - a.responseCount).slice(0, 5) } });
});

app.get(`${API_PREFIX}/organizations/:id/members`, requireAuth, (req, res) => {
  const members = req.db.memberships.filter((member) => member.organizationId === req.params.id).map((member) => {
    const user = req.db.users.find((item) => item.id === member.userId);
    return { ...member, name: member.name || (user ? `${user.firstName} ${user.lastName}` : member.email), email: member.email || user?.email };
  });
  res.json({ success: true, data: members });
});

app.post(`${API_PREFIX}/organizations/:id/members`, requireAuth, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const member = { id: id('member'), organizationId: req.params.id, email, name: email.split('@')[0], role: req.body.role || 'MEMBER', status: 'INVITED', createdAt: now() };
  req.db.memberships.push(member);
  addAudit(req.db, req.params.id, 'MEMBER_INVITED', `Invited ${email} to the workspace`, `${req.user.firstName} ${req.user.lastName}`);
  writeDb(req.db);
  res.status(201).json({ success: true, data: member });
});

app.get(`${API_PREFIX}/audit/logs`, requireAuth, (req, res) => {
  const organization = organizationFor(req);
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const all = req.db.auditLogs.filter((log) => log.organizationId === organization.id);
  res.json({ success: true, data: { logs: all.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: all.length } } });
});

app.get(`${API_PREFIX}/public/forms/:publicId`, (req, res) => {
  const database = readDb();
  const form = database.forms.find((item) => item.publicId === req.params.publicId && item.status === 'PUBLISHED');
  if (!form) return res.status(404).json({ success: false, message: 'Public form not found' });
  const organization = database.organizations.find((item) => item.id === form.organizationId);
  res.json({ success: true, data: { ...formView(database, form), organization: organization ? { id: organization.id, name: organization.name, slug: organization.slug } : null } });
});

app.post(`${API_PREFIX}/public/forms/:id/responses`, (req, res) => {
  const database = readDb();
  const form = database.forms.find((item) => item.publicId === req.params.id || item.id === req.params.id);
  if (!form || form.status !== 'PUBLISHED') return res.status(404).json({ success: false, message: 'Public form not found' });
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const missing = form.questions.some((question) => question.required && !answers.some((answer) => answer.questionId === question.id && answer.value !== '' && answer.value !== null && answer.value !== undefined));
  if (missing) return res.status(400).json({ success: false, message: 'Please answer all required questions' });
  const response = { id: id('response'), formId: form.id, respondent: req.body.respondent || 'Anonymous', isAnonymous: req.body.isAnonymous !== false, submittedAt: now(), answers };
  database.responses.unshift(response);
  addAudit(database, form.organizationId, 'RESPONSE_RECEIVED', 'New anonymous response received', 'Public respondent');
  writeDb(database);
  res.status(201).json({ success: true, data: response });
});

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`FeedbackHub API listening on http://localhost:${PORT}${API_PREFIX}`);
});
