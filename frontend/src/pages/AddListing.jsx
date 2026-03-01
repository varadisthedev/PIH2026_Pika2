import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Camera, Hammer, IndianRupee, MapPin,
    ShieldCheck, Zap, Info, Package, Check, ChevronRight
} from 'lucide-react';
import { useRental } from '../context/RentalContext.jsx';
import Container from '../components/layout/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { CATEGORIES } from '../api/placeholder.js';

import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';

const STEPS = ['Basics', 'Pricing', 'Location', 'Photos', 'Review'];

export default function AddListing() {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: 'Everyday Essentials',
        description: '',
        pricePerDay: '',
        securityDeposit: '',
        location: 'Bandra, Mumbai',
        availability: 'Immediate',
        images: []
    });

    const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }));

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        else navigate(-1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const newListing = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                pricePerDay: Number(formData.pricePerDay),
                securityDeposit: Number(formData.securityDeposit),
                location: { address: formData.location },
                images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800"] // Placeholder image until upload logic is implemented
            };

            await api.post('/products', newListing, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate('/my-listings');
        } catch (err) {
            console.error("Failed to create listing:", err);
            // Optionally set error state to show user
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Basics
                return (
                    <div className="space-y-10 animate-fade-in">
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">What are you listing?</label>
                            <input
                                type="text"
                                placeholder="E.g. Professional Drill Machine, DSLR Camera..."
                                value={formData.title}
                                onChange={e => updateForm({ title: e.target.value })}
                                className="w-full text-2xl sm:text-3xl font-black bg-transparent border-none outline-none text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">Category</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => updateForm({ category: cat })}
                                        className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.category === cat
                                            ? 'bg-brand-dark text-white dark:bg-brand-green dark:text-brand-dark shadow-xl'
                                            : 'glass-card text-brand-teal hover:bg-brand-teal/5'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">Description</label>
                            <textarea
                                placeholder="Tell us about the item, condition, and any special instructions..."
                                value={formData.description}
                                onChange={e => updateForm({ description: e.target.value })}
                                className="w-full p-6 h-40 rounded-3xl glass-card border-none outline-none text-sm font-bold text-brand-dark dark:text-brand-frost placeholder:text-brand-teal/20 resize-none"
                            />
                        </div>
                    </div>
                );
            case 1: // Pricing
                return (
                    <div className="space-y-12 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">Daily Rate (₹)</label>
                                <div className="flex items-center gap-4 p-6 rounded-3xl glass-card border-2 border-transparent focus-within:border-brand-green transition-all">
                                    <IndianRupee size={24} className="text-brand-teal" />
                                    <input
                                        type="number"
                                        placeholder="500"
                                        value={formData.pricePerDay}
                                        onChange={e => updateForm({ pricePerDay: e.target.value })}
                                        className="w-full bg-transparent text-xl font-black text-brand-dark dark:text-brand-frost outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">Security Deposit (₹)</label>
                                <div className="flex items-center gap-4 p-6 rounded-3xl glass-card border-2 border-transparent focus-within:border-brand-green transition-all">
                                    <ShieldCheck size={24} className="text-brand-teal" />
                                    <input
                                        type="number"
                                        placeholder="1000"
                                        value={formData.securityDeposit}
                                        onChange={e => updateForm({ securityDeposit: e.target.value })}
                                        className="w-full bg-transparent text-xl font-black text-brand-dark dark:text-brand-frost outline-none"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-brand-teal/60 px-4 uppercase tracking-tighter">
                                    Fully refundable after item is returned safely.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-brand-green/5 border border-brand-green/10 flex items-start gap-4">
                            <Zap size={24} className="text-brand-green shrink-0" />
                            <div className="space-y-2">
                                <h4 className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter">Smart Pricing Tip</h4>
                                <p className="text-xs font-bold text-brand-teal/70 leading-relaxed uppercase tracking-tight">
                                    Most successful lenders set their security deposit at 2-3x their daily rate.
                                    Items with lower deposits often get booked 40% faster.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Location
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal/60">Pickup Location</label>
                            <div className="flex items-center gap-4 p-6 rounded-[2.5rem] glass-card border-none shadow-xl">
                                <MapPin size={24} className="text-brand-green" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => updateForm({ location: e.target.value })}
                                    className="w-full bg-transparent text-lg font-black text-brand-dark dark:text-brand-frost outline-none"
                                />
                            </div>
                        </div>
                        <div className="h-80 rounded-[2.5rem] glass-card relative overflow-hidden flex items-center justify-center bg-brand-green/5">
                            <div className="relative">
                                <div className="w-20 h-20 bg-brand-green/20 rounded-full animate-ping absolute -inset-0" />
                                <div className="w-20 h-20 bg-brand-green/40 rounded-full flex items-center justify-center relative z-10 border-4 border-white dark:border-brand-dark shadow-2xl">
                                    <MapPin size={32} className="text-brand-dark dark:text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 glass-card text-[10px] font-black uppercase tracking-widest text-brand-teal">
                                Tap map to adjust pin
                            </div>
                        </div>
                    </div>
                );
            case 3: // Photos
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <button className="aspect-square rounded-[2rem] border-4 border-dashed border-brand-teal/10 hover:border-brand-green/30 hover:bg-brand-green/5 transition-all flex flex-col items-center justify-center gap-4 text-brand-teal group">
                                <div className="p-4 rounded-2xl bg-brand-teal/5 group-hover:bg-brand-green/10 transition-colors">
                                    <Camera size={32} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Main Photo</span>
                            </button>
                            {[1, 2, 3, 4, 5].map(i => (
                                <button key={i} className="aspect-square rounded-[2rem] border-4 border-dashed border-brand-teal/5 hover:border-brand-green/30 hover:bg-brand-green/5 transition-all flex items-center justify-center text-brand-teal/20">
                                    <Package size={24} />
                                </button>
                            ))}
                        </div>
                        <div className="p-6 rounded-3xl glass-card bg-brand-teal/5 flex items-start gap-4">
                            <Info size={20} className="text-brand-teal shrink-0" />
                            <p className="text-[10px] font-black text-brand-teal/60 uppercase tracking-tighter leading-relaxed">
                                Good photos show your item in a clear, well-lit space.
                                Include shots of any accessories, original packaging, and serial numbers for trust.
                            </p>
                        </div>
                    </div>
                );
            case 4: // Review
                return (
                    <div className="space-y-8 animate-fade-in">
                        <Card variant="glass" className="!p-8 space-y-8 !rounded-[2.5rem]">
                            <div className="flex gap-6 items-center">
                                <div className="w-24 h-24 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-teal overflow-hidden">
                                    <Camera size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter mb-1">{formData.title || 'Untitled Listing'}</h3>
                                    <Badge variant="info" className="text-[10px] px-2.5 py-1">{formData.category}</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-brand-teal/10">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40 mb-2">Pricing</div>
                                    <div className="text-xl font-black text-brand-dark dark:text-brand-frost">₹{formData.pricePerDay || '0'} <span className="text-xs text-brand-teal/60 uppercase">/ day</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40 mb-2">Location</div>
                                    <div className="text-sm font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter flex items-center gap-2"><MapPin size={14} className="text-brand-green" /> {formData.location}</div>
                                </div>
                            </div>

                            <p className="text-sm font-bold text-brand-teal/70 italic uppercase tracking-tight py-4 border-y border-brand-teal/5">
                                "{formData.description || 'No description provided.'}"
                            </p>
                        </Card>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="pt-28 pb-32 animate-fade-in min-h-screen">
            <Container>
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-16">
                        <div>
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-brand-teal hover:text-brand-dark dark:text-brand-aqua dark:hover:text-brand-frost transition-all group mb-4"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                {currentStep === 0 ? 'Exit' : 'Step ' + currentStep}
                            </button>
                            <h2 className="text-4xl font-black text-brand-dark dark:text-brand-frost tracking-tighter">
                                {STEPS[currentStep]}
                            </h2>
                        </div>

                        {/* Progress Stepper */}
                        <div className="flex gap-2">
                            {STEPS.map((step, i) => (
                                <div
                                    key={step}
                                    className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-brand-green w-10 shadow-lg shadow-brand-green/20' : 'bg-brand-teal/10'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="min-h-[400px]">
                        {renderStepContent()}
                    </div>

                    {/* Actions */}
                    <div className="mt-20 flex gap-4 pt-8 border-t border-brand-teal/5">
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1 !rounded-[2rem] shadow-2xl shadow-brand-green/20 py-6"
                            onClick={handleNext}
                            disabled={currentStep === 0 && !formData.title}
                        >
                            {currentStep === STEPS.length - 1 ? 'Publish Listing' : 'Continue'}
                            <ChevronRight size={20} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
}
