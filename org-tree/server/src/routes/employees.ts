import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// Get all employees (public for viewers)
router.get('/', async (_req, res) => {
  const employees = await prisma.employee.findMany({
    include: { subordinates: true, manager: true },
    orderBy: { id: 'asc' },
  });
  res.json(employees);
});

// Get single employee
router.get('/:id', async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      subordinates: true,
      manager: true,
    },
  });
  if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' });
  res.json(employee);
});

// Create employee (ADMIN only)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { fullName, position, department, duties, managerId, photoUrl } = req.body;
  const employee = await prisma.employee.create({
    data: { fullName, position, department, duties, managerId, photoUrl },
  });
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'ADD',
      target: fullName,
      details: `Добавлен сотрудник: ${position}, ${department}`,
    },
  });
  res.status(201).json(employee);
});

// Update employee (ADMIN, EDITOR)
router.put('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Сотрудник не найден' });

  const { fullName, position, department, duties, photoUrl } = req.body;
  const employee = await prisma.employee.update({
    where: { id },
    data: { fullName, position, department, duties, photoUrl },
  });

  const changes: string[] = [];
  if (duties !== undefined && duties !== existing.duties) changes.push('обязанности');
  if (position !== undefined && position !== existing.position) changes.push('должность');
  if (fullName !== undefined && fullName !== existing.fullName) changes.push('ФИО');

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'EDIT',
      target: existing.fullName,
      details: `Изменено: ${changes.join(', ')}`,
    },
  });
  res.json(employee);
});

// Move employee to another manager (ADMIN, EDITOR)
router.patch('/:id/move', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { managerId } = req.body;

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Сотрудник не найден' });

  if (managerId !== null) {
    const newManager = await prisma.employee.findUnique({ where: { id: managerId } });
    if (!newManager) return res.status(400).json({ error: 'Руководитель не найден' });

    // Prevent circular reference
    let current = newManager;
    while (current.managerId) {
      if (current.managerId === id) {
        return res.status(400).json({ error: 'Нельзя создать циклическую зависимость' });
      }
      current = (await prisma.employee.findUnique({ where: { id: current.managerId } }))!;
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { managerId },
  });

  const newManager = managerId
    ? await prisma.employee.findUnique({ where: { id: managerId } })
    : null;

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'MOVE',
      target: existing.fullName,
      details: `Перемещён к: ${newManager?.fullName || 'корень'}`,
    },
  });
  res.json(employee);
});

// Delete employee with entire branch (ADMIN only)
router.delete('/:id/branch', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Сотрудник не найден' });

  // Recursively collect all descendant IDs
  const allIds: number[] = [];
  async function collectDescendants(parentId: number) {
    const children = await prisma.employee.findMany({ where: { managerId: parentId }, select: { id: true } });
    for (const child of children) {
      allIds.push(child.id);
      await collectDescendants(child.id);
    }
  }
  await collectDescendants(id);
  allIds.push(id);

  await prisma.$transaction([
    prisma.employee.deleteMany({ where: { id: { in: allIds } } }),
    prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        target: existing.fullName,
        details: `Удалена ветка: ${allIds.length} сотрудник(ов)`,
      },
    }),
  ]);

  res.json({ ok: true, count: allIds.length });
});

// Delete employee (ADMIN only)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.employee.findUnique({
    where: { id },
    include: { subordinates: true },
  });
  if (!existing) return res.status(404).json({ error: 'Сотрудник не найден' });

  // Move subordinates to the deleted employee's manager
  if (existing.subordinates.length > 0) {
    await prisma.employee.updateMany({
      where: { managerId: id },
      data: { managerId: existing.managerId },
    });
  }

  await prisma.employee.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      target: existing.fullName,
      details: `Удалён сотрудник. Подчинённые переданы руководителю.`,
    },
  });
  res.json({ ok: true });
});

export { router as employeesRouter };
