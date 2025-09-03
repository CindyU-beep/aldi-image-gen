import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import useStore, { ImageLibraryOptions } from '@/lib/store';

interface LibraryImage {
    url: string;
    name: string;
    lastModified: Date;
    size: number;
}

export function useImageLibrary() {
    const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openImageLibraryDialog = (options?: ImageLibraryOptions) => {
        useStore.getState().openImageLibraryDialog(options);
    };
    const closeImageLibraryDialog = useStore(state => state.closeImageLibraryDialog);

    // Function to handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) {
            setSelectedFile(null);
            return;
        }

        const file = event.target.files[0];

        // Basic validation - client-side file type check
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            toast.error('Only JPG, PNG, GIF and WebP images are supported');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setSelectedFile(file);
    };

    // Function to upload the selected file - prevent event bubbling
    const uploadSelectedFile = async (e: React.MouseEvent) => {
        if (!selectedFile) {
            toast.warning('Please select a file first');
            return;
        }

        setIsUploading(true);

        try {
            // Convert file to base64
            const toBase64 = (file: File) =>
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

            const base64DataUrl = await toBase64(selectedFile);

            // Prepare JSON payload
            const payload = {
                file: {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    data: base64DataUrl,
                },
                source: 'upload',
            };

            const response = await fetch('/api/image-library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();

            toast.success('Image uploaded successfully');
            fetchLibraryImages();

            // Clear file selection after successful upload
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Function to fetch images from the specified container (default: library)
    const fetchLibraryImages = useCallback(
        async (container = 'library', limit?: number) => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ container });
                if (limit) params.append('limit', limit.toString());
                const response = await fetch(`/api/image-library?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch images');
                }
                const data = await response.json();
                setLibraryImages(data.images);
            } catch (error) {
                console.error('Error fetching images:', error);
                toast.error('Failed to load images');
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // Function to handle delete image - prevent event bubbling
    const handleDeleteImage = useCallback(async (imageUrl: string, e: React.MouseEvent) => {
        // Stop event propagation
        e.stopPropagation();

        try {
            const response = await fetch(`/api/image-library?url=${encodeURIComponent(imageUrl)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

            // Remove the deleted image from the state
            setLibraryImages(prev => prev.filter(img => img.url !== imageUrl));
            toast.success('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Failed to delete image');
        }
    }, []);

    // Function to upload an image from a URL
    const uploadImageFromUrl = useCallback(async (imageUrl: string, imageName: string) => {
        if (!imageUrl) {
            toast.warning('Image URL is required');
            return;
        }

        setIsUploading(true);

        try {
            // Fetch the image first to convert it to a file object
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            // Get the image data as a blob
            const blob = await response.blob();

            // Convert blob to base64
            const toBase64 = (blob: Blob) =>
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

            const base64DataUrl = await toBase64(blob);

            // Prepare JSON payload
            const payload = {
                file: {
                    name: imageName || `image-${Date.now()}.${getExtensionFromContentType(blob.type)}`,
                    type: blob.type,
                    data: base64DataUrl,
                },
                source: 'url',
                originalUrl: imageUrl,
            };

            // Use JSON, not FormData
            const uploadResponse = await fetch('/api/image-library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await uploadResponse.json();

            toast.success('Image uploaded successfully');
            fetchLibraryImages(); // Refresh the library

            return result;
        } catch (error) {
            console.error('Error uploading image from URL:', error);
            toast.error(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        } finally {
            setIsUploading(false);
        }
    }, [fetchLibraryImages]);

    // Helper function to get file extension from content type
    const getExtensionFromContentType = (contentType: string): string => {
        const types = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        };
        return types[contentType as keyof typeof types] || 'jpg';
    };

    return {
        openImageLibraryDialog,
        closeImageLibraryDialog,
        libraryImages,
        isLoading,
        isUploading,
        selectedFile,
        fileInputRef,
        handleFileSelect,
        uploadSelectedFile,
        fetchLibraryImages,
        handleDeleteImage,
        uploadImageFromUrl
    };
}