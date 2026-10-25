import { useState } from 'react';
import { PiggyBank, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { fmtDate, toInputDate } from '../utils/format';
import { Confirm, Empty, ErrorBox, Field, Modal, Progress, Spinner } from '../components/ui';

function GoalForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || '', targetAmount: initial?.targetAmount || '', currentAmount: initial?.currentAmount ?? 0,
    deadline: initial?.deadline ? toInputDate(initial.deadline) : '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { title: form.title, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount || 0), deadline: form.deadline || null };
    try {
      if (initial) await api.put(`/goals/${initial._id}`, body); else await api.post('/goals', body);
      toast.success('Goal saved');
      window.dispatchEvent(new Event('notifications:changed'));
      onSaved();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={initial ? 'Edit goal' : 'New savings goal'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="What are you saving for?"><input className="input" required maxLength={100} autoFocus value={form.title} onChange={set('title')} /></Field>
        <div className="grid-2">
          <Field label="Target amount"><input className="input" type="number" min="1" step="0.01" required value={form.targetAmount} onChange={set('targetAmount')} /></Field>
          <Field label="Saved so far"><input className="input" type="number" min="0" step="0.01" value={form.currentAmount} onChange={set('currentAmount')} /></Field>
        </div>
        <Field label="Deadline (optional)"><input className="input" type="date" value={form.deadline} onChange={set('deadline')} /></Field>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>Save goal</button>
        </div>
      </form>
    </Modal>
  );
}

function Contribute({ goal, onClose, onSaved }) {
  const { money } = useAuth();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/goals/${goal._id}/contribute`, { amount: Number(amount) });
      toast.success('Savings added');
      window.dispatchEvent(new Event('notifications:changed'));
      onSaved();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Add to "${goal.title}"`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p className="muted">{money(goal.targetAmount - goal.currentAmount)} left to reach your target.</p>
        <Field label="Amount"><input className="input" type="number" min="0.01" step="0.01" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>Add savings</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Goals() {
  const { money } = useAuth();
  const { data, loading, error, reload } = useFetch('/goals');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const done = () => { setEditing(null); setAdding(null); reload(); };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/goals/${deleting._id}`); toast.success('Goal deleted'); setDeleting(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 16 }}>
        <p className="muted">Save towards the things that matter.</p>
        <button className="btn" onClick={() => setEditing('new')}><Plus size={16} />New goal</button>
      </div>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Spinner /> : data.data.length === 0 ? (
        <div className="card"><Empty title="No savings goals yet" action={<button className="btn" onClick={() => setEditing('new')}>Create your first goal</button>}>Set a target and track your progress.</Empty></div>
      ) : (
        <div className="cards-grid">
          {data.data.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div className="card" key={g._id}>
                <div className="row between">
                  <div className="row"><PiggyBank size={20} className="income" /><strong>{g.title}</strong></div>
                  <div>
                    <button className="btn ghost sm" onClick={() => setEditing(g)} aria-label={`Edit ${g.title}`}><Pencil size={15} /></button>
                    <button className="btn ghost sm" onClick={() => setDeleting(g)} aria-label={`Delete ${g.title}`}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, margin: '10px 0 2px' }}>{money(g.currentAmount)}</div>
                <p className="muted" style={{ marginBottom: 10 }}>of {money(g.targetAmount)}{g.deadline && ` - by ${fmtDate(g.deadline)}`}</p>
                <Progress value={g.currentAmount} max={g.targetAmount} tone={g.completed ? 'ok' : undefined} />
                <div className="row between" style={{ marginTop: 12 }}>
                  <span className={`pill ${g.completed ? 'success' : ''}`}>{g.completed ? 'Completed' : `${pct}% saved`}</span>
                  {!g.completed && <button className="btn secondary sm" onClick={() => setAdding(g)}>Add savings</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <GoalForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={done} />}
      {adding && <Contribute goal={adding} onClose={() => setAdding(null)} onSaved={done} />}
      {deleting && <Confirm title="Delete goal?" message={`"${deleting.title}" and its progress will be removed.`} busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
