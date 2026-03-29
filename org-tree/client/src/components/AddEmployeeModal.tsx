import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import type { Employee } from '../types';

interface Props {
  allEmployees: Employee[];
  onClose: () => void;
  onCreated: () => void;
}

export function AddEmployeeModal({ allEmployees, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    position: '',
    department: 'Коммерческий отдел',
    duties: '',
    managerId: '' as string,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createEmployee({
        ...form,
        managerId: form.managerId ? Number(form.managerId) : null,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-w-full md:max-w-md w-full p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <UserPlus size={20} /> Добавить сотрудника
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="ФИО"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full border rounded-lg px-3 py-2.5 md:py-2 text-sm"
            required
          />
          <input
            placeholder="Должность"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full border rounded-lg px-3 py-2.5 md:py-2 text-sm"
            required
          />
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full border rounded-lg px-3 py-2.5 md:py-2 text-sm"
          >
            <option>Руководство</option>
            <option>Коммерческий отдел</option>
            <option>Модерация и Суппорт</option>
            <option>Финансовый Отдел</option>
          </select>
          <select
            value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2.5 md:py-2 text-sm"
          >
            <option value="">— Без руководителя —</option>
            {allEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} — {e.position}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Обязанности (каждая с новой строки)"
            value={form.duties}
            onChange={(e) => setForm({ ...form, duties: e.target.value })}
            className="w-full border rounded-lg px-3 py-2.5 md:py-2 text-sm min-h-[80px]"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-3 md:py-2.5 font-medium text-sm hover:bg-blue-700"
          >
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
