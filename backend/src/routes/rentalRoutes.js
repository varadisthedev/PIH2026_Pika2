import express from 'express';
import { requireAuth } from '@clerk/express';
import syncUser from '../middleware/syncUser.js';
import {
    createRental,
    getMyRentals,
    getSellerRentals,
    updateRentalStatus,
    cancelRental,
    getAllRentals,
} from '../controllers/rentalController.js';

const router = express.Router();

// POST /api/rentals – any authenticated user can rent
router.post('/', requireAuth(), syncUser, createRental);

// GET /api/rentals/me – renter sees their own outgoing rental requests
router.get('/me', requireAuth(), syncUser, getMyRentals);

// GET /api/rentals/seller – seller sees all incoming requests on their listings
router.get('/seller', requireAuth(), syncUser, getSellerRentals);

// PATCH /api/rentals/:id/status – any auth user (controller verifies ownership)
router.patch('/:id/status', requireAuth(), syncUser, updateRentalStatus);

// PATCH /api/rentals/:id/cancel – renter cancelling their own rental request
router.patch('/:id/cancel', requireAuth(), syncUser, cancelRental);

export default router;
