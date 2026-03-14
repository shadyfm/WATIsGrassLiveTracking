import { useEffect, useState } from "react";

/**
 * Watches the user's live GPS position
 * @returns position as { lat, lng }, or null if unavailable. Plus an error if permission denied/unavailable.
 */
export default function useUserLocation() {
    const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setError(null);
            },
            (err) => {
                setError(err.message);
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { position, error };
}
