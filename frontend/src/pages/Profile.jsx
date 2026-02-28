import React, { useState } from 'react';
import {
    User, Mail, Phone, MapPin, Star, ShieldCheck,
    Calendar, Edit3, Settings, Bell, CreditCard, LogOut,
    Package, Clock, CheckCircle2, ChevronRight, Camera
} from 'lucide-react';
import { useRental } from '../context/RentalContext.jsx';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Card from '../components/ui/Card.jsx';

export default function Profile() {
    const { userProfile, userRole } = useRental();
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="pt-28 pb-32 animate-fade-in min-h-screen bg-white/40 dark:bg-transparent">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 items-start">
                    {/* Profile Sidebar */}
                    <aside className="space-y-8 sticky top-28">
                        <Card variant="glass" className="!p-10 !rounded-[3rem] text-center space-y-8 border-brand-green/20">
                            <div className="relative inline-block group cursor-pointer mx-auto">
                                <div className="w-40 h-40 rounded-[3.5rem] overflow-hidden border-4 border-white dark:border-brand-dark shadow-2xl transition-transform group-hover:scale-105 duration-500">
                                    <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover bg-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-brand-green flex items-center justify-center text-brand-dark shadow-xl hover:scale-110 transition-transform">
                                    <Camera size={20} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-brand-dark dark:text-brand-frost tracking-tighter uppercase leading-none">{userProfile.name}</h2>
                                    <div className="flex items-center justify-center gap-2 text-brand-teal/60">
                                        <Badge variant="approved" className="!text-[9px] px-2 py-0.5 uppercase tracking-widest font-black">Verified User</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-4 text-xs font-black text-brand-teal uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><Star size={14} className="fill-brand-green text-brand-green" /> {userProfile.rating}</div>
                                    <span className="w-1 h-1 rounded-full bg-brand-teal/20" />
                                    <div>{userProfile.reviewCount} Reviews</div>
                                </div>
                            </div>

                            <p className="text-xs font-bold text-brand-teal/60 uppercase leading-relaxed tracking-tight px-4 italic">
                                "{userProfile.bio}"
                            </p>

                            <div className="pt-8 border-t border-brand-teal/5 flex gap-4">
                                <Button variant="primary" className="flex-1 !rounded-[2rem]" onClick={() => setIsEditing(true)}>
                                    <Edit3 size={16} /> Edit Profile
                                </Button>
                                <Button variant="outline" className="p-4 !rounded-[2rem]">
                                    <Settings size={20} />
                                </Button>
                            </div>
                        </Card>

                        <div className="px-10 py-8 rounded-[3rem] bg-brand-green/5 border border-brand-green/10 flex items-center gap-4">
                            <ShieldCheck size={24} className="text-brand-green" />
                            <div className="text-[10px] font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter leading-tight">
                                Your account is protected by <span className="text-brand-green">SafeShare Identity</span> Verification.
                            </div>
                        </div>
                    </aside>

                    {/* Main Settings/Info Area */}
                    <div className="space-y-12">
                        {/* Account Details */}
                        <section className="space-y-8 animate-fade-up">
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-10 h-1 rounded-full bg-brand-green shadow-xl shadow-brand-green/40" />
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/60">Account Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { icon: Mail, label: 'Email Address', value: userProfile.email },
                                    { icon: Phone, label: 'Phone Number', value: userProfile.phone },
                                    { icon: MapPin, label: 'Primary Location', value: userProfile.location },
                                    { icon: Calendar, label: 'Joined Neighborhood', value: userProfile.joinDate },
                                ].map((item, i) => (
                                    <Card key={i} variant="default" className="!p-6 flex items-center gap-6 group hover:border-brand-teal/30 transition-all cursor-default">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-teal/5 flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all">
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-brand-teal/40 uppercase tracking-widest mb-0.5">{item.label}</div>
                                            <div className="text-sm font-black text-brand-dark dark:text-brand-frost tracking-tight">{item.value}</div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="space-y-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-10 h-1 rounded-full bg-brand-teal/20" />
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal/60">Quick Navigation</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { icon: Bell, label: 'Activity & Notifications', to: '/notifications', desc: 'Manage your alerts and community updates' },
                                    { icon: CreditCard, label: 'Payment & Payouts', to: '/earnings', desc: 'Secure billing and earnings history' },
                                    { icon: Package, label: userRole === 'renter' ? 'Booking History' : 'Inventory Manager', to: '/dashboard', desc: 'Track your local gear sharing' }
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        className="w-full text-left p-6 rounded-[2rem] glass-card flex items-center justify-between group hover:shadow-2xl hover:scale-[1.01] transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-teal/5 flex items-center justify-center text-brand-teal group-hover:bg-brand-dark group-hover:text-brand-frost dark:group-hover:bg-brand-green dark:group-hover:text-brand-dark transition-all">
                                                <item.icon size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tight">{item.label}</h4>
                                                <p className="text-[10px] font-bold text-brand-teal/60 uppercase tracking-tighter">{item.desc}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className="text-brand-teal/30 group-hover:text-brand-teal group-hover:translate-x-2 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="pt-12 border-t border-brand-teal/5">
                            <Button variant="ghost" className="!text-red-500 !text-xs font-black uppercase tracking-[0.2em] px-8">
                                <LogOut size={16} /> Logout of Neighborhood
                            </Button>
                        </section>
                    </div>
                </div>
            </Container>
        </div>
    );
}
