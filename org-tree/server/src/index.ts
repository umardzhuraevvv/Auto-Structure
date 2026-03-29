import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { employeesRouter } from './routes/employees.js';
import { usersRouter } from './routes/access.js';
import { auditRouter } from './routes/audit.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit', auditRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
