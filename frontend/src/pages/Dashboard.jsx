import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { colorFor, fmtDate, parseMonth, toInputMonth } from '../utils/format';
import { Empty, ErrorBox, Progress, Spinner, StatCard } from '../components/ui';

export default function Dashboard() {
  const { money } = useAuth();
  const [month, setMonth] = useState(toInputMonth());
  const { data, loading, error, reload } = useFetch('/dashboard', parseMonth(month));

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;

  const total = data.categories.reduce((s, c) => s + c.total, 0);
  const hasTrend = data.trend.some((t) => t.income || t.expense);

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 16 }}>
        <p className="muted">Take control of your finances</p>
        <input className="input" style={{ width: 170 }} type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
      </div>

      <section className="stats">
        <StatCard label="Total balance" value={money(data.balance)} hint="Across all time" />
        <StatCard label="Monthly income" value={money(data.income)} tone="income" hint="This month" />
        <StatCard label="Monthly expenses" value={money(data.expense)} tone="expense" hint="This month" />
        <StatCard label="Savings rate" value={`${data.savingRate}%`} hint="Of income" />
      </section>

      <section className="charts">
        <div className="card">
          <h2>Spending by category</h2>
          {data.categories.length === 0 ? (
            <Empty title="No expenses this month">Add an expense to see where your money goes.</Empty>
          ) : (
            <>
              <div className="chart-box">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data.categories} dataKey="total" nameKey="category" innerRadius="55%" outerRadius="90%" paddingAngle={1} stroke="none">
                      {data.categories.map((c) => <Cell key={c.category} fill={colorFor(c.category)} />)}
                    </Pie>
                    <Tooltip formatter={(v) => money(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend">
                {data.categories.map((c) => (
                  <span key={c.category}><i style={{ background: colorFor(c.category) }} />{c.category} {total ? Math.round((c.total / total) * 100) : 0}%</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2>Monthly overview</h2>
          {!hasTrend ? (
            <Empty title="Nothing to chart yet">Your last six months will appear here.</Empty>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={data.trend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted)" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted)" width={48} />
                  <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#e03131" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="two-col">
        <div className="card">
          <div className="row between"><h2>Recent transactions</h2><Link to="/transactions">View all</Link></div>
          {data.recent.length === 0 ? (
            <Empty title="No transactions yet" action={<Link className="btn" to="/transactions">Add your first transaction</Link>} />
          ) : data.recent.map((t) => (
            <div className="list-item" key={t._id}>
              <span className={`tx-icon ${t.type}`}>{t.type === 'income' ? <ArrowDownLeft size={18} className="income" /> : <ArrowUpRight size={18} className="expense" />}</span>
              <div className="grow"><strong>{t.title}</strong><div className="muted" style={{ fontSize: 12 }}>{t.category} - {fmtDate(t.date)}</div></div>
              <strong className={t.type}>{t.type === 'income' ? '+' : '-'}{money(t.amount)}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="row between"><h2>Budgets this month</h2><Link to="/budgets">Manage</Link></div>
          {data.budgets.length === 0 ? (
            <Empty title="No budgets set">Set a limit to get alerts before you overspend.</Empty>
          ) : (
            <div className="stack">
              {data.budgets.map((b) => (
                <div key={b.category}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <strong>{b.category}</strong>
                    <span className="muted">{money(b.spent)} / {money(b.limit)}</span>
                  </div>
                  <Progress value={b.spent} max={b.limit} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
