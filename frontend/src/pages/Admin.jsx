import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { fmtDate } from '../utils/format';
import { Confirm, ErrorBox, Pager, Spinner, StatCard } from '../components/ui';

export default function Admin() {
  const { user: me, money } = useAuth();
  const stats = useFetch('/admin/stats');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const users = useFetch('/admin/users', { page, limit: 10, search: q });
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { const id = setTimeout(() => { setQ(search); setPage(1); }, 350); return () => clearTimeout(id); }, [search]);

  const setRole = async (u, role) => {
    try { await api.put(`/admin/users/${u._id}/role`, { role }); toast.success('Role updated'); users.reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async () => {
    try { await api.delete(`/admin/users/${deleting._id}`); toast.success('User deleted'); setDeleting(null); users.reload(); stats.reload(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  if (stats.error) return <ErrorBox message={stats.error} onRetry={stats.reload} />;

  return (
    <>
      {stats.data ? (
        <section className="stats">
          <StatCard label="Users" value={stats.data.users} hint={`${stats.data.newUsers} new this month`} />
          <StatCard label="Active users" value={stats.data.activeUsers} hint="Last 30 days" />
          <StatCard label="Transactions" value={stats.data.transactions} />
          <StatCard label="Volume" value={money(stats.data.totalIncome + stats.data.totalExpense)} hint="Income + expenses" />
        </section>
      ) : <Spinner />}

      <div className="card">
        <div className="row between wrap" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Users</h2>
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        </div>
        {users.error ? <ErrorBox message={users.error} onRetry={users.reload} /> : !users.data ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th><th /></tr></thead>
                <tbody>
                  {users.data.data.map((u) => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{fmtDate(u.createdAt)}</td>
                      <td>
                        <select className="input" style={{ width: 110, padding: '6px 8px' }} value={u.role} disabled={u._id === me._id} onChange={(e) => setRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                          <option value="user">User</option><option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="num">{u._id !== me._id && <button className="btn ghost sm" onClick={() => setDeleting(u)} aria-label={`Delete ${u.name}`}><Trash2 size={16} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager pagination={users.data.pagination} onPage={setPage} />
          </>
        )}
      </div>
      {deleting && <Confirm title="Delete user?" message={`${deleting.name} and all of their data will be permanently removed.`} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
