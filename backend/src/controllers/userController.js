import User from '../models/User.js';

// GET /api/users/me
export const getMe = async (req, res) => {
    try {
        console.log(`👤 [userController] GET /me for clerkId: ${req.auth.userId}`);
        const user = req.dbUser;
        res.status(200).json({ user });
    } catch (error) {
        console.error('❌ [userController] getMe error:', error.message);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

// POST /api/users/welcome
export const updateWelcome = async (req, res) => {
    try {
        const userId = req.dbUser._id;
        await User.findByIdAndUpdate(userId, { hasSeenWelcome: true });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ [userController] updateWelcome error:', error.message);
        res.status(500).json({ error: 'Failed to update welcome status' });
    }
};

// PATCH /api/users/role  (admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { clerkId, role } = req.body;

        if (!clerkId || !role) {
            return res.status(400).json({ error: 'clerkId and role are required' });
        }

        const validRoles = ['buyer', 'seller', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        console.log(`🔧 [userController] Admin updating role for clerkId: ${clerkId} → ${role}`);

        const user = await User.findOneAndUpdate(
            { clerkId },
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`✅ [userController] Role updated: ${user.email} → ${role}`);
        res.status(200).json({ message: 'Role updated successfully', user });
    } catch (error) {
        console.error('❌ [userController] updateUserRole error:', error.message);
        res.status(500).json({ error: 'Failed to update role' });
    }
};
