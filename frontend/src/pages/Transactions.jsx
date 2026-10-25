import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, colorFor, fmtDate, toInputDate } from '../utils/format';
import { Confirm, Empty, ErrorBox, Field, Modal, Pager, Spinner } from '../components/ui';

const blank = () => ({ type: 'expense', title: '', amount: '', category: EXPENSE_CATEGORIES[0], paymentMethod: 'cash', date: toInputDate(), note: '' });

function TransactionForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...initial, date: toInputDate(initial.date) } : blank());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const setType = (type) => setForm((f) => ({ ...f, type, category: (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { title: form.title, amount: Number(form.amount), type: form.type, category: form.category, paymentMethod: form.paymentMethod, date: form.date, note: form.note };
    try {
      if (initial) await api.put(`/transactions/${initial._id}`, body); else await api.post('/transactions', body);
      toast.success(initial ? 'Transaction updated' : 'Transaction added');
      window.dispatchEvent(new Event('notifications:changed'));
      onSaved();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={initial ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={`${form.type === 'expense' ? 'on expense' : ''}`} onClick={() => setType('expense')}>Expense</button>
          <button type="button" className={`${form.type === 'income' ? 'on income' : ''}`} onClick={() => setType('income')}>Income</button>
        </div>
        <Field label="Title"><input className="input" required maxLength={100} value={form.title} onChange={set('title')} autoFocus /></Field>
        <div className="grid-2">
          <Field label="Amount"><input className="input" type="number" required min="0.01" step="0.01" value={form.amount} onChange={set('amount')} /></Field>
          <Field label="Date"><input className="input" type="date" required value={form.date} onChange={set('date')} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Category"><select className="input" value={form.category} onChange={set('category')}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Payment method"><select className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}</select></Field>
        </div>
        <Field label="Note (optional)"><textarea className="input" rows={2} maxLength={300} value={form.note} onChange={set('note')} /></Field>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save transaction'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Transactions() {
  const { money } = useAuth();
  const [filters, setFilters] = useState({ search: '', type: '', category: '', from: '', to: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | transaction
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => { setFilters((f) => ({ ...f, search })); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const params = { page, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const { data, loading, error, reload } = useFetch('/transactions', params);
  const setFilter = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/transactions/${deleting._id}`); toast.success('Transaction deleted'); setDeleting(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 16 }}>
        <p className="muted">Everything you've earned and spent.</p>
        <button className="btn" onClick={() => setEditing('new')}><Plus size={16} />Add transaction</button>
      </div>

      <div className="card">
        <div className="filters">
          <input className="input" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          <select className="input" value={filters.type} onChange={setFilter('type')} aria-label="Type">
            <option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <select className="input" value={filters.category} onChange={setFilter('category')} aria-label="Category">
            <option value="">All categories</option>
            {[...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" type="date" value={filters.from} onChange={setFilter('from')} aria-label="From date" />
          <input className="input" type="date" value={filters.to} onChange={setFilter('to')} aria-label="To date" />
        </div>

        {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Spinner /> : data.data.length === 0 ? (
          <Empty title="No transactions found" action={<button className="btn" onClick={() => setEditing('new')}>Add transaction</button>}>
            Try changing your filters, or add a new transaction.
          </Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Method</th><th className="num">Amount</th><th /></tr></thead>
                <tbody>
                  {data.data.map((t) => (
                    <tr key={t._id}>
                      <td>{fmtDate(t.date)}</td>
                      <td><strong>{t.title}</strong>{t.note && <div className="muted" style={{ fontSize: 12 }}>{t.note}</div>}</td>
                      <td><span className="pill" style={{ background: `${colorFor(t.category)}26`, color: 'var(--text)' }}>{t.category}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>{t.paymentMethod}</td>
                      <td className={`num ${t.type}`}><strong>{t.type === 'income' ? '+' : '-'}{money(t.amount)}</strong></td>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn ghost sm" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`}><Pencil size={16} /></button>
                        <button className="btn ghost sm" onClick={() => setDeleting(t)} aria-label={`Delete ${t.title}`}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager pagination={data.pagination} onPage={setPage} />
          </>
        )}
      </div>

      {editing && <TransactionForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <Confirm title="Delete transaction?" message={`"${deleting.title}" will be permanently removed.`} busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
