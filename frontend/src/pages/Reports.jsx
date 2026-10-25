import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { download, errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { colorFor, parseMonth, toInputMonth } from '../utils/format';
import { Empty, ErrorBox, Spinner, StatCard } from '../components/ui';

export default function Reports() {
  const { money } = useAuth();
  const [month, setMonth] = useState(toInputMonth());
  const period = parseMonth(month);
  const { data, loading, error, reload } = useFetch('/reports/monthly', period);
  const [busy, setBusy] = useState('');

  const exportAs = async (kind) => {
    setBusy(kind);
    try { await download(`/reports/${kind}`, period, `report.${kind === 'pdf' ? 'pdf' : 'xlsx'}`); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 16 }}>
        <input className="input" style={{ width: 170 }} type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        <div className="row">
          <button className="btn secondary" disabled={!!busy} onClick={() => exportAs('excel')}><FileSpreadsheet size={16} />{busy === 'excel' ? 'Preparing...' : 'Download Excel'}</button>
          <button className="btn" disabled={!!busy} onClick={() => exportAs('pdf')}><FileText size={16} />{busy === 'pdf' ? 'Preparing...' : 'Download PDF'}</button>
        </div>
      </div>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Spinner /> : (
        <>
          <section className="stats">
            <StatCard label="Income" value={money(data.income)} tone="income" />
            <StatCard label="Expenses" value={money(data.expense)} tone="expense" />
            <StatCard label="Balance" value={money(data.balance)} />
            <StatCard label="Savings rate" value={`${data.savingRate}%`} />
          </section>
          <div className="card">
            <h2>Top spending categories</h2>
            {data.categories.length === 0 ? <Empty title="No expenses in this month" /> : (
              <div className="stack">
                {data.categories.map((c) => (
                  <div key={c.category}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <strong>{c.category}</strong><span>{money(c.total)} <span className="muted">({c.percent}%)</span></span>
                    </div>
                    <div className="progress"><span style={{ width: `${c.percent}%`, background: colorFor(c.category) }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
