import { useState, useEffect } from 'react';
import { X, UserPlus, Shield, ShieldCheck, Eye, UserX, Clock } from 'lucide-react';
import { api } from '../services/api';
import type { AuditEntry } from '../types';

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface Props {
  onClose: () => void;
}

export function AdminPanel({ onClose }: Props) {
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'VIEWER' });
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setUsers(await api.getUsers());
    } catch {}
  };

  const loadAudit = async () => {
    try {
      const data = await api.getAudit();
      setAudit(data.logs);
    } catch {}
  };

  useEffect(() => {
    loadUsers();
    loadAudit();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createUser(form);
      setShowCreate(false);
      setForm({ email: '', password: '', name: '', role: 'VIEWER' });
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await api.changeRole(userId, role);
      loadUsers();
    } catch {}
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm('Деактивировать пользователя?')) return;
    try {
      await api.deactivateUser(userId);
      loadUsers();
    } catch {}
  };

  const roleIcon = (role: string) => {
    if (role === 'ADMIN') return <ShieldCheck size={14} className="text-red-500" />;
    if (role === 'EDITOR') return <Shield size={14} className="text-yellow-500" />;
    return <Eye size={14} className="text-gray-400" />;
  };

  const roleName = (role: string) => {
    if (role === 'ADMIN') return 'Админ';
    if (role === 'EDITOR') return 'Редактор';
    return 'Просмотр';
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-w-full md:max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-5 border-b">
          <h2 className="text-base md:text-lg font-bold">Админ-панель</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-3 md:px-5">
          <button
            onClick={() => setTab('users')}
            className={`px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Пользователи
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === 'audit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            История
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5">
          {tab === 'users' && (
            <div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 mb-4"
              >
                <UserPlus size={14} /> Добавить пользователя
              </button>

              {showCreate && (
                <form onSubmit={handleCreateUser} className="mb-4 p-3 md:p-4 bg-gray-50 rounded-xl space-y-3">
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Имя"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="border rounded-lg px-3 py-2.5 md:py-2 text-sm"
                      required
                    />
                    <input
                      placeholder="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="border rounded-lg px-3 py-2.5 md:py-2 text-sm"
                      required
                    />
                    <input
                      placeholder="Пароль"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="border rounded-lg px-3 py-2.5 md:py-2 text-sm"
                      required
                    />
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="border rounded-lg px-3 py-2.5 md:py-2 text-sm"
                    >
                      <option value="VIEWER">Просмотр</option>
                      <option value="EDITOR">Редактор</option>
                      <option value="ADMIN">Админ</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 md:py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Создать
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2.5 md:p-3 rounded-xl border ${
                      u.active ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      {roleIcon(u.role)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs border rounded-lg px-1.5 md:px-2 py-1"
                      >
                        <option value="VIEWER">Просмотр</option>
                        <option value="EDITOR">Редактор</option>
                        <option value="ADMIN">Админ</option>
                      </select>
                      {u.active && (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Деактивировать"
                        >
                          <UserX size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-2">
              {audit.length === 0 && <p className="text-sm text-gray-500">Пока нет записей</p>}
              {audit.map((log) => (
                <div key={log.id} className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-xl">
                  <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.action}</span> — {log.target}
                    </p>
                    {log.details && <p className="text-xs text-gray-500 break-words">{log.details}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleString('ru')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
