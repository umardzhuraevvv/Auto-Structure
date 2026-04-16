import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, ChevronDown, ChevronRight } from 'lucide-react';

const DEPT_COLORS: Record<string, string> = {
  'Руководство': '#8b5cf6',
  'Коммерческий отдел': '#3b82f6',
  'Модерация и Суппорт': '#10b981',
  'Финансовый Отдел': '#f59e0b',
};

const EXTRA_COLORS = ['#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7'];
const deptColorCache: Record<string, string> = {};

function getDeptColor(dept: string): string {
  if (DEPT_COLORS[dept]) return DEPT_COLORS[dept];
  if (!deptColorCache[dept]) {
    const usedCount = Object.keys(deptColorCache).length;
    deptColorCache[dept] = EXTRA_COLORS[usedCount % EXTRA_COLORS.length];
  }
  return deptColorCache[dept];
}

interface Props {
  data: {
    fullName: string;
    position: string;
    department: string;
    hasChildren: boolean;
    collapsed: boolean;
    onToggle: () => void;
    onClick: () => void;
    highlighted: boolean;
  };
}

export const EmployeeCard = memo(({ data }: Props) => {
  const color = getDeptColor(data.department);

  return (
    <div
      className={`
        bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer
        hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5
        w-[180px] md:w-[280px]
        ${data.highlighted
          ? 'ring-4 ring-yellow-400 border-yellow-400 shadow-lg shadow-yellow-100'
          : 'border-gray-200 shadow-md'
        }
      `}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-3 !h-3 !border-2 !border-gray-300 !-top-1.5" />

      <div className="rounded-t-[10px] h-1.5 md:h-2" style={{ background: color }} />

      <div className="p-2.5 md:p-3.5">
        <div className="flex items-start gap-2 md:gap-2.5">
          <div
            className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: color + '18', color }}
          >
            <User size={14} className="md:hidden" />
            <User size={18} className="hidden md:block" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[11px] md:text-[13px] text-gray-900 leading-snug break-words line-clamp-2">
              {data.fullName}
            </p>
            <p className="text-[9px] md:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
              {data.position}
            </p>
          </div>
          {data.hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onToggle();
              }}
              className="w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center hover:bg-gray-100 flex-shrink-0 mt-0.5 transition-colors"
              style={{ color }}
            >
              {data.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div
          className="mt-2 md:mt-2.5 text-[8px] md:text-[10px] font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-md inline-block tracking-wide"
          style={{
            background: color + '15',
            color: color,
            border: `1px solid ${color}30`,
          }}
        >
          {data.department}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-3 !h-3 !border-2 !border-gray-300 !-bottom-1.5" />
    </div>
  );
});
