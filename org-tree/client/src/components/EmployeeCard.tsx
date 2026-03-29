import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, ChevronDown, ChevronRight } from 'lucide-react';

const DEPT_COLORS: Record<string, string> = {
  'Руководство': '#8b5cf6',
  'Коммерческий отдел': '#3b82f6',
  'Модерация и Суппорт': '#10b981',
  'Финансовый Отдел': '#f59e0b',
};

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
  const color = DEPT_COLORS[data.department] || '#6b7280';

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md border-2 transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:scale-[1.02]
        min-w-[140px] md:min-w-[200px] max-w-[180px] md:max-w-[240px]
        ${data.highlighted ? 'ring-4 ring-yellow-400 border-yellow-400' : 'border-gray-100'}
      `}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-300 !w-2 !h-2 !border-0" />

      <div className="rounded-t-xl h-1 md:h-1.5" style={{ background: color }} />

      <div className="p-2 md:p-3">
        <div className="flex items-start gap-1.5 md:gap-2">
          <div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: color + '20', color }}
          >
            <User size={14} className="md:hidden" />
            <User size={16} className="hidden md:block" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs md:text-sm text-gray-900 leading-tight truncate">
              {data.fullName}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">
              {data.position}
            </p>
          </div>
          {data.hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onToggle();
              }}
              className="p-0.5 rounded hover:bg-gray-100 flex-shrink-0 mt-0.5"
            >
              {data.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
        <div
          className="mt-1.5 md:mt-2 text-[9px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full inline-block text-white"
          style={{ background: color }}
        >
          {data.department}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-300 !w-2 !h-2 !border-0" />
    </div>
  );
});
