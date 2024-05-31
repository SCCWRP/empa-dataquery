import { useState, useEffect } from "react";

const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            // Use defaultValue if the item is null; otherwise, parse the stored JSON
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            // If error in parsing, fallback to defaultValue
            console.error("Error reading localStorage key “" + key + "”: ", error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            if (value) {
                // Store the state in localStorage
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.removeItem(key);
            }
        } catch (error) {
            // If error in storing, log the error
            console.error("Error writing to localStorage key “" + key + "”: ", error);
        }
    }, [value, key]);

    return [value, setValue];
};

export default useLocalStorage;
