import React, { useState } from 'react';
import { Place, PlaceCategory, PLACE_CATEGORIES, SettingsState } from '../types';
import { Compass, MapPin, Star, Fuel, ExternalLink, Bike, UtensilsCrossed, ShieldAlert, Zap, Navigation, Store, Plus, CheckCircle2 } from 'lucide-react';
import { NasaWidget } from './NasaWidget';

interface ExploreTabProps {
  places: Place[];
  selectedCategory: PlaceCategory;
  onSelectCategory: (category: PlaceCategory) => void;
  onSelectDestination: (point: Place['point'], name: string) => void;
  settings: SettingsState;
}

export const ExploreTab: React.FC<ExploreTabProps> = ({
  places,
  selectedCategory,
  onSelectCategory,
  onSelectDestination,
  settings
}) => {
  const [riderModeActive, setRiderModeActive] = useState<boolean>(true);
  const [activePartnerFilter, setActivePartnerFilter] = useState<'ALL' | 'MAXIM' | 'FOODPANDA' | 'GRAB'>('ALL');
  const [showBusinessModal, setShowBusinessModal] = useState<boolean>(false);
  const [businessSubmitted, setBusinessSubmitted] = useState<boolean>(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('RESTAURANT');
  const [newShopPromo, setNewShopPromo] = useState('');

  // Filter places if partner filter selected
  const filteredPlaces = places.filter((p) => {
    if (activePartnerFilter === 'MAXIM') {
      return (p.extra || '').toLowerCase().includes('maxim') || p.name.toLowerCase().includes('maxim');
    }
    if (activePartnerFilter === 'FOODPANDA') {
      return (p.extra || '').toLowerCase().includes('foodpanda') || (p.extra || '').toLowerCase().includes('panda');
    }
    if (activePartnerFilter === 'GRAB') {
      return (p.extra || '').toLowerCase().includes('grab') || p.name.toLowerCase().includes('grab');
    }
    return true;
  });

  const handleRegisterBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    setBusinessSubmitted(true);
    setTimeout(() => {
      setShowBusinessModal(false);
      setBusinessSubmitted(false);
      setNewShopName('');
      setNewShopPromo('');
    }, 2000);
  };

  return (
    <div id="explore-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Business Owner Quick Register Banner */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/50 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl shrink-0">
            🏪
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-amber-300">Peniaga & Kedai Local (Perniagaan)</h3>
            <p className="text-[11px] text-slate-300">Daftar lokasi kedai & beri diskaun untuk pemandu & rider di MapAi!</p>
          </div>
        </div>
        <button
          onClick={() => setShowBusinessModal(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Daftar Kedai</span>
        </button>
      </div>

      {/* Business Registration Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/60 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Daftar Perniagaan & POI Kedai Local</h2>
              </div>
              <button
                onClick={() => setShowBusinessModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {businessSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-white">Perniagaan Berjaya Didaftarkan!</h3>
                <p className="text-xs text-slate-300">
                  Lokasi kedai anda kini aktif di radar MapAi untuk pemandu, Maxim, Foodpanda & Grab riders.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterBusiness} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nama Perniagaan / Kedai *</label>
                  <input
                    type="text"
                    required
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="Contoh: Restoran Selera Kampung / Bengkel Tayar Auto24"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Kategori Perniagaan</label>
                  <select
                    value={newShopCategory}
                    onChange={(e) => setNewShopCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="RESTAURANT">🍔 Makanan & Minuman / Restoran</option>
                    <option value="FUEL">⛽ Stesen Minyak & Kedai Runcit</option>
                    <option value="AUTOMOTIVE">🔧 Bengkel, Tayar & Service Kereta</option>
                    <option value="SHOPPING">🛒 Pasar Raya & Kedai Runcit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Promosi / Tawaran Diskaun Khas</label>
                  <textarea
                    rows={2}
                    value={newShopPromo}
                    onChange={(e) => setNewShopPromo(e.target.value)}
                    placeholder="Contoh: Diskaun 15% untuk pemandu MapAi & Rider Foodpanda/Grab!"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBusinessModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg"
                  >
                    Simpan & Aktifkan Kedai 🚀
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Maxim, Foodpanda & Grab Partner Feature Header Card */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-emerald-950/80 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-emerald-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl">
                🚖
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400 flex items-center gap-1">
                <span>MAXIM • FOODPANDA • GRAB</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-base font-extrabold text-white">All Express Delivery & Taxi Live</h2>
            </div>
          </div>

          <button
            onClick={() => setRiderModeActive(!riderModeActive)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
              riderModeActive
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>{riderModeActive ? 'Rider Fast Lane ONLINE 🟢' : 'Standard Mode'}</span>
          </button>
        </div>

        {/* Maxim, Grab & Foodpanda Direct Partner Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Maxim Tile */}
          <div className="bg-amber-950/40 border border-amber-500/40 hover:border-amber-500/80 rounded-2xl p-3.5 space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <span className="text-base">🚖</span>
                <span>MAXIM</span>
              </div>
              <span className="text-[9px] bg-amber-900/90 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                ONLINE 🟢
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80 line-clamp-2">
              Maxim Bike, Taxi & Cargo delivery dispatch line.
            </p>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setActivePartnerFilter(activePartnerFilter === 'MAXIM' ? 'ALL' : 'MAXIM')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] border transition-all ${
                  activePartnerFilter === 'MAXIM'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                }`}
              >
                {activePartnerFilter === 'MAXIM' ? '✓ Showing Maxim' : 'Maxim Hubs'}
              </button>
              <a
                href="https://taximaxim.com"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500/40 font-bold text-[11px] flex items-center justify-center"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Foodpanda Tile */}
          <div className="bg-pink-950/40 border border-pink-500/40 hover:border-pink-500/80 rounded-2xl p-3.5 space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-pink-300">
                <span className="text-base">🐼</span>
                <span>foodpanda</span>
              </div>
              <span className="text-[9px] bg-pink-900/90 text-pink-200 px-1.5 py-0.5 rounded font-mono font-bold">
                ONLINE 🟢
              </span>
            </div>
            <p className="text-[11px] text-pink-200/80 line-clamp-2">
              15-min groceries & restaurant pickups with dedicated Pink Rider bays.
            </p>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setActivePartnerFilter(activePartnerFilter === 'FOODPANDA' ? 'ALL' : 'FOODPANDA')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] border transition-all ${
                  activePartnerFilter === 'FOODPANDA'
                    ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                    : 'bg-pink-950/80 text-pink-300 border-pink-800/60 hover:bg-pink-900/60'
                }`}
              >
                {activePartnerFilter === 'FOODPANDA' ? '✓ Showing Panda' : 'Panda Hubs'}
              </button>
              <a
                href="https://www.foodpanda.com"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 border border-pink-500/40 font-bold text-[11px] flex items-center justify-center"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Grab / GrabFood Tile */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-500/80 rounded-2xl p-3.5 space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                <span className="text-base">💚</span>
                <span>GrabFood</span>
              </div>
              <span className="text-[9px] bg-emerald-900/90 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                ONLINE 🟢
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 line-clamp-2">
              GrabKitchen multi-brand food halls, GrabMart & priority merchant lanes.
            </p>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setActivePartnerFilter(activePartnerFilter === 'GRAB' ? 'ALL' : 'GRAB')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] border transition-all ${
                  activePartnerFilter === 'GRAB'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                }`}
              >
                {activePartnerFilter === 'GRAB' ? '✓ Showing Grab' : 'Grab Merchants'}
              </button>
              <a
                href="https://www.grab.com"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 font-bold text-[11px] flex items-center justify-center"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* NASA API Satellite & Hazard Widget */}
      <NasaWidget />

      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            <span>Nearby Places & Merchants</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover Foodpanda, GrabFood, gas stations & emergency POIs
          </p>
        </div>
      </div>

      {/* Categories Horizontal Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PLACE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.key === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 border transition-all ${
                isSelected
                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black scale-105 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Places Grid / List */}
      <div className="space-y-3">
        {filteredPlaces.map((place) => {
          const catObj = PLACE_CATEGORIES.find((c) => c.key === place.category) || { emoji: '📍', label: place.category };
          const distKm = (place.distanceMeters / 1000).toFixed(1);
          const isPanda = (place.extra || '').toLowerCase().includes('foodpanda') || (place.extra || '').toLowerCase().includes('panda');
          const isGrab = (place.extra || '').toLowerCase().includes('grab') || place.name.toLowerCase().includes('grab');

          return (
            <div
              key={place.id}
              className={`bg-slate-900 border hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg transition-all ${
                isPanda
                  ? 'border-pink-500/40 bg-gradient-to-r from-pink-950/20 to-slate-900'
                  : isGrab
                  ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/80 text-xl flex items-center justify-center shrink-0 shadow-inner">
                  {isPanda ? '🐼' : isGrab ? '💚' : catObj.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white truncate">{place.name}</h3>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {place.rating}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {distKm} km away
                    </span>
                    <span>•</span>
                    <span className={place.isOpen ? 'text-emerald-400 font-semibold' : 'text-red-400'}>
                      {place.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>

                  {place.fuelPrice && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 font-mono text-xs font-bold">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>{place.fuelPrice}</span>
                      {place.extra && <span className="text-[10px] text-emerald-400 font-normal">({place.extra})</span>}
                    </div>
                  )}

                  {!place.fuelPrice && place.extra && (
                    <p className="text-xs text-slate-300 mt-1 font-medium">{place.extra}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onSelectDestination(place.point, place.name)}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Navigate</span>
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

