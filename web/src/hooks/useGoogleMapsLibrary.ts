import { useEffect, useState } from "react";
import { GoogleMapsLibrary } from "../map/GoogleMapsLibrary";

/**
 * Fetch a library from the Google Maps API
 * @param name The name of the library to be imported
 * @param callback A function to be run after the library is imported, taking the imported library as its only argument
 * @returns library, libraryIsLoaded states. Has value null if the library has not loaded
 */
export default function useGoogleMapsLibrary(name: string, callback = (lib: GoogleMapsLibrary) => {}) {
    const [library, setLibrary] = useState<GoogleMapsLibrary | null>(null);
    const [libraryIsLoaded, setLibraryIsLoaded] = useState(false);
    
    useEffect(() => {
        setLibraryIsLoaded(false);
        
        // Wait for google.maps to be available
        const waitForGoogleMaps = () => {
            if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
                google.maps.importLibrary(name).then(res => {
                    setLibrary(res);
                    setLibraryIsLoaded(true);
                    callback(res);
                }).catch(error => {
                    console.error(`Error loading Google Maps library "${name}":`, error);
                    console.error('This is likely an API key issue. Check:');
                    console.error('1. API key is valid and correct');
                    console.error('2. Maps JavaScript API is enabled in Google Cloud Console');
                    console.error('3. Billing is enabled on your Google Cloud project');
                    console.error('4. API key restrictions allow localhost');
                });
            } else {
                // Wait a bit and try again
                setTimeout(waitForGoogleMaps, 100);
            }
        };
        
        waitForGoogleMaps();
    }, [name]);

    return { library, libraryIsLoaded };
}
