import { useEffect } from 'react';
import { assetUrl } from '../api/client';
import { initials } from '../utils/format';

export function Spinner() { return <div className="spinner" role="status" aria-label="Loading" />; }

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="empty">
      <h3>We couldn't load this</h3>
      <p className="error-text">{message}</p>
      {onRetry && <button className="btn secondary" style={{ marginTop: 12 }} onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Avatar({ user, small }) {
  return (
    <div className={`avatar ${small ? 'sm' : ''}`}>
      {user?.avatar ? <img src={assetUrl(user.avatar)} alt="" /> : initials(user?.name) || '?'}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ title, message, confirmLabel = 'Delete', busy, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted" style={{ marginBottom: 20 }}>{message}</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn danger" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function Progress({ value, max, tone }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const auto = tone || (value / max >= 1 ? 'over' : value / max >= 0.8 ? 'warn' : 'ok');
  return <div className={`progress ${auto}`}><span style={{ width: `${pct}%` }} /></div>;
}

export function Pager({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <div className="pager">
      <span>{total} records</span>
      <div className="row">
        <button className="btn secondary sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="btn secondary sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, tone }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className={`value ${tone || ''}`}>{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
