'use client';

import { useState } from 'react';
import { signUp } from '@/app/actions/auth';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Project Hours</h1>
          <p>Crie sua conta e comece a controlar seu tempo</p>
        </div>

        <form action={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div
              style={{
                background: 'var(--success-muted)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm) var(--space-md)',
                color: 'var(--success)',
                fontSize: 'var(--font-sm)',
              }}
            >
              {success}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="signup-email" className="input-label">
              E-mail
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              className="input"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="signup-password" className="input-label">
              Senha
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
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
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta?{' '}
          <a href="/login">Entrar</a>
        </div>
      </div>
    </div>
  );
}
