import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle2, Clock, Info, ShieldCheck,
    ChevronRight, ArrowLeft, Trash2, MessageSquare, AlertCircle
} from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Card from '../components/ui/Card.jsx';
import { EmptyState } from '../components/items/ItemStates.jsx';
import { useAuth } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';

const TYPE_CONFIG = {
    success: { icon: CheckCircle2, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    info: { icon: Info, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
    warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function Notifications() {
    const navigate = useNavigate();
    const { getToken, isSignedIn } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const load = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            const res = await api.get('/notifications', withToken(token));
            setNotifications(res.data.notifications || []);
        } catch (err) {
            console.error('Failed to load notifications:', err.message);
        } finally {
            setLoading(false);
        }
    }, [getToken, isSignedIn]);

    useEffect(() => { load(); }, [load]);

    const handleMarkOneRead = async (notif) => {
        if (notif.isRead) return;
        // Optimistic
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        try {
            const token = await getToken();
            await api.patch(`/notifications/${notif._id}/read`, {}, withToken(token));
        } catch {
            // Restore on failure
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: false } : n));
        }
        if (notif.route) navigate(notif.route);
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        // Optimistic
        const prev = notifications;
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        try {
            const token = await getToken();
            await api.patch('/notifications/read-all', {}, withToken(token));
            showToast('All notifications marked as read', 'success');
        } catch {
            setNotifications(prev);
            showToast('Failed to mark all read', 'error');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        const removed = notifications.find(n => n._id === id);
        // Optimistic
        setNotifications(prev => prev.filter(n => n._id !== id));
        try {
            const token = await getToken();
            await api.delete(`/notifications/${id}`, withToken(token));
            showToast('Notification deleted', 'success');
        } catch {
            // Restore on failure
            setNotifications(prev => [...prev, removed].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            showToast('Failed to delete notification', 'error');
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="pt-28 pb-32 animate-fade-in min-h-screen bg-white/40 dark:bg-transparent">
            <Container>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-up">
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal hover:text-brand-dark dark:text-brand-aqua dark:hover:text-brand-frost transition-all group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Go Back
                            </button>
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl sm:text-6xl font-black text-brand-dark dark:text-brand-frost tracking-tighter leading-none">
                                    Activity Feed
                                </h1>
                                {unreadCount > 0 && (
                                    <span className="px-3 py-1.5 rounded-full bg-brand-green text-white text-xs font-black">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="!rounded-2xl !text-[11px] font-black uppercase tracking-widest"
                                onClick={handleMarkAllRead}
                                disabled={unreadCount === 0}
                            >
                                <ShieldCheck size={16} /> Mark all Read
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <EmptyState
                            icon={Bell}
                            title="All caught up!"
                            description="No new alerts right now. We'll let you know when there's an update on your rentals or messages."
                            action={
                                <Button variant="primary" onClick={() => navigate('/browse')}>
                                    Keep Exploring
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notif, i) => {
                                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                                const Icon = config.icon;

                                return (
                                    <Card
                                        key={notif._id}
                                        variant="glass"
                                        className={`!p-6 group cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.01] animate-fade-up ${!notif.isRead ? 'border-l-4 border-l-brand-green bg-brand-green/[0.02]' : 'opacity-75 hover:opacity-100'}`}
                                        style={{ animationDelay: `${i * 60}ms` }}
                                        onClick={() => handleMarkOneRead(notif)}
                                    >
                                        <div className="flex items-start gap-5 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${config.bg} ${config.color}`}>
                                                <Icon size={22} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Badge variant={notif.type} className="!text-[9px] px-2 py-0.5 uppercase font-black tracking-widest">{notif.type}</Badge>
                                                    <span className="text-[10px] font-black text-brand-teal/30 uppercase tracking-widest">{formatTime(notif.createdAt)}</span>
                                                </div>
                                                <p className={`text-sm tracking-tight leading-relaxed ${!notif.isRead ? 'font-black text-brand-dark dark:text-brand-frost' : 'font-semibold text-brand-dark/70 dark:text-brand-frost/60'}`}>
                                                    {notif.message}
                                                </p>

                                                {!notif.isRead && (
                                                    <div className="mt-3 flex items-center gap-2 text-[9px] font-black text-brand-green uppercase tracking-[0.15em]">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                                        New Activity
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 items-center">
                                                <button
                                                    onClick={(e) => handleDelete(notif._id, e)}
                                                    className="p-2 rounded-xl text-brand-teal/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                                {notif.route && (
                                                    <ChevronRight size={18} className="text-brand-teal/10 group-hover:text-brand-teal/40 group-hover:translate-x-1 transition-all" />
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer Hint */}
                    <div className="mt-16 p-8 rounded-[3rem] bg-brand-teal/5 border border-brand-teal/10 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">Missed a message?</h4>
                                <p className="text-[10px] font-bold text-brand-teal/60 uppercase tracking-widest">Check your neighborhood chat inbox</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/messages')} className="!rounded-2xl">
                            Open Chat <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
}

// Simple inline toast utility (will be shared)
function showToast(message, type = 'info') {
    // Use a simple alert fallback if no toast lib — will be replaced with proper toast
    const el = document.createElement('div');
    el.className = `fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all animate-fade-up ${type === 'success' ? 'bg-brand-green text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-brand-dark text-brand-frost'}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}
