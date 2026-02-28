import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ItemCard } from './components/ItemCard';

const MOCK_DATA = [
  { id: 1, title: "Canon EOS R5", price: 1500, distance: 0.5, category: "Photography", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500" },
  { id: 2, title: "Drill & Tool Kit", price: 200, distance: 1.2, category: "Maintenance", image: "https://images.unsplash.com/photo-1504148455328-497c5efdf13a?w=500" },
  { id: 3, title: "Camping Tent", price: 400, distance: 3.0, category: "Outdoor", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500" },
  { id: 4, title: "Electric Scooter", price: 600, distance: 0.9, category: "Transport", image: "https://images.unsplash.com/photo-1558981403-c5f91dbbe9ad?w=500" },
  { id: 5, title: "Party Speaker", price: 750, distance: 2.5, category: "Events", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500" },
  { id: 6, title: "Mountain Bike", price: 350, distance: 4.1, category: "Sport", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500" },
];

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = MOCK_DATA.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      {/* Search Header */}
      <header className="bg-white border-b border-slate-100 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-6">Rent items from people around you.</h1>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="What do you need today?"
              className="w-full p-4 pl-6 bg-slate-100 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all shadow-inner"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-4 top-4 text-slate-400 font-bold">Search</div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <ItemCard key={item.id} {...item} />
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400 font-medium">
              No items found matching "{searchTerm}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;