import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icons (Vite asset issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom green marker for the listing
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function Recenter({ lat, lng, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], zoom);
    }, [lat, lng, zoom, map]);
    return null;
}

/**
 * MapView — renders a Leaflet/OpenStreetMap map with a pin.
 *
 * Props:
 *   lat, lng   — coordinates of the item (required)
 *   title      — popup label
 *   height     — CSS height string (default '300px')
 *   radiusKm   — optional circle radius in km (for browse radius display)
 *   zoom       — initial zoom level (default 14)
 */
export default function MapView({
    lat, lng,
    title = 'Item Location',
    height = '300px',
    radiusKm = null,
    zoom = 14,
}) {
    if (!lat || !lng) return null;

    return (
        <div
            style={{ height, borderRadius: '1rem', overflow: 'hidden', zIndex: 0 }}
            className="border border-[#99d19c]/30 dark:border-[#79c7c5]/15 shadow-lg"
        >
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                attributionControl={true}
            >
                <TileLayer
                    key="osm-tiles"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />
                <Recenter key="recenter" lat={lat} lng={lng} zoom={zoom} />
                <Marker key="item-marker" position={[lat, lng]} icon={greenIcon}>
                    <Popup>
                        <strong>{title}</strong>
                    </Popup>
                </Marker>
                {radiusKm != null && (
                    <Circle
                        key="radius-circle"
                        center={[lat, lng]}
                        radius={radiusKm * 1000}
                        pathOptions={{
                            color: '#73ab84',
                            fillColor: '#99d19c',
                            fillOpacity: 0.12,
                            weight: 2,
                            dashArray: '6 4',
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}
