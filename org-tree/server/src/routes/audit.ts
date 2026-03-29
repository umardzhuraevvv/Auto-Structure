import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  const total = await prisma.auditLog.count();
  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

export { router as auditRouter };
