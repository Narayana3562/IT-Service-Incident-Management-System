import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, CircleHelp, ClipboardList, LogOut, Plus, RefreshCw, Search, ShieldCheck, Ticket, X } from 'lucide-react';
import { api } from './api.js';

const blankForm = { title: '', description: '', category: 'Software', priority: 'medium' };
const badgeClass = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-rose-100 text-rose-700'
};
const pretty = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

function StatusBadge({ value }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass[value] || 'bg-slate-100 text-slate-700'}`}>{pretty(value)}</span>;
}

function Login({ onLogin, message }) {
  const [email, setEmail] = useState('employee@example.com');
  const [password, setPassword] = useState('DemoPass123!');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(message || '');

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(data);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
    <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
      <div className="flex flex-col justify-between bg-gradient-to-br from-blue-700 to-indigo-950 p-8 text-white md:p-10">
        <div><div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-white/15 p-3"><ShieldCheck size={26}/></div><span className="text-xl font-bold">IncidentDesk</span></div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[.2em] text-blue-200">IT service operations</p>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">Resolve incidents. Restore productivity.</h1>
          <p className="mt-4 text-sm leading-6 text-blue-100">A central workspace to report IT issues, assign support teams, and track service-level targets.</p>
        </div>
        <p className="mt-10 text-xs text-blue-200">Portfolio demo · React · Express · PostgreSQL</p>
      </div>
      <form onSubmit={submit} className="p-8 md:p-10">
        <h2 className="text-2xl font-bold">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to your incident workspace.</p>
        {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <label className="mt-6 block text-sm font-semibold">Email</label>
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
        <button disabled={busy} className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{busy?'Signing in…':'Sign in'}</button>
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><b>Demo employee</b><br/>employee@example.com · DemoPass123!<br/><span className="text-slate-500">Support: support@example.com · Admin: admin@example.com (same demo password)</span></div>
      </form>
    </div>
  </div>;
}

function StatCard({ title, value, icon: Icon, note }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Icon size={19}/></span></div>
    <p className="mt-3 text-3xl font-bold tracking-tight">{value ?? '—'}</p><p className="mt-2 text-xs text-slate-500">{note}</p>
  </div>;
}

function IncidentModal({ onClose, onCreated, token }) {
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api('/incidents', { token, method: 'POST', body: JSON.stringify(form) });
      onCreated(); onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Report an incident</h2><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={20}/></button></div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <label className="mt-5 block text-sm font-semibold">Title</label><input name="title" minLength="5" maxLength="160" required value={form.title} onChange={change} placeholder="e.g. VPN connection unavailable" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"/>
      <label className="mt-4 block text-sm font-semibold">Description</label><textarea name="description" minLength="10" maxLength="5000" required rows="4" value={form.description} onChange={change} placeholder="Describe the problem and its impact…" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"/>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="block text-sm font-semibold">Category</label><select name="category" value={form.category} onChange={change} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5">{['Hardware','Software','Network','Access','Email','Other'].map(x=><option key={x}>{x}</option>)}</select></div><div><label className="block text-sm font-semibold">Priority</label><select name="priority" value={form.priority} onChange={change} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5">{['low','medium','high','critical'].map(x=><option key={x} value={x}>{pretty(x)}</option>)}</select></div></div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold">Cancel</button><button disabled={busy} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy?'Submitting…':'Create incident'}</button></div>
    </form>
  </div>;
}

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('incident-session') || 'null'); } catch { return null; }
  });
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const token = session?.token;
  const user = session?.user;

  const load = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      const [list, summary] = await Promise.all([
        api(`/incidents?${params.toString()}`, { token }),
        api('/incidents/dashboard/stats', { token })
      ]);
      setIncidents(list.incidents); setPagination(list.pagination); setStats(summary.stats);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token, filters]);

  useEffect(() => { load(1); }, [load]);

  function login(data) {
    sessionStorage.setItem('incident-session', JSON.stringify(data));
    setSession(data);
  }
  function logout() {
    sessionStorage.removeItem('incident-session');
    setSession(null); setIncidents([]); setStats(null);
  }
  async function updateStatus(incident, status) {
    setError(''); setNotice('');
    try {
      await api(`/incidents/${incident.id}`, { token, method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(`${incident.ticket_key} updated to ${pretty(status)}.`);
      await load(pagination.page);
    } catch (err) { setError(err.message); }
  }

  if (!session) return <Login onLogin={login}/>;

  const elevated = ['support','admin'].includes(user.role);
  const pages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return <div className="min-h-screen">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 text-white lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6"><div className="rounded-xl bg-blue-600 p-2.5"><ShieldCheck size={23}/></div><div><p className="font-bold">IncidentDesk</p><p className="text-xs text-slate-400">Service operations</p></div></div>
      <div className="px-4 py-6"><p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Workspace</p><div className="mt-3 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-semibold"><ClipboardList size={18} className="text-blue-300"/> Incidents</div><div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"><Activity size={18}/> Service analytics</div></div>
      <div className="mt-auto border-t border-white/10 p-4"><div className="rounded-xl bg-white/5 p-3"><p className="text-sm font-semibold">{user.name}</p><p className="mt-1 text-xs capitalize text-slate-400">{user.role} account</p></div></div>
    </aside>
    <main className="lg:ml-64">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">IT service management</p><h1 className="mt-1 text-xl font-bold md:text-2xl">Incident overview</h1></div><div className="flex items-center gap-2"><span className="hidden text-right sm:block"><span className="block text-sm font-semibold">{user.name}</span><span className="text-xs capitalize text-slate-500">{user.role}</span></span><button onClick={logout} className="ml-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><LogOut size={16}/><span className="hidden sm:inline">Log out</span></button></div></header>
      <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-lg font-bold">Good to see you, {user.name.split(' ')[0]}</h2><p className="mt-1 text-sm text-slate-500">Monitor service requests and keep incidents moving.</p></div><div className="flex gap-2"><button onClick={()=>load(pagination.page)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"><RefreshCw size={16}/> Refresh</button><button onClick={()=>setModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"><Plus size={17}/> New incident</button></div></div>
        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{error}</div>}
        {notice && <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>{notice}<button onClick={()=>setNotice('')} className="ml-auto"><X size={16}/></button></div>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total incidents" value={stats?.total} icon={Ticket} note="All recorded tickets"/>
          <StatCard title="Open workload" value={stats?.open} icon={Activity} note="Open or in progress"/>
          <StatCard title="Resolved" value={stats?.resolved} icon={CheckCircle2} note="Successfully resolved"/>
          <StatCard title="High priority" value={stats?.high_priority} icon={AlertCircle} note={`${stats?.overdue ?? 0} overdue by SLA`}/>
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 md:p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="font-bold">Incident tickets</h3><p className="mt-1 text-sm text-slate-500">{pagination.total} records · Sorted by newest</p></div><div className="grid gap-2 sm:grid-cols-3"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Search incidents" placeholder="Search ticket/title" value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"/></div><select aria-label="Filter status" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All statuses</option>{['open','in_progress','resolved','closed'].map(s=><option key={s} value={s}>{pretty(s)}</option>)}</select><select aria-label="Filter priority" value={filters.priority} onChange={e=>setFilters({...filters,priority:e.target.value})} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All priorities</option>{['low','medium','high','critical'].map(s=><option key={s} value={s}>{pretty(s)}</option>)}</select></div></div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Ticket</th><th className="px-5 py-3 font-semibold">Priority</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Reporter / assignee</th><th className="px-5 py-3 font-semibold">SLA deadline</th>{elevated&&<th className="px-5 py-3 font-semibold">Quick action</th>}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <tr><td colSpan={elevated?6:5} className="px-5 py-12 text-center text-slate-500">Loading incidents…</td></tr>}
                {!loading && incidents.map(item=><tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-blue-700">{item.ticket_key}</p><p className="mt-1 max-w-xs truncate font-medium text-slate-800">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.category}</p></td><td className="px-5 py-4"><StatusBadge value={item.priority}/></td><td className="px-5 py-4"><StatusBadge value={item.status}/></td><td className="px-5 py-4"><p>{item.reporter_name}</p><p className="mt-1 text-xs text-slate-500">{item.assignee_name || 'Unassigned'}</p></td><td className="px-5 py-4 text-slate-600">{new Date(item.sla_due_at).toLocaleString()}</td>{elevated&&<td className="px-5 py-4"><select aria-label={`Update ${item.ticket_key} status`} value={item.status} onChange={e=>updateStatus(item,e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></td>}</tr>)}
                {!loading && incidents.length===0 && <tr><td colSpan={elevated?6:5} className="px-5 py-14 text-center"><CircleHelp size={28} className="mx-auto text-slate-300"/><p className="mt-3 font-semibold">No incidents found</p><p className="mt-1 text-sm text-slate-500">Try changing filters or create a new incident.</p></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Page {pagination.page} of {pages}</p><div className="flex gap-2"><button disabled={pagination.page<=1||loading} onClick={()=>load(pagination.page-1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button><button disabled={pagination.page>=pages||loading} onClick={()=>load(pagination.page+1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div>
        </section>
        <p className="text-center text-xs text-slate-400">IncidentDesk portfolio project · Protect credentials and configure secrets before deployment.</p>
      </div>
    </main>
    {modal&&<IncidentModal token={token} onClose={()=>setModal(false)} onCreated={()=>{setNotice('Incident created successfully.');load(1);}}/>}
  </div>;
}
