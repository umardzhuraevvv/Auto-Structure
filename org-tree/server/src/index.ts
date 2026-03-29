import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { employeesRouter } from './routes/employees.js';
import { usersRouter } from './routes/access.js';
import { auditRouter } from './routes/audit.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit', auditRouter);

// Serve client static files
const clientDist = path.join(process.cwd(), '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log(`Serving static files from ${clientDist}`);
} else {
  console.log(`Client dist not found at ${clientDist}`);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
