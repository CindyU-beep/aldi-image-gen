
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Modality, PersonGeneration } from '@google/genai';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { contextPrompt, contextImages, contextSettings } = req.body;

        const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

        const prompt = contextPrompt;
        const imageSize = contextSettings?.size || "1:1";
        const imageVariations = Math.min(contextSettings?.variations || 1, 4);
        const imageQuality = contextSettings?.quality || "Standard";
        const imageFormat = contextSettings?.format || "png";

        console.log("Prompt:", prompt);
        console.log("Image URLs:", contextImages);
        console.log("Settings:", {
            size: imageSize,
            variations: imageVariations,
            quality: imageQuality,
            format: imageFormat
        });

        if (!contextPrompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "API key not configured" });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const responseData: { data: { url: string }[] } = { data: [] };

        if (contextImages && contextImages.length > 0) {
            const imageBlobs = await Promise.all(
                contextImages.map(async (imageUrl: string) => {
                const absoluteUrl = imageUrl.startsWith('/')
                ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}${imageUrl}`
                : imageUrl;
                const imageResponse = await fetch(absoluteUrl);                    if (!imageResponse.ok) {
                        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
                    }
                    return await imageResponse.blob();
                })
            );

            const contentParts = await Promise.all(
                imageBlobs.map(async (blob) => {
                    const buffer = await blob.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString('base64');
                    return {
                        inlineData: {
                            data: base64,
                            mimeType: blob.type,
                        },
                    };
                })
            );

            contentParts.unshift({ text: prompt } as any);

            const generationPromises = Array(imageVariations).fill(0).map(async () => {
                try {
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-image-preview",
                        contents: contentParts,
                        config: {
                            responseModalities: [Modality.TEXT, Modality.IMAGE],
                        },
                    });

                    if (response.candidates && response.candidates.length > 0 && response.candidates[0]?.content) {
                        const parts = response.candidates[0].content.parts;
                        for (const part of parts as any) {
                            if (part.inlineData) {
                                return {
                                    url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                                };
                            }
                        }
                    }

                    throw new Error("No image was generated in the response");
                } catch (err) {
                    console.error("Error in image generation iteration:", err);
                    throw err;
                }
            });

            const generatedImages = await Promise.all(generationPromises);
            responseData.data = generatedImages;
        } else {
            try {
                const aspectRatio = imageSize;

                const response = await ai.models.generateImages({
                    model: 'gemini-2.5-flash-image-preview',
                    prompt: prompt,
                    config: {
                        numberOfImages: imageVariations,
                        aspectRatio: aspectRatio,
                        personGeneration: PersonGeneration.ALLOW_ALL
                    },
                });

                if (response.generatedImages && response.generatedImages.length > 0) {
                    responseData.data = response.generatedImages.map(generatedImage => {
                        if (!generatedImage.image) {
                            throw new Error("Generated image data is missing");
                        }
                        const imgBytes = generatedImage.image.imageBytes;
                        return {
                            url: `data:image/${imageFormat};base64,${imgBytes}`
                        };
                    });
                } else {
                    throw new Error("No images were generated in the response");
                }
            } catch (err) {
                console.error("Error in Imagen generation:", err);
                throw err;
            }
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Failed to generate image with Gemini",
            details: errorMessage
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
};