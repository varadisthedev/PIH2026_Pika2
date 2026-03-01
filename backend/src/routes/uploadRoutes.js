import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import { requireAuth } from '@clerk/express';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix: We need to go up TWO directories from src/routes to reach backend/uploads
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
console.log('📁 [uploadRoutes] Saving uploads to:', uploadDir);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${unique}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB per file, max 5 files
});

// POST /api/upload — requires auth, accepts up to 5 images
router.post('/', requireAuth(), upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        // Return relative paths — frontend resolves the host
        // e.g. /uploads/1234567-abc.jpg  (not http://localhost:5000/uploads/...)
        const urls = req.files.map(f => `/uploads/${f.filename}`);

        console.log(`✅ [upload] ${urls.length} image(s) uploaded:`, urls);
        res.status(201).json({ urls });
    } catch (err) {
        console.error('❌ [upload] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
