import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, IndianRupee, ImageOff, Heart, ShieldCheck } from 'lucide-react';
import { useRental } from '../../context/RentalContext.jsx';
import getImageUrl from '../../utils/imageUrl.js';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export default function ItemCard({ item }) {
    const {
        _id,
        id,                 // placeholder compat
        title,
        images,
        image,              // placeholder compat
        pricePerDay,
        category,
        location,           // MongoDB: { address, lat, lng }
        distance,           // placeholder compat
        distanceKm,         // from backend geo-sort
        rating,
        reviewCount,
        available,
        availability,       // backend field
        isVerified,         // backend field
        verified,           // placeholder compat
    } = item;

    const itemId = _id || id;
    const imgSrc = getImageUrl((images && images[0]) || image);
    const isAvailable = availability ?? available ?? true;
    const displayAddress = typeof location === 'string' ? location : (location?.address || 'Local Neighborhood');
    const displayDistance = distanceKm ?? distance ?? null;
    const hasVerified = isVerified || verified;

    const { wishlist, toggleWishlist } = useRental();
    const isWishlisted = wishlist.includes(itemId);
    const [imgError, setImgError] = useState(false);

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(itemId);
    };

    return (
        <Link to={`/item/${itemId}`} className="block group h-full">
            <Card variant="glass" hover className="overflow-hidden h-full flex flex-col">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-brand-green/10 to-brand-teal/10">
                    {imgError || !imgSrc ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-brand-teal/40">
                            <ImageOff size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{category}</span>
                        </div>
                    ) : (
                        <img
                            src={imgSrc}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                            onError={() => setImgError(true)}
                        />
                    )}

                    {/* Tags Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <div className="flex gap-2">
                            <Badge variant="info" className="!bg-white/90 !text-brand-dark shadow-sm uppercase tracking-tighter text-[10px] py-1 px-2.5">
                                {category}
                            </Badge>
                            {hasVerified && (
                                <div className="flex items-center gap-1 bg-brand-green text-brand-dark px-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                                    <ShieldCheck size={10} /> Verified
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Availability Dot */}
                    <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg"
                        style={{
                            backgroundColor: isAvailable ? 'rgba(79, 124, 172, 0.9)' : 'rgba(250, 160, 160, 0.9)',
                            color: isAvailable ? '#162521' : '#7f1d1d',
                        }}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-red-500'}`} />
                        {isAvailable ? 'Available' : 'Rented'}
                    </div>

                    {/* Wishlist Button */}
                    <button
                        onClick={handleWishlist}
                        className={`absolute top-3 left-3 p-2 rounded-xl transition-all duration-300 pointer-events-auto ${isWishlisted ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-brand-teal hover:bg-white'}`}
                    >
                        <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex-grow">
                        <h3 className="font-black text-brand-dark dark:text-brand-frost text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-brand-green transition-colors mb-2">
                            {title}
                        </h3>

                        {/* Location & Distance */}
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            <MapPin size={12} className="text-brand-green" />
                            <span className="line-clamp-1">{displayAddress}</span>
                            {displayDistance && (
                                <span className="ml-auto shrink-0 bg-brand-teal/5 px-2 py-0.5 rounded-md">• {displayDistance} km</span>
                            )}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-5 pt-4 border-t border-brand-teal/5 flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">Per Day</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-brand-dark dark:text-brand-frost leading-none">
                                    ₹{pricePerDay?.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-teal/5 text-[11px] font-black text-brand-dark dark:text-brand-frost">
                            <Star size={14} className="fill-brand-green text-brand-green" />
                            <span>{rating || '5.0'}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
