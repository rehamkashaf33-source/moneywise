import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { EXPENSE_CATEGORIES, colorFor, parseMonth, toInputMonth } from '../utils/format';
import { Confirm, Empty, ErrorBox, Field, Modal, Progress, Spinner } from '../components/ui';

function BudgetForm({ initial, period, taken, onClose, onSaved }) {
  const available = EXPENSE_CATEGORIES.filter((c) => !taken.includes(c));
  const [category, setCategory] = useState(initial?.category || available[0]);
  const [limit, setLimit] = useState(initial?.limit || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (initial) await api.put(`/budgets/${initial._id}`, { limit: Number(limit) });
      else await api.post('/budgets', { category, limit: Number(limit), ...period });
      toast.success('Budget saved');
      window.dispatchEvent(new Event('notifications:changed'));
      onSaved();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={initial ? `Edit ${initial.category} budget` : 'Add budget'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        {!initial && (
          <Field label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {available.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        )}
        <Field label="Monthly limit"><input className="input" type="number" min="1" step="0.01" required autoFocus value={limit} onChange={(e) => setLimit(e.target.value)} /></Field>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || (!initial && !available.length)}>Save budget</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Budgets() {
  const { money } = useAuth();
  const [month, setMonth] = useState(toInputMonth());
  const period = parseMonth(month);
  const { data, loading, error, reload } = useFetch('/budgets', period);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/budgets/${deleting._id}`); toast.success('Budget deleted'); setDeleting(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 16 }}>
        <p className="muted">Set monthly limits and get alerted at 80% and 100%.</p>
        <div className="row">
          <input className="input" style={{ width: 170 }} type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
          <button className="btn" onClick={() => setEditing('new')}><Plus size={16} />Add budget</button>
        </div>
      </div>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Spinner /> : data.data.length === 0 ? (
        <div className="card"><Empty title="No budgets for this month" action={<button className="btn" onClick={() => setEditing('new')}>Add a budget</button>}>Pick a category and a limit to start tracking.</Empty></div>
      ) : (
        <div className="cards-grid">
          {data.data.map((b) => {
            const pct = Math.round((b.spent / b.limit) * 100);
            const over = b.spent > b.limit;
            return (
              <div className="card" key={b._id}>
                <div className="row between">
                  <div className="row"><i style={{ width: 12, height: 12, borderRadius: 4, background: colorFor(b.category) }} /><strong>{b.category}</strong></div>
                  <div>
                    <button className="btn ghost sm" onClick={() => setEditing(b)} aria-label={`Edit ${b.category}`}><Pencil size={15} /></button>
                    <button className="btn ghost sm" onClick={() => setDeleting(b)} aria-label={`Delete ${b.category}`}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, margin: '10px 0 2px' }}>{money(b.spent)}</div>
                <p className="muted" style={{ marginBottom: 10 }}>of {money(b.limit)}</p>
                <Progress value={b.spent} max={b.limit} />
                <div className="row between" style={{ marginTop: 10 }}>
                  <span className={`pill ${over ? 'danger' : pct >= 80 ? 'warning' : 'success'}`}>{over ? 'Budget exceeded' : pct >= 80 ? 'Almost used' : 'On track'}</span>
                  <span className="muted">{over ? `${money(b.spent - b.limit)} over` : `${money(b.limit - b.spent)} left`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <BudgetForm initial={editing === 'new' ? null : editing} period={period} taken={data?.data.map((b) => b.category) || []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <Confirm title="Delete budget?" message={`The ${deleting.category} budget for this month will be removed. Your transactions are not affected.`} busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
