'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Profile, WorkHourInterval } from '@/lib/types';
import { getUserProfile, updateUserProfile } from '@/app/actions/profiles';
import { createClient } from '@/lib/supabase/client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function SettingsModal({ isOpen, onClose, userEmail }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'hours'>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workHours, setWorkHours] = useState<WorkHourInterval[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  async function loadProfile() {
    const data = await getUserProfile();
    if (data) {
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url || '');
      setWorkHours(data.work_hours || []);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateUserProfile({ name, phone, avatar_url: avatarUrl });
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  async function handleSaveHours() {
    setError(null);
    startTransition(async () => {
      const res = await updateUserProfile({ work_hours: workHours });
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  function addWorkHour() {
    setWorkHours([...workHours, { start: '08:00', end: '12:00' }]);
  }

  function updateWorkHour(index: number, field: 'start' | 'end', value: string) {
    const newHours = [...workHours];
    newHours[index][field] = value;
    setWorkHours(newHours);
  }

  function removeWorkHour(index: number) {
    setWorkHours(workHours.filter((_, i) => i !== index));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (err: any) {
      setError('Erro ao enviar imagem. Verifique se o bucket "avatars" existe.');
    } finally {
      setIsUploading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Configurações</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="settings-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          <button 
            className={`btn-ghost ${activeTab === 'profile' ? 'active' : ''}`} 
            style={{ fontWeight: activeTab === 'profile' ? '600' : 'normal', color: activeTab === 'profile' ? 'var(--text)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('profile')}
          >
            Perfil
          </button>
          <button 
            className={`btn-ghost ${activeTab === 'hours' ? 'active' : ''}`}
            style={{ fontWeight: activeTab === 'hours' ? '600' : 'normal', color: activeTab === 'hours' ? 'var(--text)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('hours')}
          >
            Horário de Trabalho
          </button>
        </div>

        {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>{userEmail.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                  {isUploading ? 'Enviando...' : 'Alterar Foto'}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={isUploading} />
                </label>
              </div>
            </div>

            <div className="form-field">
              <label>Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>

            <div className="form-field">
              <label>Celular (Opcional)</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>

            <div className="form-field">
              <label>E-mail</label>
              <input type="email" value={userEmail} disabled style={{ opacity: 0.7 }} />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-outline">Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>Salvar Perfil</button>
            </div>
          </form>
        )}

        {activeTab === 'hours' && (
          <div className="form-group">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Configure seus intervalos de trabalho diários. O sistema usará esses horários para descontar horas não-úteis quando você esquecer o timer ligado.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {workHours.map((wh, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="time" 
                    value={wh.start} 
                    onChange={(e) => updateWorkHour(index, 'start', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span>até</span>
                  <input 
                    type="time" 
                    value={wh.end} 
                    onChange={(e) => updateWorkHour(index, 'end', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button onClick={() => removeWorkHour(index)} className="btn-icon-sm" style={{ color: 'var(--danger)' }} title="Remover">
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addWorkHour} className="btn btn-outline" style={{ marginBottom: '2rem', width: '100%' }}>
              + Adicionar Horário
            </button>

            <div className="modal-actions">
              <button onClick={onClose} className="btn btn-outline">Cancelar</button>
              <button onClick={handleSaveHours} className="btn btn-primary" disabled={isPending}>Salvar Horários</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
