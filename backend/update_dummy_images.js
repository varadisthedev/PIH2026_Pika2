import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const FALLBACK_IMAGES = {
    'Creative & Media Gear': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80',
    'Professional Equipment': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=700&q=80',
    'Outdoor & Adventure': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=700&q=80',
    'Mobility & Transport': 'https://images.unsplash.com/photo-1597404294360-feed936f67f8?auto=format&fit=crop&w=700&q=80',
    'Event & Party Gear': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=700&q=80',
    'Fitness & Sports': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=80',
    'Tech & Gadgets': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80',
    'Home & Living': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80',
    'Everyday Essentials': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80',
    'Study & Work Setup': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=700&q=80',
};

const KEYWORD_IMAGES = [
    { key: 'camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80' },
    { key: 'drill', url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=700&q=80' },
    { key: 'tent', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=700&q=80' },
    { key: 'scooter', url: 'https://images.unsplash.com/photo-1597404294360-feed936f67f8?auto=format&fit=crop&w=700&q=80' },
    { key: 'bike', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=80' },
    { key: 'drone', url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=700&q=80' },
    { key: 'macbook', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80' },
    { key: 'laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80' },
    { key: 'speaker', url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=700&q=80' },
    { key: 'matress', url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=700&q=80' },
    { key: 'mattress', url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=700&q=80' },
];

async function run() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        const productsCollection = mongoose.connection.collection('products');

        const products = await productsCollection.find({}).toArray();
        console.log(`📦 Found ${products.length} products to check.`);

        for (const p of products) {
            let selectedUrl = null;

            // 1. Try Keyword match on title
            const lowerTitle = p.title.toLowerCase();
            for (const item of KEYWORD_IMAGES) {
                if (lowerTitle.includes(item.key)) {
                    selectedUrl = item.url;
                    break;
                }
            }

            // 2. Try Category match
            if (!selectedUrl && p.category && FALLBACK_IMAGES[p.category]) {
                selectedUrl = FALLBACK_IMAGES[p.category];
            }

            // 3. Absolute Fallback
            if (!selectedUrl) {
                selectedUrl = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80';
            }

            // Update product
            await productsCollection.updateOne(
                { _id: p._id },
                { $set: { images: [selectedUrl] } }
            );
            console.log(`✅ Updated: "${p.title}" with Unsplash image.`);
        }

        console.log('✨ All products updated successfully with dummy images.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating images:', err);
        process.exit(1);
    }
}

run();
