import { useEffect, useRef } from 'react';
import { getDistance } from 'geolib';

interface LatLng { lat: number; lng: number; }

const ANIMATION_DURATION = 3000; // ms
const DEADZONE_METERS = 2; // ignore GPS updates smaller than this

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

        // Deadzone — ignore tiny movements to prevent jitter when standing still
        const distance = getDistance(
            { latitude: oldLat, longitude: oldLng },
            { latitude: newLat, longitude: newLng }
        );
        if (distance < DEADZONE_METERS) return;

        const startTime = performance.now();

        // Cancel any in-progress animation before starting a new one
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);

        // Animate from old position to new position over ANIMATION_DURATION ms
        const animate = (now: number) => {
            const linear = Math.min((now - startTime) / ANIMATION_DURATION, 1);
            // Smoothstep easing — accelerates out, decelerates in
            const progress = linear * linear * (3 - 2 * linear);
            markerRef.current!.position = {
                lat: oldLat + (newLat - oldLat) * progress,
                lng: oldLng + (newLng - oldLng) * progress,
            };
            if (linear < 1) rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);
    }, [rawPosition]);

    // Cleanup on unmount — cancel any running animation and remove marker from map
    useEffect(() => {
        return () => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current);
            if (markerRef.current) markerRef.current.map = null;
        };
    }, []);
}
