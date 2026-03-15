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



// Temporary mock implementation for testing without GPS access. Simulates movement by updating position every 2 seconds.
// export default function useUserLocation() {
//     const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null);

//     useEffect(() => {
//         let i = 0;
//         const id = setInterval(() => {
//             setPosition({
//                 lat: 43.4718 + i * 0.0001,  // moves slightly each tick
//                 lng: -80.543 + i * 0.0001,
//             });
//             i++;
//         }, 2000); // new GPS "fix" every 2 seconds
//         return () => clearInterval(id);
//     }, []);

//     return { position, error: null };
// }
