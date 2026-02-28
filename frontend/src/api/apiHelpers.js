import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Returns Axios headers with the Clerk session token.
 * Use this for any authenticated API call.
 *
 * @param {Function} getToken - from Clerk's useAuth() hook
 * @returns {Object} headers object
 *
 * Example usage inside a React component:
 *   const { getToken } = useAuth();
 *   const headers = await getAuthHeaders(getToken);
 *   const res = await axios.get(`${API_BASE}/users/me`, { headers });
 */
export const getAuthHeaders = async (getToken) => {
    const token = await getToken();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

/**
 * Pre-built API helper functions.
 * Pass your Clerk `getToken` function to each one.
 */

export const API_BASE = BASE_URL;

// ── USER ─────────────────────────────────────────────────────────────────

export const fetchMe = async (getToken) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.get(`${API_BASE}/users/me`, { headers });
    return res.data.user;
};

export const updateMyRole = async (getToken, clerkId, role) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.patch(`${API_BASE}/users/role`, { clerkId, role }, { headers });
    return res.data;
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────

export const fetchProducts = async (filters = {}) => {
    const res = await axios.get(`${API_BASE}/products`, { params: filters });
    return res.data;
};

export const fetchProductById = async (id) => {
    const res = await axios.get(`${API_BASE}/products/${id}`);
    return res.data.product;
};

export const createProduct = async (getToken, productData) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.post(`${API_BASE}/products`, productData, { headers });
    return res.data;
};

export const updateProduct = async (getToken, id, updates) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.put(`${API_BASE}/products/${id}`, updates, { headers });
    return res.data;
};

export const deleteProduct = async (getToken, id) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.delete(`${API_BASE}/products/${id}`, { headers });
    return res.data;
};

// ── RENTALS ───────────────────────────────────────────────────────────────

export const createRental = async (getToken, rentalData) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.post(`${API_BASE}/rentals`, rentalData, { headers });
    return res.data;
};

export const fetchMyRentals = async (getToken) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.get(`${API_BASE}/rentals/me`, { headers });
    return res.data.rentals;
};

export const updateRentalStatus = async (getToken, rentalId, status) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.patch(`${API_BASE}/rentals/${rentalId}/status`, { status }, { headers });
    return res.data;
};

// ── ADMIN ─────────────────────────────────────────────────────────────────

export const fetchAllRentals = async (getToken) => {
    const headers = await getAuthHeaders(getToken);
    const res = await axios.get(`${API_BASE}/admin/rentals`, { headers });
    return res.data;
};
