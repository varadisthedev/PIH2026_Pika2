import User from '../models/User.js';
import { clerkClient } from '@clerk/express';

/**
 * Middleware: Sync Clerk user into MongoDB on every authenticated request.
 * If user doesn't exist in DB or lacks valid names/emails, fetches full profile from Clerk backend.
 */
const syncUser = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized – no userId in token' });
        }

        // Check if user already exists in DB
        let user = await User.findOne({ clerkId: userId });

        // If user is missing OR has missing/default data from old JWT token issues
        if (!user || user.name === 'RentiGO User' || !user.email) {
            try {
                // Fetch the absolute truth from the Clerk Backend SDK
                const clerkUser = await clerkClient.users.getUser(userId);

                const claimEmail = clerkUser.emailAddresses?.[0]?.emailAddress
                    || req.auth?.sessionClaims?.email
                    || req.auth?.sessionClaims?.primaryEmailAddress
                    || '';

                const claimName = clerkUser.firstName
                    ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
                    : clerkUser.username
                        ? clerkUser.username
                        : req.auth?.sessionClaims?.name
                            ? req.auth?.sessionClaims?.name
                            : 'RentiGO User';

                if (!user) {
                    console.log(`🆕 [syncUser] Creating full DB user for clerkId: ${userId} | email: "${claimEmail}" | name: "${claimName}"`);
                    user = await User.create({
                        clerkId: userId,
                        email: claimEmail,
                        name: claimName,
                        role: 'buyer',
                    });
                } else {
                    console.log(`♻️ [syncUser] Patching existing DB user with fetched Clerk data for: ${userId}`);
                    user.email = claimEmail;
                    user.name = claimName;
                    await user.save();
                }
            } catch (err) {
                console.error('⚠️ [syncUser] Error fetching from Clerk API:', err.message);
                if (!user) {
                    // Fallback create
                    user = await User.create({
                        clerkId: userId,
                        email: req.auth?.sessionClaims?.email || '',
                        name: req.auth?.sessionClaims?.name || 'RentiGO User',
                        role: 'buyer'
                    });
                }
            }
        }

        // Attach full DB user to request
        req.dbUser = user;
        next();
    } catch (error) {
        console.error('❌ [syncUser] Error syncing user:', error.message);
        return res.status(500).json({ error: 'Internal server error during user sync' });
    }
};

export default syncUser;
