import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Get all chats for the logged in user
export const getMyChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name email')
            .sort({ lastMessageAt: -1 });

        res.status(200).json({ chats });
    } catch (error) {
        console.error('Error fetching chats:', error.message);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
};

// Connect via email
export const connectChat = async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.user._id;

        if (!email) {
            return res.status(400).json({ error: 'Email is required to connect' });
        }

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) {
            return res.status(404).json({ error: 'User with this email not found' });
        }

        if (targetUser._id.toString() === userId.toString()) {
            return res.status(400).json({ error: 'Cannot chat with yourself' });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [userId, targetUser._id] }
        }).populate('participants', 'name email');

        if (!chat) {
            chat = await Chat.create({
                participants: [userId, targetUser._id],
                messages: []
            });
            chat = await chat.populate('participants', 'name email');
        }

        res.status(200).json({ chat });
    } catch (error) {
        console.error('Error connecting chat:', error.message);
        res.status(500).json({ error: 'Failed to connect chat' });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(userId)) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const newMessage = {
            sender: userId,
            text,
            createdAt: new Date()
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();
        await chat.save();

        res.status(201).json({ message: newMessage });
    } catch (error) {
        console.error('Error sending message:', error.message);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
