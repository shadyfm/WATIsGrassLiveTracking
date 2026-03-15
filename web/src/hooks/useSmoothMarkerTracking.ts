import { useEffect, useRef } from 'react';

interface LatLng { lat: number; lng: number; }
interface TimedLatLng extends LatLng { time: number; }

// How much weight to give new GPS readings vs the previous smoothed position.
// 1.0 = use raw GPS (no filtering). 0.0 = ignore new data entirely.
// 0.7 means: 70% new reading, 30% previous — filters jitter while staying responsive.
const SMOOTHING_ALPHA = 0.7;

// Controls how fast the rendered position catches up to the predicted position each frame.
// This is a time constant in ms — lower = snappier correction, higher = floatier.
// At 150ms tau: 63% corrected after 150ms, 95% after ~450ms.
const CORRECTION_TAU = 150;

// If no GPS update arrives within this window, treat velocity as zero (assume stopped).
// Prevents the marker from drifting off indefinitely when GPS goes silent.
const MAX_VELOCITY_AGE_MS = 4000;

/**
 * Moves a Google Maps AdvancedMarkerElement smoothly using dead reckoning + noise filtering.
 *
 * Instead of snapping or simple lerping between GPS updates, this hook:
 *   1. Filters GPS jitter with exponential smoothing
 *   2. Calculates velocity from the last two smoothed positions
 *   3. Runs a continuous rAF loop that predicts position via dead reckoning each frame
 *   4. Smoothly blends the rendered position toward the prediction (no hard jumps)
 */
export default function useSmoothMarkerTracking(
    googleMap: any,
    Markers: any,
    rawPosition: LatLng | null,
    dot: HTMLElement
) {
    // All state lives in refs — position updates should NOT trigger re-renders
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const renderPos = useRef<LatLng | null>(null);         // what the marker is currently showing
    const confirmedPos = useRef<TimedLatLng | null>(null); // last smoothed GPS fix
    const velocity = useRef<LatLng>({ lat: 0, lng: 0 });  // degrees/ms, derived from last two fixes
    const rafId = useRef<number | null>(null);
    const lastFrameTime = useRef<number | null>(null);

    // ── Continuous animation loop ─────────────────────────────────────────────
    // Starts once the map is ready. Runs every frame regardless of GPS update rate.
    useEffect(() => {
        if (!googleMap || !Markers) return;

        const loop = (now: number) => {
            rafId.current = requestAnimationFrame(loop);

            const marker = markerRef.current;
            const confirmed = confirmedPos.current;
            const render = renderPos.current;
            if (!marker || !confirmed || !render) return;

            // dt: time since last frame in ms (fallback to 16ms on first frame)
            const dt = lastFrameTime.current !== null ? now - lastFrameTime.current : 16;
            lastFrameTime.current = now;

            // Dead reckoning — project forward from last confirmed position using velocity.
            // If GPS has gone silent for too long, fall back to zero velocity (stay put).
            const age = now - confirmed.time;
            const vel = age < MAX_VELOCITY_AGE_MS ? velocity.current : { lat: 0, lng: 0 };
            const predicted: LatLng = {
                lat: confirmed.lat + vel.lat * age,
                lng: confirmed.lng + vel.lng * age,
            };

            // Exponential decay correction — frame-rate independent blend toward prediction.
            // factor approaches 1 the longer we've gone without correcting.
            const factor = 1 - Math.exp(-dt / CORRECTION_TAU);
            renderPos.current = {
                lat: render.lat + (predicted.lat - render.lat) * factor,
                lng: render.lng + (predicted.lng - render.lng) * factor,
            };

            marker.position = renderPos.current;
        };

        rafId.current = requestAnimationFrame(loop);
        return () => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        };
    }, [googleMap, Markers]);

    // ── GPS update handler ────────────────────────────────────────────────────
    // Runs when a new raw GPS coordinate arrives. Does NOT snap the marker —
    // the loop above handles smoothly correcting toward the new data.
    useEffect(() => {
        if (!googleMap || !Markers || !rawPosition) return;

        const now = performance.now();

        // First fix — create the marker and initialize all tracking state
        if (!confirmedPos.current) {
            renderPos.current = rawPosition;
            confirmedPos.current = { ...rawPosition, time: now };
            markerRef.current = new (Markers as any).AdvancedMarkerElement({
                map: googleMap,
                position: rawPosition,
                content: dot,
            });
            return;
        }

        // Exponential smoothing to reduce GPS jitter.
        // Blends the new raw reading toward the existing smoothed position.
        const smoothed: TimedLatLng = {
            lat: confirmedPos.current.lat + SMOOTHING_ALPHA * (rawPosition.lat - confirmedPos.current.lat),
            lng: confirmedPos.current.lng + SMOOTHING_ALPHA * (rawPosition.lng - confirmedPos.current.lng),
            time: now,
        };

        // Recalculate velocity in degrees/ms from the last two smoothed positions
        const dt = now - confirmedPos.current.time;
        if (dt > 0) {
            velocity.current = {
                lat: (smoothed.lat - confirmedPos.current.lat) / dt,
                lng: (smoothed.lng - confirmedPos.current.lng) / dt,
            };
        }

        // Advance the confirmed position — the loop will smoothly correct renderPos
        confirmedPos.current = smoothed;
    }, [rawPosition]);
}
