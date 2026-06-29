import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import goalRoutes from './routes/goal.routes';
import authRoutes from './routes/auth.routes'; // 🔥 DÒNG CẦN THÊM 1: Import đường ống Auth vào quầy lễ tân

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

connectDB().catch(err => console.error('DB connection failed:', err.message));

// Middlewares
app.use(cors());
app.use(express.json());

// System Routes (Health Check)
app.get('/', (req, res) => res.json({ message: 'Welcome to the DuckLock API!', status: 'Running', timestamp: new Date() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Business Routes
app.use('/api/auth', authRoutes);   // 🔥 DÒNG CẦN THÊM 2: Mở cửa đón nhận các API liên quan đến Đăng nhập/Đăng ký
app.use('/api/goals', goalRoutes);

// Global Handlers
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));