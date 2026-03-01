import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, ArrowLeft, Clock, MoreVertical, ShieldCheck, MailPlus, Loader2 } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useAuth, useUser } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';

export default function Messages() {
    const { getToken, userId } = useAuth();
    const { user } = useUser();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [fetchingChats, setFetchingChats] = useState(true);
    const [connectEmail, setConnectEmail] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChats = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const res = await api.get('/chats', withToken(token));
            setChats(res.data.chats || []);
        } catch (error) {
            console.error('Failed to fetch chats', error);
        } finally {
            setFetchingChats(false);
        }
    };

    // Polling for new messages
    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 5000); // refresh every 5s for MVP real-time
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    const handleConnect = async (e) => {
        e.preventDefault();
        setConnectError('');
        if (!connectEmail.trim()) return;
        setConnecting(true);

        try {
            const token = await getToken();
            const res = await api.post('/chats/connect', { email: connectEmail }, withToken(token));
            
            // if new chat is returned, add and set active
            const newChat = res.data.chat;
            setChats(prev => {
                const existing = prev.find(c => c._id === newChat._id);
                if (existing) return prev;
                return [newChat, ...prev];
            });
            setActiveChat(newChat);
            setShowConnectModal(false);
            setConnectEmail('');
        } catch (error) {
            setConnectError(error.response?.data?.error || 'Failed to connect. Make sure email exists.');
        } finally {
            setConnecting(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;
        
        const tempText = newMessage;
        setNewMessage('');

        // Optimistic UI update
        const msgObj = {
            _id: Date.now().toString(),
            text: tempText,
            sender: user?.id || userId, 
            createdAt: new Date().toISOString()
        };
        
        // Temporarily append
        setActiveChat(prev => ({ ...prev, messages: [...prev.messages, msgObj] }));
        setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, messages: [...c.messages, msgObj], lastMessageAt: new Date().toISOString() } : c));

        try {
            const token = await getToken();
            await api.post(`/chats/${activeChat._id}/messages`, { text: tempText }, withToken(token));
            fetchChats(); // refresh behind the scenes
        } catch (error) {
            console.error('Failed to send message', error);
            // Optionally remove optimistic message here
        }
    };

    // Helper to get the other participant
    const getOtherParticipant = (chat) => {
        // chat.participants contains User models, we need to find the one not matching our clerk email
        // we might not have backend ID here easily, so we match by email
        const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        return chat.participants.find(p => p.email?.toLowerCase() !== userEmail) || chat.participants[0];
    };

    // Helper to format time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Check if message sent by me
    const isMe = (senderId) => {
        // if sender is an object, use its _id, or compare string directly. 
        // We know from DB sender is ObjectId, but optimistic is clerkId. 
        // Instead of perfect ID matching, let's just do a proxy via participants finding me
        const myParticipant = activeChat?.participants?.find(p => p.email?.toLowerCase() === user?.primaryEmailAddress?.emailAddress?.toLowerCase());
        const myDbId = myParticipant?._id;
        
        return senderId === myDbId || senderId === user?.id || senderId === userId;
    };

    // Refreshed active chat based on chats pool
    const currentChat = activeChat ? chats.find(c => c._id === activeChat._id) || activeChat : null;

    return (
        <div className="pt-20 min-h-screen bg-white/40 dark:bg-transparent flex flex-col">
            <Container className="flex-1 flex gap-0 lg:gap-8 pb-10">
                {/* Chat Sidebar */}
                <aside className={`w-full lg:w-[380px] flex-col ${activeChat && 'hidden lg:flex'} flex`}>
                    <div className="py-8 space-y-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark dark:text-brand-frost tracking-tighter uppercase mb-2">Inbox</h1>
                                <p className="text-[10px] font-black text-brand-teal/40 uppercase tracking-widest">Connect with your community</p>
                            </div>
                            <Button variant="secondary" onClick={() => setShowConnectModal(true)} className="!p-2.5 rounded-2xl" title="New Chat">
                                <MailPlus size={18} />
                            </Button>
                        </div>

                        {showConnectModal && (
                            <form onSubmit={handleConnect} className="p-4 rounded-3xl glass-card bg-brand-teal/5 border border-brand-teal/20 space-y-3 animate-fade-down">
                                <h4 className="text-xs font-black uppercase text-brand-dark dark:text-brand-frost">Connect by Email</h4>
                                <input
                                    type="email"
                                    required
                                    value={connectEmail}
                                    onChange={(e) => setConnectEmail(e.target.value)}
                                    placeholder="Enter user's email ID..."
                                    className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-brand-dark/20 border-none outline-none text-xs font-bold focus:ring-2 focus:ring-brand-green/30"
                                />
                                {connectError && <p className="text-[10px] text-red-500 font-bold">{connectError}</p>}
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" className="flex-1 text-[10px]" onClick={() => setShowConnectModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1 text-[10px]" disabled={connecting}>
                                        {connecting ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/40" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-12 pr-4 py-4 rounded-3xl glass-card bg-white/50 dark:bg-brand-dark/20 border-none outline-none text-xs font-bold text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20"
                            />
                        </div>

                        <div className="space-y-2 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                            {fetchingChats && chats.length === 0 ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-teal/50" /></div>
                            ) : chats.length === 0 ? (
                                <div className="text-center p-8 glass-card rounded-[2rem] border-brand-teal/10">
                                    <p className="text-xs font-bold text-brand-teal/60">No chats yet. Connect with someone via email!</p>
                                </div>
                            ) : (
                                chats.map(chat => {
                                    const otherUser = getOtherParticipant(chat);
                                    const lastMsg = chat.messages[chat.messages.length - 1];
                                    
                                    return (
                                        <button
                                            key={chat._id}
                                            onClick={() => setActiveChat(chat)}
                                            className={`w-full p-5 rounded-[2rem] flex gap-4 transition-all text-left group ${activeChat?._id === chat._id
                                                ? 'bg-brand-dark text-white dark:bg-brand-green dark:text-brand-dark shadow-2xl scale-[1.02]'
                                                : 'glass-card hover:bg-brand-teal/5'}`}
                                        >
                                            <div className="relative shrink-0">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.name || 'User'}`} alt="" className="w-12 h-12 rounded-2xl object-cover bg-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-xs font-black uppercase tracking-tight truncate">{otherUser?.name || otherUser?.email || 'Unknown User'}</h4>
                                                    <span className={`text-[8px] font-black uppercase ${activeChat?._id === chat._id ? 'opacity-60' : 'text-brand-teal/40'}`}>
                                                        {lastMsg ? formatTime(lastMsg.createdAt) : ''}
                                                    </span>
                                                </div>
                                                <p className={`text-[10px] font-bold line-clamp-1 truncate ${activeChat?._id === chat._id ? 'opacity-80' : 'text-brand-teal/60'}`}>
                                                    {lastMsg ? lastMsg.text : 'No messages yet'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <main className={`flex-1 flex flex-col min-h-0 py-8 ${!activeChat && 'hidden lg:flex'}`}>
                    {currentChat ? (
                        <div className="flex-1 flex flex-col glass-card shadow-2xl border-brand-teal/5 bg-white/60 dark:bg-brand-dark/20 rounded-[3rem] overflow-hidden">
                            {/* Chat Header */}
                            <div className="px-8 py-6 border-b border-brand-teal/5 flex items-center justify-between bg-white/40 dark:bg-transparent backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveChat(null)} className="lg:hidden p-2 text-brand-teal">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="w-10 h-10 rounded-2xl overflow-hidden glass-card">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getOtherParticipant(currentChat)?.name || 'User'}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tight leading-none">
                                            {getOtherParticipant(currentChat)?.name || 'User'}
                                        </h3>
                                        <div className="text-[10px] font-bold text-brand-teal/80 mt-1 lowercase tracking-wide flex items-center gap-2">
                                            <span>{user?.primaryEmailAddress?.emailAddress}</span>
                                            <span className="opacity-50 text-brand-green">↔</span>
                                            <span>{getOtherParticipant(currentChat)?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                                            <span className="text-[9px] font-bold text-brand-teal/60 uppercase">Real-time (Auto Sync)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="approved" className="!hidden xs:flex !text-[9px] px-2 py-1 uppercase font-black tracking-widest">Verified User</Badge>
                                    <button className="p-2 text-brand-teal hover:bg-brand-teal/5 rounded-xl"><MoreVertical size={20} /></button>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-gradient-to-b from-brand-teal/[0.02] to-transparent">
                                {currentChat.messages.map(msg => {
                                    const sentByMe = isMe(msg.sender);
                                    return (
                                        <div key={msg._id} className={`flex ${sentByMe ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                                            <div className={`max-w-[80%] sm:max-w-[60%] space-y-1 ${sentByMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`p-5 px-6 rounded-[2rem] text-xs font-bold leading-relaxed shadow-sm ${sentByMe
                                                        ? 'bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark rounded-tr-none'
                                                        : 'glass-card text-brand-dark dark:text-brand-frost rounded-tl-none'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                                <div className="text-[8px] font-black text-brand-teal/30 px-4 uppercase tracking-[0.1em]">{formatTime(msg.createdAt)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-6 px-8 border-t border-brand-teal/5 bg-white/40 dark:bg-transparent backdrop-blur-md">
                                <form onSubmit={handleSend} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-8 py-5 rounded-[2.5rem] glass-card bg-white/50 dark:bg-brand-dark/40 border-none outline-none text-xs font-black text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20 focus:ring-2 focus:ring-brand-green/30"
                                    />
                                    <Button type="submit" variant="primary" className="!rounded-[2.5rem] px-8 shadow-xl shadow-brand-green/20" disabled={!newMessage.trim()}>
                                        <Send size={18} />
                                    </Button>
                                </form>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <ShieldCheck size={12} className="text-brand-green" />
                                    <span className="text-[9px] font-black text-brand-teal/30 uppercase tracking-[0.1em]">Encrypted Neighborhood Chat</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center glass-card bg-brand-teal/[0.02] border-brand-teal/5 rounded-[3rem] p-12 text-center">
                            <div className="w-24 h-24 rounded-[3rem] bg-brand-teal/5 flex items-center justify-center mb-8 border border-brand-teal/10 shadow-inner">
                                <MessageSquare size={40} className="text-brand-teal/40" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter mb-4">Your Inbox</h3>
                            <p className="text-xs font-bold text-brand-teal/60 max-w-sm uppercase tracking-tight leading-relaxed">
                                Start a chat by connecting via email id or select a conversation on the left.
                            </p>
                        </div>
                    )}
                </main>
            </Container>
        </div>
    );
}
