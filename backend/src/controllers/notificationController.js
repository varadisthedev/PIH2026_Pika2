import Notification from '../models/Notification.js';

// GET /api/notifications
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.dbUser._id;
        const notifs = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ notifications: notifs });
    } catch (error) {
        console.error('❌ [notifController] getMyNotifications:', error.message);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// POST /api/notifications  (internal helper, also used by admin/system)
export const createNotification = async (userId, message, type = 'info', route = null) => {
    try {
        const notif = await Notification.create({ user: userId, message, type, route });
        return notif;
    } catch (error) {
        console.error('❌ [notifController] createNotification:', error.message);
    }
};

// PATCH /api/notifications/:id/read
export const markOneRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.dbUser._id;
        const notif = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { isRead: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        res.status(200).json({ notification: notif });
    } catch (error) {
        console.error('❌ [notifController] markOneRead:', error.message);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res) => {
    try {
        const userId = req.dbUser._id;
        await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ [notifController] markAllRead:', error.message);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.dbUser._id;
        const deleted = await Notification.findOneAndDelete({ _id: id, user: userId });
        if (!deleted) return res.status(404).json({ error: 'Notification not found' });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ [notifController] deleteNotification:', error.message);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
