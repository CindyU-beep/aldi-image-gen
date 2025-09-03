import type { NextApiRequest, NextApiResponse } from 'next';

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

        // Configuration
        const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
        const OPENAI_API_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
        const OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
        const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

        const prompt = contextPrompt || "Generate an image";
        const imageSize = contextSettings?.size || "1024x1024";
        const imageQuality = (contextSettings?.quality || "medium").toLowerCase();
        const imageFormat = contextSettings?.format || "png";
        const imageCompression = 100;
        const imageVariations = contextSettings?.variations || 1;

        console.log("Prompt:", prompt);
        console.log("Image URLs:", contextImages);
        console.log("Settings:", contextSettings);

        if (!contextPrompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "API key not configured" });
        }

        const api = `${OPENAI_ENDPOINT}openai/deployments/${OPENAI_API_DEPLOYMENT_NAME}/images/`
        const generations = `${api}generations?api-version=${OPENAI_API_VERSION}`;
        const edits = `${api}edits?api-version=${OPENAI_API_VERSION}`;

        // If there are context images, use edits endpoint, otherwise use generations
        const endpoint = contextImages && contextImages.length > 0 ? edits : generations;

        let response;

        if (contextImages && contextImages.length > 0) {
            // Handle image editing
            console.log("Editing image(s) with:", {
                prompt,
                imageSize,
                imageQuality,
                imageFormat,
                imageCompression,
                imageVariations,
            });

            // Create a FormData object for the multipart request
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("n", imageVariations.toString());
            formData.append("size", imageSize);
            formData.append("quality", imageQuality);

            // Process all images in the array
            try {
                const imageBlobs = await Promise.all(
                    contextImages.map(async (imageUrl: string | Request | URL, index: number) => {
                        const imageResponse = await fetch(imageUrl);
                        if (!imageResponse.ok) {
                            throw new Error(`Failed to fetch image #${index + 1} from the provided URL: ${imageResponse.statusText}`);
                        }
                        return await imageResponse.blob();
                    })
                );

                imageBlobs.forEach((blob, index) => {
                    formData.append("image[]", blob, `image${index}.png`);
                });
            } catch (error) {
                return res.status(400).json({
                    error: "Failed to process images",
                    details: error instanceof Error ? error.message : String(error)
                });
            }

            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: formData
            });
        } else {
            // Handle standard image generation
            const payload = JSON.stringify({
                prompt: prompt,
                size: imageSize,
                quality: imageQuality,
                output_compression: imageCompression,
                output_format: imageFormat,
                n: imageVariations,
            });

            console.log("Generating image with:", payload);

            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: payload
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API error response:", errorData);
            return res.status(response.status).json({
                error: "Failed to generate image.",
                details: errorData?.error || ""
            });
        }

        const data = await response.json();
        console.log("Response data received");

        return res.status(200).json(data);

    } catch (error) {
        console.error("Error generating/editing image:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Failed to generate/edit image",
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