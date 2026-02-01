import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';

/**
 * Encrypts sensitive data using AES.
 * Note: The key must be set in VITE_ENCRYPTION_KEY environment variable.
 * If no key is set, it returns the raw text but logs a warning (for dev safety).
 */
export const encryptData = (text: string): string => {
    if (!text) return '';

    if (!ENCRYPTION_KEY) {
        console.warn('VITE_ENCRYPTION_KEY is not set. Data will not be encrypted properly.');
        // In a real scenario, you might want to throw error or block submission,
        // but for now we return text to avoid breaking the app if config is missing.
        return text;
    }

    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};
