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
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const apiKey = process.env.ZYTE_API_KEY || "";
        const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');

        // Call Zyte API to fetch product data
        const response = await fetch("https://api.zyte.com/v1/extract", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                "url": url,
                "product": true,
                "productOptions": {
                    "extractFrom": "httpResponseBody",
                    "ai": true
                },
                "geolocation": "US"
            })
        });

        if (!response.ok) {
            throw new Error(`Zyte API responded with status: ${response.status}`);
        }

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error fetching product data:', error);
        return res.status(500).json({
            error: 'Failed to fetch product data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}