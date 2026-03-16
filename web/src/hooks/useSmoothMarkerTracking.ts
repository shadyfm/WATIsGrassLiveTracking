import { useEffect, useRef } from 'react';

interface LatLng { lat: number; lng: number; }

const ANIMATION_DURATION = 1000; // ms

export default function useSmoothMarkerTracking(
    googleMap: any,
    Markers: any,
    rawPosition: LatLng | null,
    dot: HTMLElement
) {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        if (!googleMap || !Markers || !rawPosition) return;

        // First position — create the marker, no animation needed
        if (!markerRef.current) {
            markerRef.current = new (Markers as any).AdvancedMarkerElement({
                map: googleMap,
                position: rawPosition,
                content: dot,
            });
            return;
        }

        // Read current marker position as the animation start point
        const current = markerRef.current.position as LatLng;
        const oldLat = current?.lat ?? rawPosition.lat;
        const oldLng = current?.lng ?? rawPosition.lng;
        const newLat = rawPosition.lat;
        const newLng = rawPosition.lng;
        const startTime = performance.now();

        // Cancel any in-progress animation before starting a new one
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);

        // Animate from old position to new position over ANIMATION_DURATION ms
        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / ANIMATION_DURATION, 1);
            markerRef.current!.position = {
                lat: oldLat + (newLat - oldLat) * progress,
                lng: oldLng + (newLng - oldLng) * progress,
            };
            if (progress < 1) rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);
    }, [rawPosition]);
}
