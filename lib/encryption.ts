/**
 * Encrypts sensitive data by delegating to a server-side function.
 * The encryption key never reaches the browser: it lives only as the
 * server-side ENCRYPTION_KEY env var, read inside /api/encrypt-notes.
 */
export const encryptData = async (text: string): Promise<string> => {
    if (!text) return '';

    const response = await fetch('/api/encrypt-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error('Não foi possível proteger os dados de cadastro. Tente novamente.');
    }

    const { encrypted } = await response.json();
    return encrypted;
};
