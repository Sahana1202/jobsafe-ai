import { useEffect, useState } from 'react';
import { ShieldCheck, BriefcaseBusiness, FileCheck, UserRound, MessageSquareText, Clock3, ChevronDown, ArrowUpRight, Plus, CircleQuestionMark, LockKeyhole, TriangleAlert, CircleCheck, X, LoaderCircle, LogOut } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (mode === 'register' && password !== confirmPassword) { setError('Your passwords do not match.'); return; }
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Could not connect to JOBSAFE AI. Start the backend and try again.');
      onAuthenticated(data);
    } catch (cause) {
      setError(cause instanceof TypeError ? 'Can’t reach the JOBSAFE AI service. Make sure the backend is running on port 8000.' : cause.message);
    } finally { setBusy(false); }
  };

  return <main className="auth-page"><div className="auth-brand"><span className="brand-mark"><ShieldCheck size={23}/></span><span>JOBSAFE<span className="brand-ai"> AI</span><small>CAREER SAFETY, CLEARLY</small></span></div><div className="auth-layout"><section className="auth-intro"><div className="auth-tag"><span/> YOUR NEXT MOVE, WITH MORE CONFIDENCE</div><h1>Verify before<br/>you <em>apply.</em></h1><p>Understand the signals behind a job opportunity before you share your time, money, or personal information.</p><div className="auth-points"><div><span><ShieldCheck size={17}/></span><div><b>Evidence before conclusions</b><small>See what was checked and what remains unverified.</small></div></div><div><span><LockKeyhole size={17}/></span><div><b>Start with what you have</b><small>Choose an opportunity type and share the details you want reviewed.</small></div></div></div><div className="auth-footnote">A risk assessment is not proof of fraud. Always verify important details independently.</div></section><section className="auth-card"><div className="auth-card-top"><div className="auth-mobile-mark"><ShieldCheck size={17}/></div><span className="auth-kicker">PERSONAL WORKSPACE</span><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p>{mode === 'login' ? 'Sign in to continue to your dashboard.' : 'Your verification workspace starts here.'}</p></div><form onSubmit={submit}>{mode === 'register' && <label>Your name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Smith" required maxLength={100}/></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required maxLength={320}/></label><label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} required minLength={mode === 'login' ? 1 : 8} maxLength={128}/></label>{mode === 'register' && <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter your password again" required minLength={8}/></label>}{error && <div className="auth-error" role="alert">{error}</div>}<button className="button-primary auth-submit" disabled={busy}>{busy ? <><LoaderCircle size={16} className="spin"/> Please wait…</> : mode === 'login' ? <>Sign in <ArrowUpRight size={16}/></> : <>Create account <ArrowUpRight size={16}/></>}</button></form><div className="auth-switch">{mode === 'login' ? <>New to JOBSAFE AI? <button onClick={()=>{setMode('register');setError('')}}>Create an account</button></> : <>Already registered? <button onClick={()=>{setMode('login');setError('')}}>Sign in</button></>}</div><div className="auth-secure"><LockKeyhole size={13}/> Passwords are securely hashed before storage.</div></section></div><div className="auth-bottom"><span>© 2026 JOBSAFE AI</span><span>VERIFY BEFORE YOU APPLY <b>·</b> RISK ASSESSMENT, NOT A VERDICT</span></div></main>;
}

const checks = [
  { label: 'Job posting', icon: BriefcaseBusiness, type: 'job', details: 'Job post details', placeholder: 'Paste the job title, description, salary, or recruiter message…' },
  { label: 'Internship', icon: FileCheck, type: 'internship', details: 'Internship details', placeholder: 'Paste the internship description, stipend, duration, or any fee request…' },
  { label: 'LinkedIn profile', icon: UserRound, type: 'linkedin', details: 'Profile information', placeholder: 'Paste profile information you are authorized to review. We do not scrape LinkedIn…' },
  { label: 'Offer letter', icon: FileCheck, type: 'offer-letter', details: 'Offer letter details', placeholder: 'Paste the offer text or details you want reviewed. File upload is not available yet…' },
  { label: 'Recruitment message', icon: MessageSquareText, type: 'message', details: 'Message details', placeholder: 'Paste the email, SMS, WhatsApp, or other recruitment message…' },
];

function App() {
  const [auth, setAuth] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [active, setActive] = useState('New check');
  const [selected, setSelected] = useState('job');
  const [text, setText] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem('jobsafe-session') || 'null'); } catch { saved = null; }
    if (!saved?.access_token) { setAuthReady(true); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${saved.access_token}` } })
      .then(response => { if (!response.ok) throw new Error('Session expired'); return response.json(); })
      .then(user => setAuth({ ...saved, user }))
      .catch(() => localStorage.removeItem('jobsafe-session'))
      .finally(() => setAuthReady(true));
  }, []);

  const completeAuthentication = (session) => {
    localStorage.setItem('jobsafe-session', JSON.stringify(session));
    setAuth(session);
  };

  const signOut = async () => {
    try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}` } }); } catch { /* Clear local session even if offline. */ }
    localStorage.removeItem('jobsafe-session'); setAuth(null); setResult(null);
  };

  const analyze = async (event) => {
    event.preventDefault();
    if (![company, email, url, text].some(value => value.trim())) {
      setFormError('Add at least one detail so we have something to review.');
      return;
    }
    setFormError('');
    setBusy(true); setResult(null);
    const payload = { company_name: company, recruiter_email: email, description: text, url };
    try {
      const response = await fetch(`${API_BASE}/api/analyze/${selected}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.access_token}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('API unavailable');
      setResult(await response.json());
    } catch {
      setResult({ risk_score: 0, risk_level: 'UNABLE TO VERIFY', findings: [], explanation: 'The analysis service is not connected. Start the FastAPI backend to analyze this submission.', demo: false });
    } finally { setBusy(false); }
  };

  if (!authReady) return <main className="auth-loading"><span className="brand-mark"><ShieldCheck size={23}/></span><LoaderCircle className="spin" size={18}/></main>;
  if (!auth) return <AuthScreen onAuthenticated={completeAuthentication} />;

  const initials = auth.user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const selectedCheck = checks.find(check => check.type === selected);
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase();

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#home"><span className="brand-mark"><ShieldCheck size={21}/></span><span>JOBSAFE<span className="brand-ai"> AI</span><small>CAREER SAFETY, CLEARLY</small></span></a>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <nav className="nav">
        <button className={active === 'New check' ? 'nav-item active' : 'nav-item'} onClick={() => setActive('New check')}><BriefcaseBusiness size={17}/> New check</button>
        <button className={active === 'History' ? 'nav-item active' : 'nav-item'} onClick={() => setActive('History')}><Clock3 size={17}/> My checks</button>
      </nav>
      <div className="side-section">START A CHECK</div>
      <div className="check-nav">{checks.map(({label, icon: Icon, type}) => <button key={type} onClick={() => {setSelected(type); setActive('New check'); setResult(null); setFormError('');}} className={selected === type && active === 'New check' ? 'check-link selected' : 'check-link'}><Icon size={16}/>{label}</button>)}</div>
      <div className="sidebar-bottom"><div className="help-card"><CircleQuestionMark size={17}/><div><b>Need a hand?</b><span>Learn how risk scores work</span></div><ArrowUpRight size={15}/></div><button className="nav-item" onClick={signOut}><LogOut size={17}/> Sign out</button><div className="user-row"><div className="avatar">{initials}</div><div className="user-meta"><b>{auth.user.name}</b><span>Personal workspace</span></div></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> {active}</div><div className="top-actions"><span className="account-label">{auth.user.email}</span><div className="top-avatar">{initials}</div></div></header>
      <div className="content">
        <div className="welcome"><div><div className="eyebrow">{todayLabel}</div><h1>{active === 'History' ? 'Your checks' : `Welcome, ${auth.user.name.split(' ')[0]}`} <span>✦</span></h1><p>{active === 'History' ? 'Checks you complete will appear here.' : 'What would you like to know about an opportunity?'}</p></div>{active === 'History' && <button className="button-primary" onClick={() => setActive('New check')}><Plus size={17}/> Start a check</button>}</div>
        {active === 'New check' ? <><div className="section-heading"><div><h2>What would you like to check?</h2><p>Choose what you received, then share the details you want us to review.</p></div><span className="secure-label"><LockKeyhole size={13}/> PRIVATE BY DESIGN</span></div>
        <section className="analyzer-card">
          <div className="analyzer-left"><div className="steps"><span className="step-on">01</span><i/><span>02</span><i/><span>03</span><small>SUBMIT <b>·</b> REVIEW <b>·</b> REPORT</small></div><h3>Choose the type<br/>of opportunity</h3><div className="type-grid">{checks.map(({label, icon: Icon, type}) => <button className={selected === type ? 'type-option chosen' : 'type-option'} key={type} onClick={() => {setSelected(type);setResult(null);setFormError('')}}><Icon size={17}/><span>{label}</span>{selected === type && <span className="radio-dot"/>}</button>)}</div><div className="privacy-note"><LockKeyhole size={15}/><span>Only share information you have permission to review.</span></div></div>
          <div className="analyzer-right"><div className="form-heading"><div><h3>Tell us what you received</h3><p>Fill in what you know. Add at least one detail to start.</p></div><span className="optional">STEP 1 OF 3</span></div><form onSubmit={analyze}><label>Company or organization <span>OPTIONAL</span><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Acme Technologies"/></label><label>{selected === 'linkedin' ? 'Contact email (if available)' : 'Recruiter or HR email'} <span>OPTIONAL</span><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" type="email"/></label><label>{selected === 'linkedin' ? 'Profile URL' : 'Link you received'} <span>OPTIONAL</span><input value={url} onChange={e=>setUrl(e.target.value)} placeholder={selected === 'linkedin' ? 'https://linkedin.com/in/…' : 'https://example.com/careers/role'}/></label><label>{selectedCheck.details} <span>OPTIONAL</span><textarea value={text} onChange={e=>setText(e.target.value)} placeholder={selectedCheck.placeholder} rows="4"/></label>{formError && <div className="auth-error" role="alert">{formError}</div>}<div className="form-foot"><span><LockKeyhole size={13}/> Your data stays yours</span><button disabled={busy} className="button-primary submit">{busy ? <><LoaderCircle size={16} className="spin"/> Reviewing…</> : <>Review submission <ArrowUpRight size={16}/></>}</button></div></form></div>
        </section>

        {result && <section className="result-panel"><div className="result-header"><div><span className="eyebrow">ASSESSMENT RESULT</span><h2>{result.risk_level} <small>· {result.risk_score}/100</small></h2></div><button className="icon-button" onClick={()=>setResult(null)} aria-label="Close result"><X size={18}/></button></div><p>{result.explanation}</p>{result.findings?.length ? result.findings.map((f,i)=><div className="finding" key={i}><TriangleAlert size={16}/><div><b>{f.indicator}</b><p>{f.description}</p><small>Why: {f.why} · Source: {f.source}</small></div></div>) : <p className="muted">No findings were returned. This does not confirm the opportunity is legitimate.</p>}<div className="caution"><TriangleAlert size={15}/> Risk assessment — not proof of fraud. Verify independently before sending money or sensitive information.</div></section>}

        </> : <section className="empty-history"><span className="empty-icon"><Clock3 size={21}/></span><h2>No checks yet</h2><p>No verification history is saved yet. This prototype shows each assessment on screen, but does not keep a history after you leave it.</p><button className="button-primary" onClick={() => setActive('New check')}><Plus size={16}/> Start your first check</button></section>}
        <footer><span>JOBSAFE AI <b>·</b> Verify before you apply.</span><span><a href="#methodology">How it works</a><a href="#privacy">Privacy</a><a href="#disclaimer">Disclaimer</a></span></footer>
      </div>
    </main>
  </div>;
}

export default App;
