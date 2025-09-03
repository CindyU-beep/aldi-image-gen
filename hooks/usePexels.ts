import { useState } from 'react';
import { toast } from 'react-toastify';

export interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    liked: boolean;
    alt: string;
}

export const usePexels = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/pexels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchTerm,
                    perPage: 80,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch photos');
            }

            const result = await response.json();

            if (result.photos.length === 0) {
                toast.info('No photos found. Try a different search term.');
            } else {
                console.log('Fetched photos:', result);
                setPhotos(result.photos);
            }
        } catch (error) {
            console.error('Error searching photos:', error);
            toast.error('Failed to search photos');
        } finally {
            setLoading(false);
        }
    };

    const openPhotoInNewTab = (url: string) => {
        window.open(url, '_blank');
    };

    return {
        searchTerm,
        setSearchTerm,
        photos,
        loading,
        handleSearch,
        openPhotoInNewTab
    };
};

export default usePexels;