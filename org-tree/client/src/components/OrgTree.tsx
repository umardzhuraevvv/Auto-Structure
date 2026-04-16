import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EmployeeCard } from './EmployeeCard';
import type { Employee } from '../types';

const nodeTypes = { employee: EmployeeCard };

const DEPT_EDGE_COLORS: Record<string, string> = {
  'Руководство': '#8b5cf6',
  'Коммерческий отдел': '#3b82f6',
  'Модерация и Суппорт': '#10b981',
  'Финансовый Отдел': '#f59e0b',
};

const EXTRA_EDGE_COLORS = ['#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7'];
const edgeColorCache: Record<string, string> = {};

function getEdgeColor(dept: string): string {
  if (DEPT_EDGE_COLORS[dept]) return DEPT_EDGE_COLORS[dept];
  if (!edgeColorCache[dept]) {
    const usedCount = Object.keys(edgeColorCache).length;
    edgeColorCache[dept] = EXTRA_EDGE_COLORS[usedCount % EXTRA_EDGE_COLORS.length];
  }
  return edgeColorCache[dept];
}

interface Props {
  employees: Employee[];
  highlightedId: number | null;
  onNodeClick: (employee: Employee) => void;
  deptFilter: string;
}

function layoutTree(
  employees: Employee[],
  collapsed: Set<number>,
  highlightedId: number | null,
  onToggle: (id: number) => void,
  onNodeClick: (emp: Employee) => void,
  deptFilter: string,
  isMobile: boolean
) {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const roots = employees.filter((e) => !e.managerId);

  const visibleIds = new Set<number>();

  function collectVisible(empId: number) {
    const emp = empMap.get(empId);
    if (!emp) return;
    if (deptFilter && emp.department !== deptFilter && !hasDescendantInDept(empId)) return;
    visibleIds.add(empId);
    if (!collapsed.has(empId)) {
      const children = employees.filter((e) => e.managerId === empId);
      children.forEach((c) => collectVisible(c.id));
    }
  }

  function hasDescendantInDept(empId: number): boolean {
    const children = employees.filter((e) => e.managerId === empId);
    return children.some(
      (c) => c.department === deptFilter || hasDescendantInDept(c.id)
    );
  }

  roots.forEach((r) => collectVisible(r.id));

  const NODE_W = isMobile ? 180 : 280;
  const NODE_H = isMobile ? 100 : 130;
  const H_GAP = isMobile ? 16 : 30;
  const V_GAP = isMobile ? 50 : 80;

  const subtreeWidths = new Map<number, number>();

  function calcWidth(empId: number): number {
    if (!visibleIds.has(empId)) return 0;
    if (collapsed.has(empId)) {
      subtreeWidths.set(empId, NODE_W);
      return NODE_W;
    }
    const children = employees
      .filter((e) => e.managerId === empId)
      .filter((e) => visibleIds.has(e.id));
    if (children.length === 0) {
      subtreeWidths.set(empId, NODE_W);
      return NODE_W;
    }
    const totalW = children.reduce((sum, c) => sum + calcWidth(c.id), 0) + (children.length - 1) * H_GAP;
    const w = Math.max(NODE_W, totalW);
    subtreeWidths.set(empId, w);
    return w;
  }

  roots.filter((r) => visibleIds.has(r.id)).forEach((r) => calcWidth(r.id));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function place(empId: number, x: number, y: number) {
    const emp = empMap.get(empId);
    if (!emp || !visibleIds.has(empId)) return;

    const hasChildren = employees.some((e) => e.managerId === empId && visibleIds.has(e.id));

    nodes.push({
      id: String(empId),
      type: 'employee',
      position: { x, y },
      data: {
        fullName: emp.fullName,
        position: emp.position,
        department: emp.department,
        hasChildren,
        collapsed: collapsed.has(empId),
        onToggle: () => onToggle(empId),
        onClick: () => onNodeClick(emp),
        highlighted: highlightedId === empId,
      },
    });

    if (emp.managerId && visibleIds.has(emp.managerId)) {
      const edgeColor = getEdgeColor(emp.department);
      edges.push({
        id: `e-${emp.managerId}-${empId}`,
        source: String(emp.managerId),
        target: String(empId),
        type: 'smoothstep',
        style: { stroke: edgeColor, strokeWidth: 3, opacity: 0.7 },
      });
    }

    if (collapsed.has(empId)) return;

    const children = employees
      .filter((e) => e.managerId === empId)
      .filter((e) => visibleIds.has(e.id));
    if (children.length === 0) return;

    const totalW = children.reduce((sum, c) => sum + (subtreeWidths.get(c.id) || NODE_W), 0) + (children.length - 1) * H_GAP;
    let cx = x + (subtreeWidths.get(empId) || NODE_W) / 2 - totalW / 2;

    for (const child of children) {
      const cw = subtreeWidths.get(child.id) || NODE_W;
      place(child.id, cx, y + NODE_H + V_GAP);
      cx += cw + H_GAP;
    }
  }

  const visibleRoots = roots.filter((r) => visibleIds.has(r.id));
  const totalRootW = visibleRoots.reduce((s, r) => s + (subtreeWidths.get(r.id) || NODE_W), 0) + (visibleRoots.length - 1) * H_GAP;
  let startX = -totalRootW / 2;

  for (const root of visibleRoots) {
    const w = subtreeWidths.get(root.id) || NODE_W;
    place(root.id, startX, 0);
    startX += w + H_GAP;
  }

  return { nodes, edges };
}

function OrgTreeInner({ employees, highlightedId, onNodeClick, deptFilter }: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(() => {
    // Auto-collapse nodes at depth >= 2 for compact initial view
    const depths = new Map<number, number>();
    const empMap = new Map(employees.map((e) => [e.id, e]));

    function calcDepth(id: number): number {
      if (depths.has(id)) return depths.get(id)!;
      const emp = empMap.get(id);
      if (!emp || !emp.managerId) {
        depths.set(id, 0);
        return 0;
      }
      const d = calcDepth(emp.managerId) + 1;
      depths.set(id, d);
      return d;
    }

    employees.forEach((e) => calcDepth(e.id));

    const autoCollapsed = new Set<number>();
    employees.forEach((e) => {
      const hasChildren = employees.some((c) => c.managerId === e.id);
      if (hasChildren && (depths.get(e.id) || 0) >= 2) {
        autoCollapsed.add(e.id);
      }
    });
    return autoCollapsed;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);
  const collapseAll = useCallback(() => {
    const allParents = new Set<number>();
    employees.forEach((e) => {
      if (employees.some((c) => c.managerId === e.id)) {
        allParents.add(e.id);
      }
    });
    setCollapsed(allParents);
  }, [employees]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutTree(employees, collapsed, highlightedId, handleToggle, onNodeClick, deptFilter, isMobile),
    [employees, collapsed, highlightedId, handleToggle, onNodeClick, deptFilter, isMobile]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setTimeout(() => fitView({ padding: 0.3, maxZoom: 1.0, duration: 300 }), 50);
  }, [layoutNodes, layoutEdges, setNodes, setEdges, fitView]);

  useEffect(() => {
    if (highlightedId) {
      const node = nodes.find((n) => n.id === String(highlightedId));
      if (node) {
        setTimeout(() => fitView({ nodes: [node], padding: 0.8, maxZoom: 1.0, duration: 500 }), 100);
      }
    }
  }, [highlightedId, nodes, fitView]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
        >
          Развернуть все
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
        >
          Свернуть все
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.0 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={24} size={1} variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

export function OrgTree(props: Props) {
  return (
    <ReactFlowProvider>
      <OrgTreeInner {...props} />
    </ReactFlowProvider>
  );
}
