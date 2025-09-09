import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Helper function to convert file to blob for consistency
async function getAldiLogoBlob(): Promise<Blob> {
    const logoPath = path.join(process.cwd(), 'public', 'aldi-nord.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return new Blob([logoBuffer], { type: 'image/png' });
}

// Helper function to fetch and convert image URL to blob with retry logic
async function fetchImageWithRetry(url: string, maxRetries = 3): Promise<Blob> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Fetching image (attempt ${attempt}/${maxRetries}): ${url}`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ALDI-ImageGen/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.blob();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Image fetch attempt ${attempt} failed:`, lastError.message);
            
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`Failed to fetch image after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// Main handler function
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

        // Configuration with validation
        const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
        const OPENAI_API_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
        const OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
        const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

        // Validate required environment variables
        if (!OPENAI_API_KEY || !OPENAI_ENDPOINT || !OPENAI_API_DEPLOYMENT_NAME) {
            console.error('Missing required environment variables');
            return res.status(500).json({ 
                error: "Server configuration error",
                details: "Missing required Azure OpenAI configuration" 
            });
        }

        const prompt = contextPrompt || "Generate an image";
        const imageSize = contextSettings?.size || "1024x1024";
        const imageQuality = (contextSettings?.quality || "medium").toLowerCase();
        const imageFormat = contextSettings?.format || "png";
        const imageCompression = 100;
        const imageVariations = contextSettings?.variations || 1;

        console.log("GPT-4 Vision Image Generation Request:", {
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
            imageCount: contextImages?.length || 0,
            settings: contextSettings
        });

        if (!contextPrompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const api = `${OPENAI_ENDPOINT}openai/deployments/${OPENAI_API_DEPLOYMENT_NAME}/images/`
        const edits = `${api}edits?api-version=${OPENAI_API_VERSION}`;

        // Always use edits endpoint with ALDI logo automatically included from public folder
        const hasContextImages = contextImages && contextImages.length > 0;
        const endpoint = edits;

        // Always use edits endpoint with automatic ALDI logo integration
        console.log("GPT-4 Vision with automatic ALDI logo from public folder:", {
            prompt,
            imageSize,
            imageQuality,
            imageFormat,
            imageCompression,
            imageVariations,
            hasContextImages
        });

        // Create FormData for the edits endpoint
        const formData = new FormData();
        
        // Enhanced prompt that integrates context images and ALDI branding
        const enhancedPrompt = `Create an ALDI Nord advertisement based on: "${prompt}". 
            CRITICAL REQUIREMENTS:
                    - Keep the ALDI Nord logo (provided as first reference image) exactly unchanged - do NOT modify, edit, resize, or alter it in any way
                    - Include the ALDI Nord logo prominently with brand colors (blue #2490D7, white ##FFFFFF, nile blue ##172B4D). The ALDI logo features a stylized triangle made of three blue lines, a dark blue rectangle with “ALDI” in bold white letters, and a red border framing the entire design.
                    - Use other reference images as context for composition, style, and product placement
                    - Create a cohesive advertisement that integrates the unchanged logo with the new elements
                    - Ensure high-quality professional advertising standards`;

        formData.append("prompt", enhancedPrompt);
        formData.append("n", imageVariations.toString());
        formData.append("size", imageSize);
        formData.append("quality", imageQuality);

        try {
            // Always add ALDI logo from public folder as the base image to edit
            console.log("Adding ALDI Nord logo automatically from /public/aldi-nord.png (user doesn't need to upload)");
            const aldiLogo = await getAldiLogoBlob();
            formData.append("image", aldiLogo, "aldi-logo.png");
            
            // Log context images for reference but don't send them (avoid duplicate parameter error)
            if (hasContextImages) {
                console.log(`Context images provided for reference: ${contextImages.length} images`);
                console.log("Context images will influence the prompt but ALDI logo remains the base image");
            }
            
        } catch (error) {
            console.error("Error processing ALDI logo:", error);
            return res.status(400).json({
                error: "Failed to process ALDI logo",
                details: error instanceof Error ? error.message : String(error)
            });
        }

        // Make API request with retry logic
        let apiResponse: Response | null = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Making edits API request to Azure OpenAI (attempt ${attempt}/${maxRetries})`);
                apiResponse = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'User-Agent': 'ALDI-ImageGen/1.0'
                    },
                    body: formData
                });
                
                if (apiResponse.ok) break;
                
                if (attempt < maxRetries && apiResponse.status >= 500) {
                    console.warn(`API request failed with status ${apiResponse.status}, retrying...`);
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                break;
            } catch (error) {
                console.error(`API request attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    throw error;
                }
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        const response = apiResponse;

        if (!response || !response.ok) {
            const errorData = await response?.json().catch(() => ({}));
            console.error("Azure OpenAI API error:", {
                status: response?.status,
                statusText: response?.statusText,
                error: errorData
            });
            
            return res.status(response?.status || 500).json({
                error: "Failed to generate image with Azure OpenAI",
                details: errorData?.error?.message || errorData?.error || `HTTP ${response?.status}: ${response?.statusText}`
            });
        }

        const data = await response.json();
        console.log("GPT-4 Vision API response received successfully");

        return res.status(200).json(data);

    } catch (error) {
        console.error("Unexpected error in GPT-4 Vision image generation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Internal server error during image generation",
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