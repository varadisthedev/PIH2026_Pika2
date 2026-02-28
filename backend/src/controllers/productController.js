import Product from '../models/Product.js';
import { generateProductInsights } from '../services/geminiService.js';

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/products
export const createProduct = async (req, res) => {
    try {
        const { title, description, category, pricePerDay, images, securityDeposit, location } = req.body;
        const owner = req.dbUser._id;

        console.log(`📦 [productController] Creating: "${title}" | location: ${location?.address || 'none'}`);

        if (!title || !description || !category || !pricePerDay) {
            return res.status(400).json({ error: 'title, description, category, pricePerDay are required' });
        }

        const MAX_SAFE = 9007199254740991;
        if (Number(pricePerDay) > MAX_SAFE || Number(securityDeposit || 0) > MAX_SAFE) {
            return res.status(400).json({ error: 'Price values exceed the maximum safe integer limit.' });
        }

        let aiInsights = {};
        try {
            aiInsights = await generateProductInsights({ title, description, category, pricePerDay });
        } catch (aiError) {
            console.warn('⚠️  [productController] AI insights skipped:', aiError.message);
        }

        const product = await Product.create({
            title,
            description,
            category,
            pricePerDay,
            securityDeposit: Number(securityDeposit) || 0,
            images: images || [],
            owner,
            aiInsights,
            location: {
                address: location?.address || '',
                lat: location?.lat ?? null,
                lng: location?.lng ?? null,
            },
        });

        console.log(`✅ [productController] Product created: ${product._id}`);
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        console.error('❌ [productController] createProduct error:', error.message);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// GET /api/products  (public)
export const getProducts = async (req, res) => {
    try {
        const { category, search, maxPrice, page = 1, limit = 20, userLat, userLng } = req.query;
        console.log('📋 [productController] GET /products | filters:', req.query);

        const filter = { availability: true };
        if (category && category !== 'All') filter.category = category;
        if (maxPrice) filter.pricePerDay = { $lte: Number(maxPrice) };
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(filter);
        let products = await Product.find(filter)
            .populate('owner', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // If user location provided, attach distanceKm and sort by proximity
        if (userLat && userLng) {
            const uLat = Number(userLat);
            const uLng = Number(userLng);
            products = products.map(p => {
                const obj = p.toObject ? p.toObject() : p;
                if (obj.location?.lat != null && obj.location?.lng != null) {
                    obj.distanceKm = +haversine(uLat, uLng, obj.location.lat, obj.location.lng).toFixed(1);
                } else {
                    obj.distanceKm = null;
                }
                return obj;
            });
            products.sort((a, b) => {
                if (a.distanceKm == null && b.distanceKm == null) return 0;
                if (a.distanceKm == null) return 1;
                if (b.distanceKm == null) return -1;
                return a.distanceKm - b.distanceKm;
            });
            console.log(`📍 [productController] Sorted by proximity from [${uLat}, ${uLng}]`);
        }

        console.log(`✅ [productController] Found ${products.length} products`);
        res.status(200).json({ products, total, page: Number(page), limit: Number(limit) });
    } catch (error) {
        console.error('❌ [productController] getProducts error:', error.message);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// GET /api/products/mine  (authenticated — returns current user's own listings)
export const getMyProducts = async (req, res) => {
    try {
        const ownerId = req.dbUser._id;
        console.log(`📦 [productController] GET /products/mine | owner: ${ownerId}`);

        const products = await Product.find({ owner: ownerId })
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        console.log(`✅ [productController] Found ${products.length} products for owner ${ownerId}`);
        res.status(200).json({ products, total: products.length });
    } catch (error) {
        console.error('❌ [productController] getMyProducts error:', error.message);
        res.status(500).json({ error: 'Failed to fetch your products' });
    }
};

// GET /api/products/:id  (public)
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [productController] GET /products/${id}`);

        const product = await Product.findById(id).populate('owner', 'name email role');
        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.status(200).json({ product });
    } catch (error) {
        console.error('❌ [productController] getProductById error:', error.message);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// PUT /api/products/:id  (owner only)
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.dbUser._id.toString();

        console.log(`✏️  [productController] PUT /products/${id} by user: ${userId}`);

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        if (product.owner.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden – you do not own this product' });
        }

        const allowedFields = ['title', 'description', 'category', 'pricePerDay', 'securityDeposit', 'images', 'availability', 'location'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
        console.log(`✅ [productController] Product updated: ${id}`);
        res.status(200).json({ message: 'Product updated', product: updated });
    } catch (error) {
        console.error('❌ [productController] updateProduct error:', error.message);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// DELETE /api/products/:id  (owner or admin)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.dbUser;

        console.log(`🗑️  [productController] DELETE /products/${id} by user: ${user._id}`);

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const isOwner = product.owner.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Forbidden – insufficient permissions' });
        }

        await Product.findByIdAndDelete(id);
        console.log(`✅ [productController] Product deleted: ${id}`);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('❌ [productController] deleteProduct error:', error.message);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
