import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import { login, checkSession } from '../lib/api';

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usr.trim() || !pwd) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(usr.trim(), pwd);
      const ok = await checkSession();
      if (!ok) throw new Error('Đăng nhập không thành công.');
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-sm card rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2 justify-center mb-2 text-[var(--color-brand-primary)]">
          <Wrench size={28} />
          <span className="font-bold text-xl">Cầu Giấy Auto</span>
        </div>
        <p className="text-center text-sm text-[var(--color-text-secondary)] mb-6">
          Đăng nhập để quản lý Work Order & CSKH
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="usr" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Email
            </label>
            <input
              id="usr"
              type="text"
              autoComplete="username"
              value={usr}
              onChange={(e) => setUsr(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
          </div>
          <div>
            <label htmlFor="pwd" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Mật khẩu
            </label>
            <input
              id="pwd"
              type="password"
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center font-medium rounded-md px-4 py-2 text-sm bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
