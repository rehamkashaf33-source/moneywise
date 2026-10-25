import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CURRENCIES } from '../utils/format';
import { Avatar, Field } from '../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef();
  const [form, setForm] = useState({ name: user.name, currency: user.currency });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault(); setBusy('profile');
    try { const { data } = await api.put('/users/profile', form); setUser(data.user); toast.success('Profile updated'); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append('avatar', file);
    setBusy('avatar');
    try { const { data } = await api.put('/users/avatar', body); setUser(data.user); toast.success('Photo updated'); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); e.target.value = ''; }
  };

  const changePassword = async (e) => {
    e.preventDefault(); setBusy('password');
    try { await api.put('/users/change-password', pw); setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div className="card">
        <h2>Your profile</h2>
        <div className="row" style={{ marginBottom: 18 }}>
          <Avatar user={user} />
          <div className="grow">
            <strong>{user.email}</strong>
            <div>{user.isVerified ? <span className="pill success">Email verified</span> : <span className="pill warning">Email not verified</span>}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadAvatar} />
          <button className="btn secondary" disabled={busy === 'avatar'} onClick={() => fileRef.current.click()}>Change photo</button>
        </div>
        <form className="stack" onSubmit={saveProfile}>
          <div className="grid-2">
            <Field label="Full name"><input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Currency"><select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <div><button className="btn" disabled={busy === 'profile'}>Save changes</button></div>
        </form>
      </div>

      <div className="card">
        <h2>Appearance</h2>
        <div className="segmented" style={{ maxWidth: 260 }}>
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>Light</button>
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>Dark</button>
        </div>
      </div>

      <div className="card">
        <h2>Change password</h2>
        <form className="stack" onSubmit={changePassword}>
          <Field label="Current password"><input className="input" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <div><button className="btn" disabled={busy === 'password'}>Update password</button></div>
        </form>
      </div>
    </div>
  );
}
