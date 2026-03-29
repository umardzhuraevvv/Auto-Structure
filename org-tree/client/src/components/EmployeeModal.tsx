import { useState, useEffect } from 'react';
import { X, Edit3, Save, ArrowRightLeft, Trash2, UserCircle } from 'lucide-react';
import type { Employee, User } from '../types';
import { api } from '../services/api';

interface Props {
  employee: Employee;
  allEmployees: Employee[];
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
  onNavigate: (id: number) => void;
}

export function EmployeeModal({ employee, allEmployees, user, onClose, onUpdate, onNavigate }: Props) {
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [duties, setDuties] = useState(employee.duties || '');
  const [position, setPosition] = useState(employee.position);
  const [newManagerId, setNewManagerId] = useState<number | null>(employee.managerId);
  const [error, setError] = useState('');

  const canEdit = user && (user.role === 'ADMIN' || user.role === 'EDITOR');
  const canDelete = user && user.role === 'ADMIN';

  useEffect(() => {
    setDuties(employee.duties || '');
    setPosition(employee.position);
    setNewManagerId(employee.managerId);
    setEditing(false);
    setMoving(false);
  }, [employee]);

  const handleSave = async () => {
    try {
      await api.updateEmployee(employee.id, { ...employee, duties, position });
      setEditing(false);
      onUpdate();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleMove = async () => {
    try {
      await api.moveEmployee(employee.id, newManagerId);
      setMoving(false);
      onUpdate();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить ${employee.fullName}? Подчинённые будут переданы его руководителю.`)) return;
    try {
      await api.deleteEmployee(employee.id);
      onClose();
      onUpdate();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const dutiesList = (employee.duties || '').split('\n').filter((d) => d.trim());
  const subordinates = allEmployees.filter((e) => e.managerId === employee.id);
  const manager = allEmployees.find((e) => e.id === employee.managerId);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-w-full md:max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-5 border-b">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserCircle size={24} className="text-blue-600 md:hidden" />
              <UserCircle size={28} className="text-blue-600 hidden md:block" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">{employee.fullName}</h2>
              {editing ? (
                <input
                  className="text-sm text-gray-500 border rounded px-2 py-0.5 w-full mt-0.5"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              ) : (
                <p className="text-xs md:text-sm text-gray-500 truncate">{employee.position}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-3 md:mx-5 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-3 md:p-5 space-y-3 md:space-y-4">
          {/* Department */}
          <div>
            <span className="text-xs font-semibold uppercase text-gray-400">Блок</span>
            <p className="text-sm text-gray-700">{employee.department}</p>
          </div>

          {/* Manager */}
          {manager && (
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400">Руководитель</span>
              <button
                onClick={() => onNavigate(manager.id)}
                className="block text-sm text-blue-600 hover:underline"
              >
                {manager.fullName} — {manager.position}
              </button>
            </div>
          )}

          {/* Moving */}
          {moving && (
            <div className="p-2.5 md:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium mb-2">Выберите нового руководителя:</p>
              <select
                className="w-full border rounded-lg p-2 text-sm"
                value={newManagerId || ''}
                onChange={(e) => setNewManagerId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Без руководителя (корень) —</option>
                {allEmployees
                  .filter((e) => e.id !== employee.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} — {e.position}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleMove}
                  className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
                >
                  Переместить
                </button>
                <button
                  onClick={() => setMoving(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Duties */}
          <div>
            <span className="text-xs font-semibold uppercase text-gray-400">Обязанности</span>
            {editing ? (
              <textarea
                className="w-full border rounded-lg p-2 text-sm mt-1 min-h-[100px] md:min-h-[120px]"
                value={duties}
                onChange={(e) => setDuties(e.target.value)}
                placeholder="Каждая обязанность с новой строки (начните с –)"
              />
            ) : dutiesList.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {dutiesList.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700 pl-2 border-l-2 border-blue-200">
                    {d.replace(/^[–-]\s*/, '')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 mt-1 italic">Не указаны</p>
            )}
          </div>

          {/* Subordinates */}
          {subordinates.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400">
                Подчинённые ({subordinates.length})
              </span>
              <ul className="mt-1 space-y-1">
                {subordinates.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => onNavigate(s.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {s.fullName} — {s.position}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="px-3 md:px-5 pb-3 md:pb-5 flex flex-col md:flex-row flex-wrap gap-2">
            {editing ? (
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <Save size={14} /> Сохранить
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Edit3 size={14} /> Редактировать
              </button>
            )}
            {!moving && (
              <button
                onClick={() => setMoving(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
              >
                <ArrowRightLeft size={14} /> Переместить
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                <Trash2 size={14} /> Удалить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
