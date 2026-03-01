const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.useDb('test'); // Or whatever the DB name is, Mongoose connects to the one in URI
    const products = await mongoose.connection.collection('products').find().sort({ _id: -1 }).limit(5).toArray();
    console.log(JSON.stringify(products.map(p => ({ title: p.title, images: p.images, image: p.image })), null, 2));
    process.exit(0);
}
run();
