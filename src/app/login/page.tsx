'use client';

import { useState } from 'react';
import { signIn } from '@/app/actions/auth';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Project Hours</h1>
          <p>Controle seu tempo com precisão</p>
        </div>

        <form action={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <label htmlFor="login-email" className="input-label">
              E-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="input"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password" className="input-label">
              Senha
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Não tem conta?{' '}
          <a href="/signup">Criar conta</a>
        </div>
      </div>
    </div>
  );
}
