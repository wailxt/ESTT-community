/**
 * Encryption utilities for hiding message content in the database.
 * Uses Web Crypto API (AES-GCM) with a static key from environment variables.
 * Encrypts messages in real-time for privacy.
 */

// Helper to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Helper to convert Base64 string to Uint8Array
const base64ToUint8Array = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

let cachedKey = null;

/**
 * Derives a stable CryptoKey from the static environment variable key.
 */
export async function getSharedKey() {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        console.warn('Encryption unavailable: Web Crypto API requires a secure context (HTTPS/localhost)');
        return null;
    }

    if (cachedKey) return cachedKey;

    const staticKey = process.env.NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY || 'default-fallback-beta-key-2026';
    const encoder = new TextEncoder();
    const data = encoder.encode(staticKey);

    // Hash the static key to get fixed-length 256-bit entropy
    const hash = await crypto.subtle.digest('SHA-256', data);

    // Import the hash as an AES-GCM key
    cachedKey = await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    return cachedKey;
}

/**
 * Encrypts a string using AES-GCM.
 */
export async function encryptText(text, key) {
    if (!text || !key) return null;

    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    // Generate a random 12-byte IV for every message
    if (!window.crypto || !window.crypto.subtle) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedText
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertextBuffer),
        iv: arrayBufferToBase64(iv)
    };
}

/**
 * Decrypts ciphertext using AES-GCM.
 */
export async function decryptText(ciphertext, ivBase64, key) {
    if (!ciphertext || !ivBase64 || !key) return null;

    try {
        const iv = base64ToUint8Array(ivBase64);
        const data = base64ToUint8Array(ciphertext);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error('Decryption failed:', error);
        return '[Message Chiffré]';
    }
}
