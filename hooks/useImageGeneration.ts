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
                // If it's already a proxy URL, return it directly
                if (src.startsWith('/api/image-proxy')) {
                    return src;
                }

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
            let data: { data: any[] };

            // Choose API based on selected model
            const api = storeSettings.model === "Gemini"
                ? "gemini-image"
                : storeSettings.model === "FLUX.1 Kontext Pro"
                    ? "flux-image"
                    : "gpt-image";

            console.log(`[Image Generation] Using API: ${api} for model: ${storeSettings.model}`);
            console.log(`[Image Generation] Calling: /api/${api}`);

            response = await fetch(`/api/${api}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contextPrompt: contextPrompt,
                    contextImages: refreshedContextImages, // Use refreshed URLs
                    contextSettings: { ...storeSettings },
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

                // Better error message handling
                let errorMessage = "Failed to generate image";
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
                if (errorData.details) {
                    errorMessage += `: ${errorData.details}`;
                }

                toast.error(errorMessage);

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

            // Handle common image response formats across providers
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                for (let i = 0; i < data.data.length; i++) {
                    const item = data.data[i];
                    // Prefer url if provided, else construct from b64_json
                    let dataUrl: string | undefined = item?.url;
                    const b64 = item?.b64_json;

                    if (!dataUrl && b64) {
                        const imageFormat = (storeSettings.format || "png").toLowerCase();
                        dataUrl = `data:image/${imageFormat};base64,${b64}`;
                    }

                    if (dataUrl) {
                        try {
                            // If it's a data URL, upload to blob; otherwise, use the direct URL
                            if (dataUrl.startsWith('data:image/')) {
                                const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
                                if (base64Match && base64Match[1]) {
                                    const imageFormat = storeSettings.format || "png";
                                    const imageUrl = await uploadToAzureBlob(base64Match[1], imageFormat);
                                    if (i === 0) firstImageUrl = imageUrl;
                                    allImageUrls.push(imageUrl);
                                } else {
                                    console.error(`Invalid data URL format for image ${i + 1}:`, dataUrl);
                                }
                            } else {
                                // Assume it's a stable URL returned by the provider
                                if (i === 0) firstImageUrl = dataUrl;
                                allImageUrls.push(dataUrl);
                            }
                        } catch (uploadError) {
                            console.error(`Failed to process image ${i + 1}:`, uploadError);
                            // Continue with other images instead of failing completely
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