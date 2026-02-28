import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, IndianRupee, ImageOff } from 'lucide-react';
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
        availability,
        available,          // placeholder compat
    } = item;

    const itemId = _id || id;
    const imgSrc = (images && images[0]) || image;
    const isAvailable = availability ?? available ?? true;
    const displayAddress = typeof location === 'string' ? location : (location?.address || null);
    const displayDistance = distanceKm ?? distance ?? null;

    const [imgError, setImgError] = useState(false);

    return (
        <Link to={`/item/${itemId}`} className="block group">
            <Card variant="glass" hover className="overflow-hidden h-full">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#99d19c]/30 to-[#79c7c5]/20 dark:from-[#99d19c]/10 dark:to-[#79c7c5]/8">
                    {imgError || !imgSrc ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#73ab84] dark:text-[#79c7c5]">
                            <ImageOff size={32} className="opacity-40" />
                            <span className="text-xs font-semibold opacity-60">{category}</span>
                        </div>
                    ) : (
                        <img
                            src={imgSrc}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={() => setImgError(true)}
                        />
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                        <Badge variant="info" className="shadow-sm backdrop-blur-sm">
                            {category}
                        </Badge>
                    </div>

                    {/* Availability dot */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
                        style={{
                            backgroundColor: isAvailable ? 'rgba(153, 209, 156, 0.85)' : 'rgba(250, 160, 160, 0.85)',
                            color: isAvailable ? '#1a4d2a' : '#7f1d1d',
                        }}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-red-500'}`} />
                        {isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                </div>


                {/* Content */}
                <div className="p-5 flex flex-col gap-3">
                    <div>
                        {/* Title */}
                        <h3 className="font-bold text-brand-dark dark:text-brand-frost text-base line-clamp-1 group-hover:text-brand-teal dark:group-hover:text-brand-green transition-colors duration-300">
                            {title}
                        </h3>

                        {/* Location — only show if present */}
                        {(displayAddress || displayDistance != null) && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-brand-teal dark:text-brand-aqua mt-1">
                            <MapPin size={14} />
                            <span className="line-clamp-1">{displayAddress || 'Nearby'}</span>
                            {displayDistance != null && <span className="ml-auto shrink-0 opacity-60">{displayDistance} km</span>}
                        </div>
                        )}
                    </div>

                    {/* Price + Rating Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-teal/10 dark:border-brand-aqua/10">
                        <div className="flex items-baseline gap-0.5">
                            <IndianRupee size={16} className="text-brand-dark dark:text-brand-frost" />
                            <span className="text-xl font-black text-brand-dark dark:text-brand-frost">
                                {pricePerDay.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-brand-teal dark:text-brand-aqua font-bold ml-1">/ day</span>
                        </div>

                        {rating ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-green/10 dark:bg-brand-green/5 text-xs font-black text-brand-teal dark:text-brand-green">
                            <Star size={14} className="fill-brand-teal dark:fill-brand-green" />
                            <span>{rating}</span>
                        </div>
                        ) : null}
                    </div>
                </div>
            </Card>
        </Link>
    );
}
