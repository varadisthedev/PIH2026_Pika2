import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { clerkMiddleware } from '@clerk/express';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { requireAuth } from '@clerk/express';
import syncUser from './middleware/syncUser.js';
import requireRole from './middleware/roleMiddleware.js';
import { getAllRentals } from './controllers/rentalController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://ab81-2401-4900-881f-d3f8-7e4d-7458-3989-198b.ngrok-free.app',
    'https://rentigo-pika2.vercel.app'
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── STATIC: serve uploaded images ────────────────────────────────────────
// __dirname = backend/src  →  ../uploads = backend/uploads (where multer saves files)
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));
console.log('📁 [app] Serving uploads from:', uploadsDir);

// ─── CLERK MIDDLEWARE (global) ────────────────────────────────────────────
app.use(clerkMiddleware());

// ─── REQUEST LOGGER ───────────────────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`➡️  [${req.method}] ${req.originalUrl}`);
    next();
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chats', chatRoutes);

// Admin rentals route (mounted on /api/admin to keep it clearly separated)
app.get(
    '/api/admin/rentals',
    requireAuth(),
    syncUser,
    requireRole('admin'),
    getAllRentals
);

// ─── 404 HANDLER ──────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('💥 [Global Error]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
