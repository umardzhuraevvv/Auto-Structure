import { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, Users, X } from 'lucide-react';
import type { Employee } from '../types';

interface Props {
  employees: Employee[];
  onSelect: (id: number) => void;
  onFilter: (dept: string) => void;
  activeFilter: string;
  onClose?: () => void;
}

export function Sidebar({ employees, onSelect, onFilter, activeFilter, onClose }: Props) {
  const departments = useMemo(() => {
    const depts = [...new Set(employees.map((e) => e.department))].sort();
    return [{ label: 'Все', value: '' }, ...depts.map((d) => ({ label: d, value: d }))];
  }, [employees]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(true);

  const filtered = employees.filter((e) => {
    const matchSearch = e.fullName.toLowerCase().includes(search.toLowerCase());
    const matchDept = !activeFilter || e.department === activeFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Search */}
      <div className="p-2 md:p-3 border-b">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск сотрудника..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 md:hidden">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 md:p-3 border-b">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500 mb-2"
        >
          <Filter size={12} />
          Фильтр по блоку
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {open && (
          <div className="flex flex-wrap gap-1 md:gap-1.5">
            {departments.map((d) => (
              <button
                key={d.value}
                onClick={() => onFilter(d.value)}
                className={`px-2 md:px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  activeFilter === d.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Employee List */}
      <div className="flex-1 overflow-y-auto p-1.5 md:p-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 font-medium">
          <Users size={12} />
          {filtered.length} сотрудников
        </div>
        {filtered.map((emp) => (
          <button
            key={emp.id}
            onClick={() => onSelect(emp.id)}
            className="w-full text-left px-2.5 md:px-3 py-2 rounded-lg hover:bg-blue-50 transition group"
          >
            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 truncate">
              {emp.fullName}
            </p>
            <p className="text-xs text-gray-500 truncate">{emp.position}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
