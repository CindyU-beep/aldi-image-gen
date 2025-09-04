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

        // Azure AI Foundry configuration for FLUX
        const AZURE_AI_FOUNDRY_ENDPOINT = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
        const AZURE_AI_FOUNDRY_API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY;
        const FLUX_DEPLOYMENT_NAME = process.env.FLUX_DEPLOYMENT_NAME || 'flux.1-kontext-pro';

        const prompt = contextPrompt || "Generate an image";
        const imageSize = contextSettings?.size || "1024x1024";
        const imageQuality = contextSettings?.quality || "Standard";
        const imageFormat = contextSettings?.format || "png";
        const imageVariations = contextSettings?.variations || 1;

        console.log("FLUX Generation - Prompt:", prompt);
        console.log("FLUX Generation - Settings:", contextSettings);

        if (!contextPrompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!AZURE_AI_FOUNDRY_ENDPOINT || !AZURE_AI_FOUNDRY_API_KEY) {
            return res.status(500).json({ 
                error: "Azure AI Foundry configuration missing",
                details: "Please set AZURE_AI_FOUNDRY_ENDPOINT and AZURE_AI_FOUNDRY_API_KEY environment variables"
            });
        }

        // Handle context images for FLUX img2img
        let contextImageData: string | null = null;
        if (contextImages && contextImages.length > 0) {
            console.log("FLUX Generation - Context images provided:", contextImages.length);
            
            try {
                // Fetch the first context image
                const imageUrl = contextImages[0];
                const absoluteUrl = imageUrl.startsWith('/') 
                    ? `${req.headers.host ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}` : 'http://localhost:3000'}${imageUrl}`
                    : imageUrl;
                
                console.log(`Fetching context image from: ${absoluteUrl}`);
                const imageResponse = await fetch(absoluteUrl);
                
                if (imageResponse.ok) {
                    const imageBlob = await imageResponse.blob();
                    const arrayBuffer = await imageBlob.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    contextImageData = `data:${imageBlob.type};base64,${base64}`;
                    console.log("Context image processed successfully");
                } else {
                    console.warn("Failed to fetch context image, proceeding without it");
                }
            } catch (error) {
                console.warn("Error processing context image:", error);
            }
        }

        // Azure AI Foundry FLUX endpoint structure
        const baseUrl = AZURE_AI_FOUNDRY_ENDPOINT.replace(/\/$/, ''); // Remove trailing slash
        const endpoint = `${baseUrl}/openai/deployments/${FLUX_DEPLOYMENT_NAME}/images/generations?api-version=2025-04-01-preview`;
        
        const payload: any = {
            prompt: prompt,
            model: FLUX_DEPLOYMENT_NAME?.toLowerCase(),
            n: imageVariations,
            size: imageSize,
            response_format: "b64_json"
        };

        // Add context image for img2img if available
        if (contextImageData) {
            payload.image = contextImageData;
            payload.strength = 0.8; // How much to transform the input image
            console.log("Added context image to FLUX payload");
        }

        console.log("FLUX API Request:", {
            endpoint,
            deployment: FLUX_DEPLOYMENT_NAME,
            payload: { ...payload, prompt: prompt.substring(0, 50) + "..." }
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AZURE_AI_FOUNDRY_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("FLUX API error response:", {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            
            return res.status(response.status).json({
                error: "Failed to generate image with FLUX",
                details: errorData?.error?.message || errorData?.message || `HTTP ${response.status}: ${response.statusText}`
            });
        }

        const data = await response.json();
        console.log("FLUX API response received:", JSON.stringify(data, null, 2));

        // FLUX images/generations API returns data in a specific format
        const generatedImages = data.data?.map((item: any) => ({
            url: item.b64_json ? `data:image/${imageFormat};base64,${item.b64_json}` : item.url
        })) || [];

        if (generatedImages.length === 0) {
            return res.status(500).json({
                error: "No images were generated",
                details: "FLUX API returned empty response",
                response: data
            });
        }

        return res.status(200).json({ data: generatedImages });

    } catch (error) {
        console.error("Error generating image with FLUX:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Failed to generate image with FLUX",
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
