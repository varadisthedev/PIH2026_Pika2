import Rental from '../models/Rental.js';
import Product from '../models/Product.js';
import { createNotification } from './notificationController.js';

// POST /api/rentals  (buyer only)
export const createRental = async (req, res) => {
    try {
        const { productId, startDate, endDate } = req.body;
        const renter = req.dbUser._id;

        console.log(`🛒 [rentalController] POST /rentals | product: ${productId} | renter: ${renter}`);

        if (!productId || !startDate || !endDate) {
            return res.status(400).json({ error: 'productId, startDate, and endDate are required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!product.availability) {
            return res.status(400).json({ error: 'Product is not available for rent' });
        }

        // Calculate total price
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (days <= 0) {
            return res.status(400).json({ error: 'endDate must be after startDate' });
        }

        const securityDeposit = Math.round(product.pricePerDay * 2);
        const serviceFee = Math.round(product.pricePerDay * 0.1 * days);
        const totalPrice = (days * product.pricePerDay) + securityDeposit + serviceFee;

        console.log(`💰 [rentalController] Rental: ${days} days + deposit + fee = ₹${totalPrice}`);

        const rental = await Rental.create({
            product: productId,
            renter,
            startDate: start,
            endDate: end,
            totalPrice,
        });

        console.log(`✅ [rentalController] Rental created: ${rental._id}`);

        // Notify the product owner about the new request
        if (product.owner) {
            await createNotification(
                product.owner,
                `📦 New rental request for "${product.title}" — check your dashboard to approve or decline.`,
                'info',
                '/dashboard'
            );
        }

        res.status(201).json({ message: 'Rental request submitted', rental });
    } catch (error) {
        console.error('❌ [rentalController] createRental error:', error.message);
        res.status(500).json({ error: 'Failed to create rental' });
    }
};

// GET /api/rentals/me  (authenticated user – gets their own rentals as a renter)
export const getMyRentals = async (req, res) => {
    try {
        const renterId = req.dbUser._id;
        console.log(`📋 [rentalController] GET /rentals/me for user: ${renterId}`);

        const rentals = await Rental.find({ renter: renterId })
            .populate('product', 'title category pricePerDay images location')
            .sort({ createdAt: -1 });

        console.log(`✅ [rentalController] Found ${rentals.length} rentals for user: ${renterId}`);
        res.status(200).json({ rentals });
    } catch (error) {
        console.error('❌ [rentalController] getMyRentals error:', error.message);
        res.status(500).json({ error: 'Failed to fetch rentals' });
    }
};

// GET /api/rentals/seller  (seller – gets rentals for their own listings)
export const getSellerRentals = async (req, res) => {
    try {
        const sellerId = req.dbUser._id;
        console.log(`🏪 [rentalController] GET /rentals/seller | seller MongoDB _id: ${sellerId}`);

        const sellerProducts = await Product.find({ owner: sellerId }).select('_id title');
        const productIds = sellerProducts.map(p => p._id);

        console.log(`🏪 [rentalController] Seller owns ${sellerProducts.length} product(s):`,
            sellerProducts.map(p => `${p._id} — ${p.title}`)
        );

        if (productIds.length === 0) {
            console.log('🏪 [rentalController] No products found for this seller. Returning empty.');
            return res.status(200).json({ rentals: [] });
        }

        const rentals = await Rental.find({ product: { $in: productIds } })
            .populate('product', 'title category pricePerDay securityDeposit images')
            .populate('renter', 'name email')
            .sort({ createdAt: -1 });

        console.log(`✅ [rentalController] Found ${rentals.length} rental request(s) for seller ${sellerId}`);
        res.status(200).json({ rentals });
    } catch (error) {
        console.error('❌ [rentalController] getSellerRentals error:', error.message);
        res.status(500).json({ error: 'Failed to fetch seller rentals' });
    }
};


// PATCH /api/rentals/:id/status  (seller only – approve/reject/complete)
export const updateRentalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const sellerDbUser = req.dbUser;

        console.log(`🔄 [rentalController] PATCH /rentals/${id}/status → ${status}`);

        const validStatuses = ['approved', 'rejected', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const rental = await Rental.findById(id).populate('product');
        if (!rental) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // Verify seller owns the product being rented
        if (rental.product.owner.toString() !== sellerDbUser._id.toString()) {
            console.warn(`🚫 [rentalController] Unauthorized status update by: ${sellerDbUser._id}`);
            return res.status(403).json({ error: 'Forbidden – you do not own this product' });
        }

        rental.status = status;
        await rental.save();

        // Notify renter
        const statusMessages = {
            approved: `✅ Your rental request for "${rental.product.title}" was approved! Coordinate pickup with the owner.`,
            rejected: `❌ Your rental request for "${rental.product.title}" was declined by the owner.`,
            completed: `🎉 Rental of "${rental.product.title}" marked as completed. Thank you!`,
        };
        await createNotification(rental.renter, statusMessages[status] || `Rental status updated to ${status}.`, status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info', '/dashboard');

        // Notify seller too on completion
        if (status === 'completed') {
            await createNotification(sellerDbUser._id, `Rental of "${rental.product.title}" has been marked completed.`, 'success', '/earnings');
        }

        console.log(`✅ [rentalController] Rental ${id} status updated to: ${status}`);
        res.status(200).json({ message: `Rental ${status}`, rental });
    } catch (error) {
        console.error('❌ [rentalController] updateRentalStatus error:', error.message);
        res.status(500).json({ error: 'Failed to update rental status' });
    }
};

// PATCH /api/rentals/:id/cancel  (renter only – cancel pending/approved request)
export const cancelRental = async (req, res) => {
    try {
        const { id } = req.params;
        const renterDbUser = req.dbUser;

        console.log(`🔄 [rentalController] PATCH /rentals/${id}/cancel`);

        const rental = await Rental.findById(id).populate('product');
        if (!rental) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // Verify renter placed this request
        if (rental.renter.toString() !== renterDbUser._id.toString()) {
            console.warn(`🚫 [rentalController] Unauthorized cancel attempt by: ${renterDbUser._id}`);
            return res.status(403).json({ error: 'Forbidden – you did not make this request' });
        }

        if (rental.status !== 'pending' && rental.status !== 'approved') {
            return res.status(400).json({ error: 'Only pending or approved requests can be cancelled' });
        }

        rental.status = 'cancelled';
        await rental.save();

        // Notify renter
        await createNotification(renterDbUser._id, `Your rental request has been cancelled.`, 'info', '/dashboard');
        // Notify seller
        if (rental.product?.owner) {
            await createNotification(rental.product.owner, `A rental request for "${rental.product.title}" was cancelled by the renter.`, 'info', '/dashboard');
        }

        console.log(`✅ [rentalController] Rental ${id} status updated to: cancelled`);
        res.status(200).json({ message: 'Rental cancelled', rental });
    } catch (error) {
        console.error('❌ [rentalController] cancelRental error:', error.message);
        res.status(500).json({ error: 'Failed to cancel rental' });
    }
};


// GET /api/admin/rentals  (admin only)
export const getAllRentals = async (req, res) => {
    try {
        console.log('🔑 [rentalController] GET /admin/rentals (admin access)');

        const rentals = await Rental.find()
            .populate('product', 'title category pricePerDay')
            .populate('renter', 'name email role')
            .sort({ createdAt: -1 });

        console.log(`✅ [rentalController] Admin fetched ${rentals.length} total rentals`);
        res.status(200).json({ rentals, total: rentals.length });
    } catch (error) {
        console.error('❌ [rentalController] getAllRentals error:', error.message);
        res.status(500).json({ error: 'Failed to fetch all rentals' });
    }
};
