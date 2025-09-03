import { useEffect, useState } from 'react';

export const useImageBlob = (src: string) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!src) {
            setImageUrl('');
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        // If it's not an Azure Blob Storage URL, load it directly
        if (src.startsWith('http://') || src.startsWith('https://')) {
            if (!src.includes('.blob.core.windows.net')) {
                loadImage(src);
                return;
            }
        }

        // Fetch the blob URL from your API first
        fetch(`/api/blob-url?url=${encodeURIComponent(src)}`)
            .then(response => response.json())
            .then(data => {
                const urlToLoad = data.imageUrl || src;
                loadImage(urlToLoad);
            })
            .catch(error => {
                console.error('Error fetching blob URL:', error);
                setError('Failed to fetch image URL');
                setLoading(false);
            });
    }, [src]);

    const loadImage = (url: string) => {
        const img = new Image();

        img.onload = () => {
            setImageUrl(url);
            setLoading(false);
            setError(null);
        };

        img.onerror = () => {
            console.error('Error loading image:', url);
            setError('Failed to load image');
            setLoading(false);
        };

        img.src = url;
    };

    return { imageUrl, loading, error };
};

export default useImageBlob;