import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// List all users (ADMIN)
router.get('/', authenticate, requireRole('ADMIN'), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { id: 'asc' },
  });
  res.json(users);
});

// Create user (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, пароль и имя обязательны' });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role: role || 'VIEWER' },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE_USER',
      target: email,
      details: `Создан пользователь: ${name}, роль: ${role || 'VIEWER'}`,
    },
  });

  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// Change role (ADMIN)
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { role } = req.body;
  if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
    return res.status(400).json({ error: 'Невалидная роль' });
  }
  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CHANGE_ROLE',
      target: user.email,
      details: `Роль изменена на: ${role}`,
    },
  });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// Deactivate user (ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.user!.id === id) {
    return res.status(400).json({ error: 'Нельзя деактивировать свой аккаунт' });
  }
  const user = await prisma.user.update({
    where: { id },
    data: { active: false },
  });
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DEACTIVATE_USER',
      target: user.email,
      details: 'Пользователь деактивирован',
    },
  });
  res.json({ ok: true });
});

export { router as usersRouter };
