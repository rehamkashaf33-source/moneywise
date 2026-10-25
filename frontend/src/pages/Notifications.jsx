import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import useFetch from '../hooks/useFetch';
import { Empty, ErrorBox, Spinner } from '../components/ui';

const icons = { warning: <AlertTriangle size={20} color="var(--warning)" />, success: <CheckCircle2 size={20} color="var(--success)" />, info: <Info size={20} color="var(--primary)" /> };

export default function Notifications() {
  const { data, loading, error, reload } = useFetch('/notifications');

  const act = async (fn) => {
    try { await fn(); window.dispatchEvent(new Event('notifications:changed')); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;

  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{data.unread ? `${data.unread} unread` : 'All caught up'}</h2>
        {data.unread > 0 && <button className="btn secondary sm" onClick={() => act(() => api.put('/notifications/read-all'))}>Mark all as read</button>}
      </div>
      {data.data.length === 0 ? (
        <Empty title="No notifications">Budget alerts and goal updates will show up here.</Empty>
      ) : data.data.map((n) => (
        <div key={n._id} className={`list-item ${n.read ? '' : 'unread'}`}>
          {icons[n.type]}
          <div className="grow">
            <strong>{n.title}</strong>
            <div className="muted">{n.message}</div>
            <div className="muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
          </div>
          {!n.read && <button className="btn ghost sm" onClick={() => act(() => api.put(`/notifications/${n._id}/read`))}>Mark as read</button>}
        </div>
      ))}
    </div>
  );
}
