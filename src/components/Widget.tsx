import { useRef, useState, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface WidgetProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  onDragStart?: () => void;
  onDragEnter?: () => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  defaultCollapsed?: boolean;
}

export default function Widget({
  title,
  subtitle,
  badge,
  children,
  className = '',
  onDragStart,
  onDragEnter,
  onDragEnd,
  dragging = false,
  defaultCollapsed = false,
}: WidgetProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`card card-hover flex flex-col overflow-hidden p-0 transition-all duration-200 ${dragging ? 'opacity-50 ring-2 ring-accent-400' : ''} ${className}`}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
    >
      <div
        ref={dragHandleRef}
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        className="flex cursor-grab items-center gap-2 border-b border-ink-700/60 px-4 py-3 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-slate-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {badge && (
          <span className="rounded-md bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-300">
            {badge}
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-1 text-slate-500 transition-colors hover:text-slate-300"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {!collapsed && <div className="flex-1 p-4">{children}</div>}
    </div>
  );
}
