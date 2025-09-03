import { useState } from 'react';
import { toast } from 'react-toastify';
import { CardData } from '@/components/pages/ProjectPage';
import useStore from '@/lib/store';
import { getModelDisplayName } from '@/lib/helpers';

interface GenerationSettings {
    size?: string;
    quality?: string;
    format?: string;
    variations?: number;
}

interface ImageGenerationParams {
    projectId: string;
    timelineId: string;
    cardId: string;
    contextPrompt: string;
    settings: GenerationSettings;
    contextImages?: string[];
    updateCard: (
        projectId: string,
        timelineId: string,
        cardId: string,
        update: Partial<CardData>,
    ) => void;
}

export const useImageGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const storeSettings = useStore.getState().getSettings();

    const uploadToAzureBlob = async (base64Image: string, format: string): Promise<string> => {
        const response = await fetch('/api/blob-storage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                base64Image,
                format,
                generateSAS: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload image to Azure Blob Storage");
        }

        const data = await response.json();
        return data.imageUrl; // This will now be the raw blob URL
    };

    // Helper function to refresh blob URLs using the same logic as useImageBlob
    const refreshBlobUrls = async (urls: string[]): Promise<string[]> => {
        if (!urls || urls.length === 0) return [];

        const refreshPromises = urls.map(async (src) => {
            try {
                // If it's not an Azure Blob Storage URL, return it directly
                if (src.startsWith('http://') || src.startsWith('https://')) {
                    if (!src.includes('.blob.core.windows.net')) {
                        return src;
                    }
                }

                // Fetch the blob URL from the API (same as useImageBlob)
                const response = await fetch(`/api/blob-url?url=${encodeURIComponent(src)}`);

                if (!response.ok) {
                    console.warn(`Failed to refresh blob URL (status ${response.status}):`, src);
                    return src; // Return original URL as fallback
                }

                const data = await response.json();
                return data.imageUrl || src;
            } catch (error) {
                console.warn('Failed to refresh blob URL:', src, error);
                return src; // Return original URL as fallback
            }
        });

        return Promise.all(refreshPromises);
    };

    const generateImage = async ({
        projectId,
        timelineId,
        cardId,
        contextPrompt,
        contextImages,
        updateCard,
    }: ImageGenerationParams) => {
        setIsGenerating(true);

        try {
            // Show loading state
            toast.info("Generating image...");

            // Refresh context image URLs to ensure they're valid and accessible
            const refreshedContextImages = await refreshBlobUrls(contextImages || []);

            let response: Response;
            let data: { data: string | any[]; };

            const api = storeSettings.model === "GPT Image 1" ? "openai-image" :
                storeSettings.model === "FLUX.1 Kontext Pro" ? "flux-image" :
                    "google-image";

            response = await fetch(`${process.env.BACKEND_URL}/${api}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contextPrompt: contextPrompt,
                    contextImages: refreshedContextImages, // Use refreshed URLs
                    contextSettings: storeSettings,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API error response:", errorData);
                console.error("Request payload:", {
                    contextPrompt,
                    contextImages: refreshedContextImages,
                    contextSettings: storeSettings,
                });

                toast.error(`${errorData.details?.error?.message || "Failed to generate image"}`);

                // Show more details if available
                throw new Error(
                    errorData.error ||
                    errorData.message ||
                    errorData.details ||
                    `Failed to generate image. Status: ${response.status}`
                );
            }

            data = await response.json();

            // Debug logging to see the actual API response
            console.log('API Response data:', data);
            console.log('Selected model:', storeSettings.model);

            // Handle multiple images if variations > 1
            const allImageUrls: string[] = [];
            let firstImageUrl: string | undefined = undefined;

            // Process each variation returned from the API
            if (storeSettings.model === "GPT Image 1") {
                // Handle GPT Image API response format
                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    for (let i = 0; i < data.data.length; i++) {
                        const base64Image = data.data[i]?.b64_json;

                        if (base64Image) {
                            try {
                                // Format for the image file
                                const imageFormat = storeSettings.format || "png";

                                // Upload the base64 image to Azure Blob Storage
                                const imageUrl = await uploadToAzureBlob(base64Image, imageFormat);

                                // Save the first image URL to use as the main output image
                                if (i === 0) {
                                    firstImageUrl = imageUrl;
                                }

                                allImageUrls.push(imageUrl);
                            } catch (uploadError) {
                                console.error(`Failed to upload image ${i + 1}:`, uploadError);
                                // Continue with other images instead of failing completely
                            }
                        }
                    }
                }
            } else if (storeSettings.model === "FLUX.1 Kontext Pro") {
                // Handle Flux API response format
                console.log('Processing Flux response:', data);

                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    for (let i = 0; i < data.data.length; i++) {
                        const imageData = data.data[i];
                        console.log(`Processing Flux image ${i + 1}:`, imageData);
                        let base64Image: string | undefined;

                        // Handle different possible response formats from Flux API
                        if (imageData?.b64_json) {
                            base64Image = imageData.b64_json;
                        } else if (imageData?.url && imageData.url.startsWith('data:image/')) {
                            // Extract base64 from data URL if that's the format
                            const base64Match = imageData.url.match(/^data:image\/[^;]+;base64,(.+)$/);
                            if (base64Match && base64Match[1]) {
                                base64Image = base64Match[1];
                            }
                        }

                        if (base64Image) {
                            try {
                                // Format for the image file
                                const imageFormat = storeSettings.format || "png";

                                // Upload the base64 image to Azure Blob Storage
                                const imageUrl = await uploadToAzureBlob(base64Image, imageFormat);

                                // Save the first image URL to use as the main output image
                                if (i === 0) {
                                    firstImageUrl = imageUrl;
                                }

                                allImageUrls.push(imageUrl);
                            } catch (uploadError) {
                                console.error(`Failed to upload image ${i + 1}:`, uploadError);
                                // Continue with other images instead of failing completely
                            }
                        } else {
                            console.log(`No valid base64 image found for image ${i + 1}`);
                        }
                    }
                } else {
                    console.log('No valid data array found in Flux response');
                }
            } else {
                // Handle Gemini API response format
                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    for (let i = 0; i < data.data.length; i++) {
                        const dataUrl = data.data[i]?.url;

                        if (dataUrl) {
                            try {
                                // Extract the base64 data from the data URL
                                const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);

                                if (base64Match && base64Match[1]) {
                                    // Format for the image file
                                    const imageFormat = storeSettings.format || "png";

                                    // Upload the base64 image to Azure Blob Storage
                                    const imageUrl = await uploadToAzureBlob(base64Match[1], imageFormat);

                                    // Save the first image URL to use as the main output image
                                    if (i === 0) {
                                        firstImageUrl = imageUrl;
                                    }

                                    allImageUrls.push(imageUrl);
                                } else {
                                    console.error(`Invalid data URL format for image ${i + 1}:`, dataUrl);
                                }
                            } catch (uploadError) {
                                console.error(`Failed to process image ${i + 1}:`, uploadError);
                                // Continue with other images instead of failing completely
                            }
                        }
                    }
                }
            }

            if (allImageUrls.length === 0) {
                throw new Error("Failed to process images - no images were successfully generated or uploaded");
            }

            // Update the card with all generated image URLs
            updateCard(projectId, timelineId, cardId, {
                outputContextImage: firstImageUrl,
                outputImages: [...allImageUrls],
                contextImages: refreshedContextImages, // Store the refreshed URLs
                contextSettings: storeSettings
            });

            // Show success message
            // Replace the manual model name determination with our helper
            const modelName = getModelDisplayName(
                storeSettings.model,
                storeSettings.engine,
                Boolean(refreshedContextImages?.length)
            );

            toast.success(`${allImageUrls.length} image(s) generated with ${modelName} model.`);
            return allImageUrls;
        } catch (error) {
            console.error("Error generating or storing image:", error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        generateImage,
        isGenerating,
    };
};