import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'feedbackhub-local-state-v1';

const seedQuestions = [
  { id: 'q-1', type: 'RATING', title: 'Overall Satisfaction Rate', description: 'How satisfied are you with our overall SaaS platform experience?', required: true, options: [] },
  { id: 'q-2', type: 'SINGLE_CHOICE', title: 'Primary Use Case', description: 'What is your main goal when using our platform?', required: true, options: ['Customer Feedback & Analytics', 'Employee Performance Reviews', 'Product Feature Testing', 'Market Research'] },
  { id: 'q-3', type: 'SCALE', title: 'Ease of Use (1 to 10)', description: 'On a scale of 1 to 10, how intuitive is our user interface?', required: true, options: [] },
  { id: 'q-4', type: 'YES_NO', title: 'Would you recommend us to a colleague?', description: '', required: true, options: ['Yes', 'No'] },
  { id: 'q-5', type: 'LONG_TEXT', title: 'What feature would you like us to build next?', description: 'Provide any detailed suggestions or feature requests.', required: false, options: [] }
];

const seedState = {
  authenticated: false,
  user: { firstName: 'Alex', lastName: 'Morgan', email: 'admin@feedback.com', role: 'ADMIN' },
  organization: { id: 'org-acme', name: 'Acme Tech Solutions', slug: 'acme-tech' },
  forms: [
    {
      id: 'csat-survey-2026',
      title: 'Customer Product Satisfaction Survey 2026',
      description: 'Help us improve our SaaS platform by providing your feedback on our features, UI experience, and customer support.',
      status: 'PUBLISHED',
      publicId: 'csat-survey-2026',
      responseCount: 128,
      updatedAt: '2026-10-27T09:30:00.000Z',
      questions: seedQuestions
    },
    {
      id: 'employee-pulse-q4',
      title: 'Employee Pulse Check — Q4',
      description: 'A quick pulse check for team sentiment and workplace experience.',
      status: 'DRAFT',
      publicId: 'employee-pulse-q4',
      responseCount: 0,
      updatedAt: '2026-10-24T14:10:00.000Z',
      questions: [
        { id: 'eq-1', type: 'SCALE', title: 'How supported do you feel this quarter?', description: '', required: true, options: [] },
        { id: 'eq-2', type: 'LONG_TEXT', title: 'What should we improve?', description: '', required: false, options: [] }
      ]
    },
    {
      id: 'feature-request-intake',
      title: 'Feature Request Intake',
      description: 'Collect structured requests from customers and internal stakeholders.',
      status: 'PUBLISHED',
      publicId: 'feature-request-intake',
      responseCount: 64,
      updatedAt: '2026-10-18T11:45:00.000Z',
      questions: [
        { id: 'fq-1', type: 'SHORT_TEXT', title: 'What feature would you like to see?', description: '', required: true, options: [] },
        { id: 'fq-2', type: 'LONG_TEXT', title: 'Tell us more about the problem.', description: '', required: true, options: [] }
      ]
    }
  ],
  members: [
    { id: 'member-1', name: 'Alex Morgan', email: 'admin@feedback.com', role: 'ADMIN', status: 'Active' },
    { id: 'member-2', name: 'Maya Chen', email: 'maya@acme.example', role: 'MANAGER', status: 'Active' },
    { id: 'member-3', name: 'Jordan Lee', email: 'jordan@acme.example', role: 'MEMBER', status: 'Invited' }
  ],
  auditLogs: [
    { id: 1, action: 'FORM_PUBLISHED', description: 'Published Customer Product Satisfaction Survey 2026', actor: 'Alex Morgan', time: '2 hours ago', tone: 'blue' },
    { id: 2, action: 'RESPONSE_RECEIVED', description: 'New anonymous response received', actor: 'Public respondent', time: '5 hours ago', tone: 'green' },
    { id: 3, action: 'MEMBER_INVITED', description: 'Invited Jordan Lee to the workspace', actor: 'Alex Morgan', time: '1 day ago', tone: 'purple' },
    { id: 4, action: 'FORM_CREATED', description: 'Created Employee Pulse Check — Q4', actor: 'Maya Chen', time: '3 days ago', tone: 'amber' }
  ],
  responses: {
    'csat-survey-2026': [
      { id: 'resp-101', respondent: 'Anonymous', submittedAt: '2026-10-28T08:42:00.000Z', answers: ['5 stars', 'Customer Feedback & Analytics', '9 / 10', 'Yes', 'The new dashboard is very clear.'] },
      { id: 'resp-100', respondent: 'Anonymous', submittedAt: '2026-10-27T16:20:00.000Z', answers: ['4 stars', 'Product Feature Testing', '8 / 10', 'Yes', 'More export formats would be helpful.'] },
      { id: 'resp-099', respondent: 'user@example.com', submittedAt: '2026-10-27T12:05:00.000Z', answers: ['4 stars', 'Market Research', '7 / 10', 'Yes', ''] }
    ]
  }
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...seedState, ...JSON.parse(saved) } : seedState;
  } catch {
    return seedState;
  }
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

function Icon({ children, className = '' }) {
  return <span className={`icon ${className}`} aria-hidden="true">{children}</span>;
}

function Brand() {
  return <div className="brand-lockup"><div className="brand-mark"><Icon>✦</Icon></div><div><div className="brand-name">Feedback<span>Hub</span> SaaS</div><div className="brand-subtitle">Enterprise Feedback Form Builder &amp; Analytics Platform</div></div></div>;
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

function AuthPage({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', organizationName: '', email: 'admin@feedback.com', password: 'Password123!' });
  const [error, setError] = useState('');
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.email || !form.password || (register && (!form.firstName || !form.lastName))) {
      setError('Please complete the required fields.');
      return;
    }
    onLogin({ ...form, firstName: form.firstName || 'Alex', lastName: form.lastName || 'Morgan' });
  };
  return <div className="auth-page">
    <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
    <div className="auth-card-wrap"><div className="auth-heading"><div className="auth-logo"><Icon>✦</Icon></div><h1>Feedback<span>Hub</span> SaaS</h1><p>Enterprise Feedback Form Builder &amp; Analytics Platform</p></div>
      <div className="glass auth-card">
        <div className="auth-tabs"><button className={!register ? 'active' : ''} onClick={() => { setRegister(false); setError(''); }}>Sign In</button><button className={register ? 'active' : ''} onClick={() => { setRegister(true); setError(''); }}>Register Workspace</button></div>
        <form onSubmit={submit} className="stack gap-4">
          {register && <div className="two-col"><Field label="First Name" value={form.firstName} placeholder="Alex" onChange={update('firstName')} required /><Field label="Last Name" value={form.lastName} placeholder="Morgan" onChange={update('lastName')} required /></div>}
          {register && <Field label="Organization Name" value={form.organizationName} placeholder="Acme Corp (Optional)" onChange={update('organizationName')} />}
          <Field label="Email Address" type="email" value={form.email} placeholder="admin@feedback.com" onChange={update('email')} required />
          <Field label="Password" type="password" value={form.password} placeholder="••••••••" onChange={update('password')} required />
          {error && <div className="error-box">{error}</div>}
          <Button type="submit" className="full-width">{register ? 'Create Account' : 'Sign In to Workspace'} <Icon>→</Icon></Button>
        </form>
        <div className="demo-note"><strong>🔑 Demo Portfolio Credentials:</strong><span>Admin: <code>admin@feedback.com</code> / <code>Password123!</code></span><span>Manager: <code>manager@feedback.com</code> / <code>Password123!</code></span></div>
      </div>
    </div>
  </div>;
}

function Field({ label, type = 'text', ...props }) {
  return <label className="field"><span>{label}</span><input type={type} {...props} /></label>;
}

function Layout({ path, state, onLogout, children }) {
  const [mobile, setMobile] = useState(false);
  const navItems = [
    ['Dashboard', '/dashboard', '⌂'], ['Feedback Forms', '/forms', '▣'], ['Form Builder', '/forms/new', '✎'], ['Analytics', '/analytics', '◒'], ['Team & Workspace', '/workspace', '♙'], ['Audit Logs', '/audit-logs', '◷']
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${mobile ? 'open' : ''}`}><div className="sidebar-top"><Brand /><button className="mobile-close" onClick={() => setMobile(false)}>×</button></div><div className="workspace-switcher"><div className="avatar">{state.organization.name.slice(0, 1)}</div><div><strong>{state.organization.name}</strong><small>Workspace</small></div><span>⌄</span></div><div className="nav-label">Main Menu</div><nav>{navItems.map(([label, href, glyph]) => <button key={href} className={path === href || (href === '/forms' && path.startsWith('/forms/')) ? 'nav-item active' : 'nav-item'} onClick={() => { navigate(href); setMobile(false); }}><Icon>{glyph}</Icon>{label}</button>)}</nav><div className="sidebar-bottom"><div className="mini-profile"><div className="avatar avatar-small">{state.user.firstName.slice(0, 1)}{state.user.lastName.slice(0, 1)}</div><div><strong>{state.user.firstName} {state.user.lastName}</strong><small>{state.user.role}</small></div><button onClick={onLogout} title="Sign out">↪</button></div></div></aside>
    <main className="main-area"><header className="topbar"><button className="menu-button" onClick={() => setMobile(true)}>☰</button><div className="crumb"><span>Workspace</span><b>/</b><strong>{navItems.find((item) => path === item[1] || (item[1] === '/forms' && path.startsWith('/forms/')))?.[0] || 'Overview'}</strong></div><div className="topbar-actions"><button className="icon-button">⌕</button><button className="icon-button notification">♢<i /></button><div className="top-user"><div className="avatar avatar-small">{state.user.firstName.slice(0, 1)}{state.user.lastName.slice(0, 1)}</div><div><strong>{state.user.firstName} {state.user.lastName}</strong><small>{state.user.role}</small></div><span>⌄</span></div></div></header><div className="page-content">{children}</div></main>
  </div>;
}

function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="header-actions">{actions}</div>}</div>;
}

function MetricCard({ label, value, detail, tone = 'blue', icon }) {
  return <div className={`metric-card tone-${tone}`}><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><strong>{value}</strong><small>{detail}</small></div>;
}

function Dashboard({ state }) {
  const totalForms = state.forms.length;
  const published = state.forms.filter((form) => form.status === 'PUBLISHED').length;
  const totalResponses = state.forms.reduce((sum, form) => sum + (form.responseCount || 0), 0);
  return <><PageHeader eyebrow="Overview" title="Feedback Overview" description={<>Real-time telemetry, response metrics, and workspace analytics for <b>{state.organization.name}</b>.</>} actions={<><Button onClick={() => navigate('/forms/new')}>＋ Create Form</Button><Button variant="secondary" onClick={() => navigate('/analytics')}>◒ Full Analytics</Button></>} />
    <div className="metric-grid"><MetricCard label="Total Forms" value={totalForms} detail="Created in workspace" tone="blue" icon="▣" /><MetricCard label="Active Published" value={published} detail="Currently collecting feedback" tone="green" icon="◉" /><MetricCard label="Total Responses" value={totalResponses} detail="Across all forms" tone="purple" icon="↗" /><MetricCard label="Average Rating" value="4.6 / 5" detail="Based on 128 responses" tone="amber" icon="★" /></div>
    <div className="dashboard-grid"><section className="glass panel"><div className="panel-heading"><div><h2>Response Volume</h2><p>Responses received over the last 7 days</p></div><span className="status-pill green">Live</span></div><div className="bar-chart">{[42, 58, 46, 72, 63, 88, 78].map((height, index) => <div className="bar-column" key={index}><div className="bar" style={{ height: `${height}%` }} /><small>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</small></div>)}</div></section><section className="glass panel"><div className="panel-heading"><div><h2>Top Forms</h2><p>Highest response volume</p></div><button className="text-button" onClick={() => navigate('/forms')}>View All →</button></div><div className="top-forms">{state.forms.slice(0, 3).map((form, index) => <div className="top-form" key={form.id}><div className={`rank rank-${index + 1}`}>{index + 1}</div><div className="top-form-copy"><strong>{form.title}</strong><small>{form.status === 'PUBLISHED' ? 'Published' : 'Draft'} · Updated recently</small></div><b>{form.responseCount}</b></div>)}</div></section></div>
    <section className="glass panel activity-panel"><div className="panel-heading"><div><h2>Recent Activity</h2><p>Latest workspace events</p></div><button className="text-button" onClick={() => navigate('/audit-logs')}>View Audit Log →</button></div><div className="activity-list">{state.auditLogs.slice(0, 4).map((log) => <div className="activity-row" key={log.id}><div className={`activity-dot ${log.tone}`} /><div><strong>{log.description}</strong><small>{log.actor} · {log.time}</small></div><span>{log.action.replaceAll('_', ' ')}</span></div>)}</div></section>
  </>;
}

function FormsPage({ state, updateState }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const forms = state.forms.filter((form) => form.title.toLowerCase().includes(search.toLowerCase()) && (!status || form.status === status));
  const mutate = (kind, id) => {
    const form = state.forms.find((item) => item.id === id);
    if (!form) return;
    if (kind === 'delete' && !window.confirm(`Delete “${form.title}”?`)) return;
    let nextForms = state.forms;
    if (kind === 'delete') nextForms = state.forms.filter((item) => item.id !== id);
    if (kind === 'publish') nextForms = state.forms.map((item) => item.id === id ? { ...item, status: 'PUBLISHED' } : item);
    if (kind === 'duplicate') nextForms = [...state.forms, { ...form, id: uid('form'), publicId: uid('public'), title: `${form.title} Copy`, status: 'DRAFT', responseCount: 0, updatedAt: new Date().toISOString() }];
    updateState({ ...state, forms: nextForms });
  };
  return <><PageHeader eyebrow="Workspace" title="Feedback Forms" description="Create, publish, and manage the forms collecting customer insight." actions={<Button onClick={() => navigate('/forms/new')}>＋ Create Form</Button>} /><div className="toolbar glass"><div className="search-box">⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search forms..." /></div><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select></div><div className="form-grid">{forms.length ? forms.map((form) => <div className="glass form-card" key={form.id}><div className="form-card-top"><span className={`status-pill ${form.status === 'PUBLISHED' ? 'green' : 'gray'}`}>{form.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span><button className="kebab">⋮</button></div><h2>{form.title}</h2><p>{form.description}</p><div className="form-card-meta"><span>↗ {form.responseCount} responses</span><span>◷ Updated {new Date(form.updatedAt).toLocaleDateString()}</span></div><div className="form-card-actions"><Button variant="secondary" onClick={() => navigate(`/forms/${form.id}/responses`)}>Responses</Button><button className="square-action" onClick={() => navigate(`/forms/${form.id}/analytics`)} title="Analytics">◒</button><button className="square-action" onClick={() => mutate('duplicate', form.id)} title="Duplicate">⧉</button><button className="square-action danger" onClick={() => mutate('delete', form.id)} title="Delete">⌫</button></div>{form.status === 'DRAFT' && <button className="publish-link" onClick={() => mutate('publish', form.id)}>Publish form →</button>}</div>) : <div className="empty-state glass"><div>⌕</div><h2>No Feedback Forms Found</h2><p>Build your first feedback form to start gathering responses.</p><Button onClick={() => navigate('/forms/new')}>Create Feedback Form</Button></div>}</div></>;
}

function FormBuilder({ state, updateState }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ id: uid('question'), type: 'SHORT_TEXT', title: 'What would you like to tell us?', description: '', required: true, options: [] }]);
  const addQuestion = () => setQuestions((current) => [...current, { id: uid('question'), type: 'LONG_TEXT', title: 'New question', description: '', required: false, options: [] }]);
  const updateQuestion = (id, key, value) => setQuestions((current) => current.map((question) => question.id === id ? { ...question, [key]: value } : question));
  const save = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    const form = { id: uid('form'), publicId: uid('public'), title: title.trim(), description, status: 'DRAFT', responseCount: 0, updatedAt: new Date().toISOString(), questions };
    updateState({ ...state, forms: [form, ...state.forms], auditLogs: [{ id: uid('log'), action: 'FORM_CREATED', description: `Created ${form.title}`, actor: `${state.user.firstName} ${state.user.lastName}`, time: 'Just now', tone: 'blue' }, ...state.auditLogs] });
    navigate('/forms');
  };
  return <><PageHeader eyebrow="Form Builder" title="Create a Feedback Form" description="Design a focused survey and start collecting useful product insight." actions={<Button variant="secondary" onClick={() => navigate('/forms')}>Cancel</Button>} /><form onSubmit={save} className="builder-layout"><section className="glass panel builder-main"><div className="section-title"><div><h2>Form details</h2><p>Give your form a clear title and helpful context.</p></div><span className="step-count">Step 1 of 2</span></div><Field label="Form title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Customer Satisfaction Survey" required /><label className="field"><span>Description</span><textarea rows="4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell respondents why you are asking for feedback..." /></label><div className="section-title questions-heading"><div><h2>Questions</h2><p>Choose the question type and edit its copy.</p></div><Button type="button" variant="secondary" onClick={addQuestion}>＋ Add question</Button></div>{questions.map((question, index) => <div className="question-editor" key={question.id}><div className="question-editor-top"><span className="question-number">{index + 1}</span><select value={question.type} onChange={(event) => updateQuestion(question.id, 'type', event.target.value)}><option value="SHORT_TEXT">Short text</option><option value="LONG_TEXT">Long text</option><option value="RATING">Star rating</option><option value="SCALE">Scale 1–10</option><option value="SINGLE_CHOICE">Single choice</option><option value="YES_NO">Yes / No</option></select><label className="switch-label"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, 'required', event.target.checked)} /> Required</label></div><input className="question-input" value={question.title} onChange={(event) => updateQuestion(question.id, 'title', event.target.value)} /><input className="question-input muted" value={question.description} onChange={(event) => updateQuestion(question.id, 'description', event.target.value)} placeholder="Optional description" /></div>)}<Button type="submit" className="save-form-button">Save as Draft <Icon>→</Icon></Button></section><aside className="glass panel preview-panel"><div className="section-title"><div><h2>Preview</h2><p>How respondents will see it.</p></div><span className="status-pill gray">Draft</span></div><div className="preview-card"><div className="preview-brand">Acme Tech Solutions</div><h3>{title || 'Your form title'}</h3><p>{description || 'A helpful description will appear here.'}</p>{questions.slice(0, 3).map((question, index) => <div className="preview-question" key={question.id}><strong>{index + 1}. {question.title || 'Untitled question'} {question.required && <em>*</em>}</strong><small>{question.type.replace('_', ' ')}</small></div>)}</div></aside></form></>;
}

function ResponsesPage({ form, state }) {
  const responses = state.responses[form.id] || [];
  const exportCsv = () => {
    const rows = [['Response ID', 'Respondent', 'Submitted At', ...form.questions.map((question) => question.title)], ...responses.map((response) => [response.id, response.respondent, response.submittedAt, ...response.answers])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`; link.download = `feedback_responses_${form.id}.csv`; link.click();
  };
  return <><PageHeader eyebrow="Feedback Forms" title={form.title} description="Review the responses submitted by customers and team members." actions={<><Button variant="secondary" onClick={() => navigate(`/forms/${form.id}/analytics`)}>◒ Analytics</Button><Button onClick={exportCsv}>⇩ Export CSV</Button></>} /><div className="detail-summary"><div className="glass summary-card"><span>Total Responses</span><strong>{form.responseCount}</strong><small>All time</small></div><div className="glass summary-card"><span>Average Rating</span><strong>4.6 <small>/ 5</small></strong><small>Based on rating answers</small></div><div className="glass summary-card"><span>Response Rate</span><strong>68%</strong><small>From shared form links</small></div></div><section className="glass table-panel"><div className="table-heading"><div><h2>Response Feed</h2><p>Latest responses appear first.</p></div><span className="status-pill green">Receiving public responses</span></div>{responses.length ? <div className="table-wrap"><table><thead><tr><th>Response</th><th>Respondent</th><th>Submitted</th><th>Summary</th></tr></thead><tbody>{responses.map((response) => <tr key={response.id}><td><strong className="mono">{response.id}</strong></td><td>{response.respondent}</td><td>{new Date(response.submittedAt).toLocaleString()}</td><td><span className="answer-chip">{response.answers[0]}</span><span className="answer-chip">{response.answers[2]}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><div>↗</div><h2>No Responses Yet</h2><p>Share your public form URL to collect feedback from your users.</p></div>}</section></>;
}

function Analytics({ form, state }) {
  const source = form || state.forms[0];
  const data = [22, 34, 28, 46, 41, 68, 55, 72, 63, 86, 77, 94];
  return <><PageHeader eyebrow="Analytics" title={form ? `${form.title} Analytics` : 'Workspace Analytics'} description="Understand response volume, ratings, and question-level trends." actions={form && <Button variant="secondary" onClick={() => navigate(`/forms/${form.id}/responses`)}>View Responses →</Button>} /><div className="metric-grid analytics-metrics"><MetricCard label="Total Responses" value={source.responseCount} detail="+18.4% this month" tone="blue" icon="↗" /><MetricCard label="Average Rating" value="4.6 / 5" detail="+0.3 from last period" tone="green" icon="★" /><MetricCard label="Completion Rate" value="82%" detail="Across all questions" tone="purple" icon="✓" /><MetricCard label="Daily Trend Peak" value="94" detail="responses / day" tone="amber" icon="◒" /></div><div className="dashboard-grid"><section className="glass panel wide-panel"><div className="panel-heading"><div><h2>Response Volume Over Time</h2><p>Daily response trend for the selected period</p></div><select className="range-select"><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select></div><div className="line-chart"><div className="chart-grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 800 240" preserveAspectRatio="none" aria-label="Response volume chart"><polyline points={data.map((value, index) => `${index * 72},${230 - value * 2}`).join(' ')} fill="none" stroke="#0c82ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><polyline points={`${data.map((value, index) => `${index * 72},${230 - value * 2}`).join(' ')} 792,240 0,240`} fill="url(#chartFill)" opacity=".25" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#0c82ff" /><stop offset="1" stopColor="#0c82ff" stopOpacity="0" /></linearGradient></defs></svg></div></section><section className="glass panel"><div className="panel-heading"><div><h2>Rating Distribution</h2><p>Customer satisfaction scores</p></div></div><div className="rating-bars">{[['5 stars', 74, 'green'], ['4 stars', 39, 'blue'], ['3 stars', 18, 'purple'], ['2 stars', 8, 'amber'], ['1 star', 3, 'red']].map(([label, value, tone]) => <div className="rating-row" key={label}><span>{label}</span><div><i className={tone} style={{ width: `${value}%` }} /></div><b>{value}</b></div>)}</div></section></div><section className="glass panel"><div className="panel-heading"><div><h2>Question Metrics Breakdown</h2><p>Performance by question type</p></div></div><div className="question-metrics">{source.questions.map((question, index) => <div className="metric-row" key={question.id}><span className="question-number">{index + 1}</span><div><strong>{question.title}</strong><small>{question.type.replace('_', ' ')} · {question.required ? 'Required' : 'Optional'}</small></div><b>{question.type === 'RATING' ? '4.6 / 5' : question.type === 'SCALE' ? '8.4 / 10' : `${Math.max(28, 94 - index * 9)}% answered`}</b></div>)}</div></section></>;
}

function Workspace({ state, updateState }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const invite = (event) => { event.preventDefault(); if (!email) return; updateState({ ...state, members: [...state.members, { id: uid('member'), name: email.split('@')[0], email, role, status: 'Invited' }], auditLogs: [{ id: uid('log'), action: 'MEMBER_INVITED', description: `Invited ${email} to the workspace`, actor: `${state.user.firstName} ${state.user.lastName}`, time: 'Just now', tone: 'purple' }, ...state.auditLogs] }); setEmail(''); };
  return <><PageHeader eyebrow="Workspace" title="Team & Workspace" description="Manage members, roles, and workspace preferences." /><div className="workspace-grid"><section className="glass panel"><div className="panel-heading"><div><h2>Invite a teammate</h2><p>Add a member to help create and manage feedback forms.</p></div></div><form className="invite-form" onSubmit={invite}><Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" required /><label className="field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="MEMBER">MEMBER — View assigned forms</option><option value="MANAGER">MANAGER — Create &amp; edit forms</option><option value="ADMIN">ADMIN — Full workspace management</option></select></label><Button type="submit">＋ Add Member</Button></form></section><section className="glass panel workspace-info"><div className="workspace-avatar">A</div><h2>{state.organization.name}</h2><p>Acme workspace · created October 2026</p><div className="info-stat"><span>Members</span><strong>{state.members.length}</strong></div><div className="info-stat"><span>Published forms</span><strong>{state.forms.filter((form) => form.status === 'PUBLISHED').length}</strong></div></section></div><section className="glass table-panel"><div className="table-heading"><div><h2>Workspace Members</h2><p>Roles control what each member can do.</p></div><span className="status-pill blue">{state.members.length} members</span></div><div className="table-wrap"><table><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Access</th></tr></thead><tbody>{state.members.map((member) => <tr key={member.id}><td><div className="member-cell"><div className="avatar avatar-small">{member.name.slice(0, 1).toUpperCase()}</div><div><strong>{member.name}</strong><small>{member.email}</small></div></div></td><td><span className="role-pill">{member.role}</span></td><td><span className={`status-pill ${member.status === 'Active' ? 'green' : 'gray'}`}>{member.status}</span></td><td><button className="text-button">Manage →</button></td></tr>)}</tbody></table></div></section></>;
}

function AuditLogs({ state }) {
  return <><PageHeader eyebrow="Workspace" title="Audit Logs" description="A transparent history of important workspace and form events." /><section className="glass table-panel"><div className="table-heading"><div><h2>Activity history</h2><p>Showing the latest workspace events.</p></div><button className="text-button">Filter events ⌄</button></div><div className="audit-list">{state.auditLogs.map((log) => <div className="audit-row" key={log.id}><div className={`activity-dot ${log.tone}`} /><div className="audit-copy"><strong>{log.action.replaceAll('_', ' ')}</strong><span>{log.description}</span><small>{log.actor}</small></div><time>{log.time}</time></div>)}</div></section></>;
}

function PublicFeedback({ state, updateState, form }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const setAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }));
  const submit = (event) => { event.preventDefault(); const requiredMissing = form.questions.some((question) => question.required && !answers[question.id]); if (requiredMissing) return; const response = { id: uid('resp'), respondent: 'Anonymous', submittedAt: new Date().toISOString(), answers: form.questions.map((question) => answers[question.id] || '') }; const forms = state.forms.map((item) => item.id === form.id ? { ...item, responseCount: item.responseCount + 1 } : item); updateState({ ...state, forms, responses: { ...state.responses, [form.id]: [response, ...(state.responses[form.id] || [])] } }); setSubmitted(true); };
  if (submitted) return <div className="public-page"><div className="public-success glass"><div className="success-icon">✓</div><h1>Thank you for your feedback!</h1><p>Your response has been recorded and will help us improve the product.</p><Button onClick={() => { setSubmitted(false); setAnswers({}); }}>Submit another response</Button></div></div>;
  return <div className="public-page"><div className="public-wrap"><section className="glass public-header"><div className="public-company"><div className="public-company-avatar">A</div><div><span>{state.organization.name}</span><h1>{form.title}</h1></div></div><p>{form.description}</p></section><form className="public-form" onSubmit={submit}>{form.questions.map((question, index) => <div className="glass question-card" key={question.id}><label>{index + 1}. {question.title} {question.required && <em>*</em>}</label>{question.description && <p>{question.description}</p>}{question.type === 'RATING' && <div className="star-row">{[1, 2, 3, 4, 5].map((value) => <button type="button" className={Number(answers[question.id]) >= value ? 'selected' : ''} key={value} onClick={() => setAnswer(question.id, value)}>★</button>)}</div>}{question.type === 'SINGLE_CHOICE' && <div className="choice-list">{question.options.map((option) => <label className={answers[question.id] === option ? 'choice selected' : 'choice'} key={option}><input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} />{option}</label>)}</div>}{question.type === 'SCALE' && <div className="scale-row">{Array.from({ length: 10 }, (_, item) => item + 1).map((value) => <button type="button" className={Number(answers[question.id]) === value ? 'selected' : ''} key={value} onClick={() => setAnswer(question.id, value)}>{value}</button>)}</div>}{question.type === 'YES_NO' && <div className="yes-no"><button type="button" className={answers[question.id] === 'Yes' ? 'selected' : ''} onClick={() => setAnswer(question.id, 'Yes')}>Yes</button><button type="button" className={answers[question.id] === 'No' ? 'selected' : ''} onClick={() => setAnswer(question.id, 'No')}>No</button></div>}{question.type === 'LONG_TEXT' && <textarea rows="4" value={answers[question.id] || ''} onChange={(event) => setAnswer(question.id, event.target.value)} placeholder="Type your response here..." />}{question.type === 'SHORT_TEXT' && <input value={answers[question.id] || ''} onChange={(event) => setAnswer(question.id, event.target.value)} placeholder="Type your response here..." />}</div>)}<Button type="submit" className="full-width submit-feedback">Submit Feedback Response</Button></form></div></div>;
}

function App() {
  const path = usePath();
  const [state, setState] = useState(loadState);
  useEffect(() => saveState(state), [state]);
  const updateState = (next) => setState(next);
  const login = (details) => { setState((current) => ({ ...current, authenticated: true, user: { ...current.user, firstName: details.firstName, lastName: details.lastName, email: details.email }, organization: { ...current.organization, name: details.organizationName || current.organization.name } })); navigate('/dashboard'); };
  const logout = () => { setState((current) => ({ ...current, authenticated: false })); navigate('/auth/login'); };
  if (path.startsWith('/feedback/')) {
    const publicId = path.split('/')[2];
    const form = state.forms.find((item) => item.publicId === publicId) || state.forms[0];
    return <PublicFeedback state={state} updateState={updateState} form={form} />;
  }
  if (!state.authenticated) return <AuthPage onLogin={login} />;
  let content = <Dashboard state={state} />;
  if (path === '/forms') content = <FormsPage state={state} updateState={updateState} />;
  else if (path === '/forms/new') content = <FormBuilder state={state} updateState={updateState} />;
  else if (path.match(/^\/forms\/[^/]+\/responses$/)) { const form = state.forms.find((item) => item.id === path.split('/')[2]) || state.forms[0]; content = <ResponsesPage form={form} state={state} />; }
  else if (path.match(/^\/forms\/[^/]+\/analytics$/)) { const form = state.forms.find((item) => item.id === path.split('/')[2]) || state.forms[0]; content = <Analytics form={form} state={state} />; }
  else if (path === '/analytics') content = <Analytics state={state} />;
  else if (path === '/workspace') content = <Workspace state={state} updateState={updateState} />;
  else if (path === '/audit-logs') content = <AuditLogs state={state} />;
  return <Layout path={path} state={state} onLogout={logout}>{content}</Layout>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
