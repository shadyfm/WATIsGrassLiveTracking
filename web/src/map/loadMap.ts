import { useEffect, useState } from "react";
import useGoogleMapsLibrary from "../hooks/useGoogleMapsLibrary";

export default function useLoadMap() {
    const [googleMap, setGoogleMap] = useState<any>(null);

    useEffect(() => {
        // Load the Google Maps script
        (g => { var h: Promise<unknown>, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
            key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            v: "weekly",
        });

        // Wait for Google Maps to be ready, then load the maps library and create the map
        const initializeMap = async () => {
            try {
                // Wait for google.maps to be available
                while (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                console.log('Google Maps API loaded, importing maps library...');
                const mapsLib = await google.maps.importLibrary("maps");
                
                const mapElement = document.getElementById("map") as HTMLElement;
                if (!mapElement) {
                    console.error('Map element not found');
                    return;
                }

                const map = new mapsLib.Map(mapElement, {
                    center: { lat: 43.4718, lng: -80.543 },
                    zoom: 16,
                    mapId: 'map',
                    gestureHandling: "greedy",
                    mapTypeControl: false,
                    streetViewControl: false,
                    minZoom: 14,
                    restriction: {
                        latLngBounds: {
                            north: 43.6,
                            south: 43.3,
                            east: -80.3,
                            west: -80.7
                        }
                    }
                });

                console.log('Map created successfully');
                setGoogleMap(map);
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initializeMap();
    }, []);
    
    return { googleMap, setGoogleMap };
}
