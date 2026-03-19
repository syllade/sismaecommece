import { useMemo, useState } from 'react';
import { LogOut, Save, User, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const statusLabel = useMemo(() => (user?.is_active ? 'Actif' : 'Inactif'), [user?.is_active]);

  if (!user) return null;

  const onSaveProfile = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    const result = await updateProfile({ name: profile.name, phone: profile.phone });
    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage('Profil mis a jour avec succes.');
      setEditing(false);
    }
    setSaving(false);
  };

  const onChangePassword = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setError('Tous les champs de mot de passe sont requis.');
      setSaving(false);
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setError('La confirmation du mot de passe ne correspond pas.');
      setSaving(false);
      return;
    }
    const result = await changePassword(passwordForm.current, passwordForm.next, passwordForm.confirm);
    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage('Mot de passe change avec succes.');
      setShowPassword(false);
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <User className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Profil Livreur</h1>
              <p className="text-sm text-gray-600">Espace personnel et securite du compte</p>
            </div>
          </div>

          {message && <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
          {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid gap-4">
            <Field label="Nom">
              {editing ? (
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{user.name}</p>
              )}
            </Field>

            <Field label="Email">
              <p className="text-gray-900">{user.email}</p>
            </Field>

            <Field label="Telephone">
              {editing ? (
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{user.phone || '-'}</p>
              )}
            </Field>

            <Field label="Zone">
              <p className="text-gray-900">{user.zone || '-'}</p>
            </Field>

            <Field label="Statut">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {statusLabel}
              </span>
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>
                <button
                  onClick={onSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white">Modifier le profil</button>
                <button onClick={() => setShowPassword((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
                  <KeyRound className="h-4 w-4" />
                  Changer mot de passe
                </button>
                <button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700">
                  <LogOut className="h-4 w-4" />
                  Deconnexion
                </button>
              </>
            )}
          </div>
        </div>

        {showPassword && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
            <div className="grid gap-3">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
              />
              <input
                type="password"
                placeholder="Confirmation nouveau mot de passe"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowPassword(false)} className="rounded-lg border px-4 py-2 text-sm">Fermer</button>
              <button onClick={onChangePassword} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white">
                {saving ? 'Mise a jour...' : 'Valider'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-500">{label}</p>
      {children}
    </div>
  );
}
