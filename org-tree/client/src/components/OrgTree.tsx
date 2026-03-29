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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EmployeeCard } from './EmployeeCard';
import type { Employee } from '../types';

const nodeTypes = { employee: EmployeeCard };

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

  const NODE_W = isMobile ? 160 : 240;
  const NODE_H = isMobile ? 90 : 110;
  const H_GAP = isMobile ? 20 : 40;
  const V_GAP = isMobile ? 40 : 60;

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
      edges.push({
        id: `e-${emp.managerId}-${empId}`,
        source: String(emp.managerId),
        target: String(empId),
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
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
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
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

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutTree(employees, collapsed, highlightedId, handleToggle, onNodeClick, deptFilter, isMobile),
    [employees, collapsed, highlightedId, handleToggle, onNodeClick, deptFilter, isMobile]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [layoutNodes, layoutEdges, setNodes, setEdges, fitView]);

  useEffect(() => {
    if (highlightedId) {
      const node = nodes.find((n) => n.id === String(highlightedId));
      if (node) {
        setTimeout(() => fitView({ nodes: [node], padding: 1, duration: 500 }), 100);
      }
    }
  }, [highlightedId, nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e2e8f0" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function OrgTree(props: Props) {
  return (
    <ReactFlowProvider>
      <OrgTreeInner {...props} />
    </ReactFlowProvider>
  );
}
