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
        const { imageUrl, productData } = req.body;

        // Configuration
        const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_4o_ENDPOINT;
        const OPENAI_API_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_4o_API_DEPLOYMENT_NAME;
        const OPENAI_API_VERSION = process.env.AZURE_OPENAI_4o_API_VERSION;
        const OPENAI_API_KEY = process.env.AZURE_OPENAI_4o_API_KEY;

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "API key not configured" });
        }

        if (!imageUrl) {
            return res.status(400).json({ error: "Image URL is required" });
        }

        // Construct the SEO generation prompt
        // Build a prompt template that includes clear instructions and product data
        const seoPrompt = `# SEO Metadata Generation Instructions
        
    Analyze the provided image and generate SEO metadata for the product. 

    ## Required Metadata Elements:
    1. Url: Generate a Url slug based on the product name, the url will start with "https://www.contoso.com/product/"
    2. Meta Title: Create a concise, descriptive title
    3. Meta Description: Write a compelling meta description
    4. Meta Keywords: Generate 5-8 relevant keywords/tags
    5. Image Alt Text: Provide a short, descriptive alt text for accessibility
    6. Write a comprehensive Product Description
    7. Write a Set Description detailing how the product or model appears in the image. Include the model’s estimated height, the fit of the product, any accessories, additional clothing items styled with the product, and the overall look or aesthetic.

    ## Product Information:
    ${productData ? JSON.stringify(productData, null, 2) : "No product data provided, use image context only."}

    ## Format:
    Each metadata element should be a heading.
    Ensure the content is SEO-optimized and follows best practices.
    For store name use "Contoso eCommerce".
    `;

        // Prepare the API request
        const endpoint = `${OPENAI_ENDPOINT}openai/deployments/${OPENAI_API_DEPLOYMENT_NAME}/chat/completions?api-version=${OPENAI_API_VERSION}`;

        // Fetch the image to include in the API call
        let imageContent;
        try {
            // Convert relative URLs to absolute URLs for server-side fetch
            const absoluteUrl = imageUrl.startsWith('/') 
                ? `${req.headers.host ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}` : 'http://localhost:3000'}${imageUrl}`
                : imageUrl;
            
            console.log(`Fetching image from: ${absoluteUrl}`);
            const imageResponse = await fetch(absoluteUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }

            const imageBlob = await imageResponse.blob();

            // Convert blob to base64
            const arrayBuffer = await imageBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imageContent = `data:${imageBlob.type};base64,${buffer.toString('base64')}`;
        } catch (error) {
            console.error("Error fetching or processing image:", error);
            return res.status(400).json({
                error: "Failed to process image",
                details: error instanceof Error ? error.message : String(error)
            });
        }

        // Create payload with the image content
        const payload = {
            messages: [
                {
                    role: "system",
                    content: "You are an expert SEO assistant that analyzes images and creates optimal SEO metadata."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: seoPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageContent as string
                            }
                        }
                    ]
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': OPENAI_API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: "Failed to generate SEO metadata",
                details: errorData
            });
        }

        const data = await response.json();

        // Extract the response content
        const seoContent = data.choices[0].message.content;

        // Try to parse the response as JSON
        let parsedSeo;
        try {
            parsedSeo = JSON.parse(seoContent);
        } catch {
            // If parsing fails, return the raw text
            parsedSeo = {
                raw: seoContent,
                error: "Failed to parse response as JSON"
            };
        }

        return res.status(200).json({
            seo: parsedSeo
        });

    } catch (error) {
        console.error("Error generating SEO metadata:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Failed to generate SEO metadata",
            details: errorMessage
        });
    }
}