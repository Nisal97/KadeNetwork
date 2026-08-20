'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    APIProvider,
    Map,
    Marker,
    useMap,
    useMapsLibrary,
} from '@vis.gl/react-google-maps';

/**
 * Props for the LocationPickerModal component.
 */
interface LocationPickerModalProps {
    /** Controls modal visibility */
    isOpen: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Current selected coordinates (if already pinned) */
    initialCoordinates: { lat: number; lng: number } | null;
    /** Current store address string (for initial reverse geocoding or display) */
    initialAddress?: string;
    /** Callback fired when the merchant confirms their pinned location */
    onConfirm: (data: { lat: number; lng: number; address: string }) => void;
}

// Default Map Center: Unity Plaza / Colombo 04 area (6.8931, 79.8562)
const DEFAULT_CENTER = { lat: 6.8931, lng: 79.8562 };

/**
 * MapController Component
 * ----------------------
 * Internal controller rendered inside `<APIProvider>` and `<Map>`.
 * Handles:
 * 1. Google Places Autocomplete search input.
 * 2. Geocoder (Reverse Geocoding coordinates into human-readable addresses).
 * 3. Map interactions (clicking the map or dragging the pin).
 * 4. Device GPS geolocation jump ("My Location" button).
 */
function MapController({
    center,
    markerPos,
    onMarkerChange,
    onAddressDetected,
}: {
    center: { lat: number; lng: number };
    markerPos: { lat: number; lng: number };
    onMarkerChange: (pos: { lat: number; lng: number }) => void;
    onAddressDetected: (addr: string) => void;
}) {
    const map = useMap();
    // Load Google Maps JavaScript API libraries dynamically
    const placesLib = useMapsLibrary('places');
    const geocodingLib = useMapsLibrary('geocoding');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Initialize Geocoder service instance
    const geocoder = useMemo(() => {
        return geocodingLib ? new geocodingLib.Geocoder() : null;
    }, [geocodingLib]);

    /**
     * Reverse Geocodes a lat/lng coordinate pair into a street address string.
     */
    const reverseGeocode = (lat: number, lng: number) => {
        if (!geocoder) return;
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                onAddressDetected(results[0].formatted_address);
            }
        });
    };

    /**
     * Google Places Autocomplete Initialization
     * Binds the search input to Google Places API, restricted to Sri Lanka ('lk').
     */
    useEffect(() => {
        if (!placesLib || !inputRef.current) return;

        const autocomplete = new placesLib.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'lk' }, // Restrict place search to Sri Lanka
            fields: ['geometry', 'name', 'formatted_address'],
        });

        // Listen for place selection from suggestions list
        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const newPos = { lat, lng };
                
                // Update marker position and center map on the selected place
                onMarkerChange(newPos);
                map?.panTo(newPos);
                map?.setZoom(17);
                
                if (place.formatted_address) {
                    onAddressDetected(place.formatted_address);
                }
            }
        });

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [placesLib, map, onMarkerChange, onAddressDetected]);

    /**
     * Map Click Handler
     * Moves the pin directly to wherever the user clicks on the map.
     */
    const handleMapClick = (e: { detail: { latLng: google.maps.LatLngLiteral | null } }) => {
        if (e.detail?.latLng) {
            const lat = e.detail.latLng.lat;
            const lng = e.detail.latLng.lng;
            onMarkerChange({ lat, lng });
            reverseGeocode(lat, lng);
        }
    };

    /**
     * Marker Drag Handler
     * Fires when the user finishes dragging the red pin to a precise store booth/entrance.
     */
    const handleDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onMarkerChange({ lat, lng });
            reverseGeocode(lat, lng);
        }
    };

    /**
     * "My Location" Button Handler
     * Uses device GPS (HTML5 Geolocation) to jump the map directly to the current spot.
     */
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const newPos = { lat, lng };
                onMarkerChange(newPos);
                map?.panTo(newPos);
                map?.setZoom(17);
                reverseGeocode(lat, lng);
            },
            (err) => {
                alert(`Could not fetch location: ${err.message}`);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="relative w-full h-[380px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            {/* =========================================================================
                SEARCH & QUICK-LOCATION OVERLAY BAR
                ========================================================================= */}
            <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
                {/* Places Autocomplete Input */}
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                        🔍
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search landmark, mall, or street in Sri Lanka (e.g. Unity Plaza)..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 text-sm font-medium rounded-lg shadow-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                </div>

                {/* Device GPS Quick Jump Button */}
                <button
                    type="button"
                    onClick={handleLocateMe}
                    title="Find My Current Location"
                    className="bg-white hover:bg-slate-50 text-indigo-600 font-semibold px-3.5 py-2.5 rounded-lg shadow-lg border border-slate-200 flex items-center gap-1.5 text-xs whitespace-nowrap transition cursor-pointer"
                >
                    <span>🎯</span>
                    <span className="hidden sm:inline">My Location</span>
                </button>
            </div>

            {/* =========================================================================
                GOOGLE MAP INSTANCE
                ========================================================================= */}
            <Map
                defaultCenter={center}
                defaultZoom={15}
                gestureHandling="greedy"
                disableDefaultUI={false}
                zoomControl={true}
                streetViewControl={false}
                mapTypeControl={false}
                onClick={handleMapClick}
                className="w-full h-full"
            >
                {/* Draggable Marker Pin */}
                <Marker
                    position={markerPos}
                    draggable={true}
                    onDragEnd={handleDragEnd}
                    title="Drag me to your exact shop entrance!"
                />
            </Map>

            {/* User instruction badge */}
            <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md pointer-events-none">
                💡 Drag the red pin or click anywhere on the map to adjust
            </div>
        </div>
    );
}

/**
 * LocationPickerContent Component
 * ------------------------------
 * Manages modal state, coordinates preview, API key verification, and action buttons.
 */
function LocationPickerContent({
    onClose,
    initialCoordinates,
    initialAddress = '',
    onConfirm,
}: Omit<LocationPickerModalProps, 'isOpen'>) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    // Active pinned location state
    const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number }>(
        initialCoordinates || DEFAULT_CENTER
    );
    // Active reverse-geocoded address state
    const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress);

    /**
     * Confirms the selected location and sends it back to the parent registration form.
     */
    const handleConfirm = () => {
        onConfirm({
            lat: selectedPos.lat,
            lng: selectedPos.lng,
            address: selectedAddress,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[95vh] overflow-y-auto">
                {/* Modal Title & Close Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span>📍</span> Pinpoint Shop GPS Location
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Search your complex or drag the marker to your exact store entrance.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer text-sm font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* =========================================================================
                    API KEY NOTICE OR MAP CANVAS
                    Displays helpful setup instructions if API key is not yet configured.
                    ========================================================================= */}
                {!apiKey ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-sm text-amber-900">
                            <span>⚠️</span> Google Maps API Key Not Detected in .env.local
                        </div>
                        <p>
                            Please add your Google Maps API key to your <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env.local</code> file:
                        </p>
                        <pre className="bg-amber-100/70 p-2 rounded text-[11px] font-mono text-amber-950">
                            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
                        </pre>
                        <p className="text-amber-700">
                            Make sure <strong>Maps JavaScript API</strong>, <strong>Places API</strong>, and <strong>Geocoding API</strong> are enabled in Google Cloud Console.
                        </p>
                    </div>
                ) : (
                    /* Google Maps API Provider */
                    <APIProvider apiKey={apiKey} libraries={['places', 'geocoding']}>
                        <MapController
                            center={selectedPos}
                            markerPos={selectedPos}
                            onMarkerChange={setSelectedPos}
                            onAddressDetected={setSelectedAddress}
                        />
                    </APIProvider>
                )}

                {/* =========================================================================
                    COORDINATES & ADDRESS PREVIEW CARD
                    ========================================================================= */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase">Selected Coordinates</span>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-800 font-mono text-xs px-2.5 py-1 rounded-md font-semibold">
                                Lat: {selectedPos.lat.toFixed(6)}
                            </span>
                            <span className="bg-indigo-100 text-indigo-800 font-mono text-xs px-2.5 py-1 rounded-md font-semibold">
                                Lng: {selectedPos.lng.toFixed(6)}
                            </span>
                        </div>
                    </div>

                    {selectedAddress && (
                        <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                            <span className="font-semibold text-slate-700">Detected Address: </span>
                            {selectedAddress}
                        </div>
                    )}
                </div>

                {/* =========================================================================
                    MODAL FOOTER ACTIONS
                    ========================================================================= */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>✓</span> Confirm Shop Location
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * LocationPickerModal (Default Export)
 * ------------------------------------
 * Conditionally mounts `<LocationPickerContent>` only when `isOpen` is true.
 * This guarantees clean state initialization without unnecessary cascading re-renders.
 */
export default function LocationPickerModal({
    isOpen,
    onClose,
    initialCoordinates,
    initialAddress = '',
    onConfirm,
}: LocationPickerModalProps) {
    if (!isOpen) return null;

    return (
        <LocationPickerContent
            onClose={onClose}
            initialCoordinates={initialCoordinates}
            initialAddress={initialAddress}
            onConfirm={onConfirm}
        />
    );
}
