import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanSearchTerm } from '@/lib/helpers';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { searchTerm } = req.body;

        if (!searchTerm) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const apiKey = process.env.ZYTE_API_KEY || "";
        const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');

        // Call Zyte API to fetch Amazon products
        const response = await fetch("https://api.zyte.com/v1/extract", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                "url": `https://www.amazon.com/s?k=${cleanSearchTerm(searchTerm)}`,
                "productList": true,
                "productListOptions": { "extractFrom": "httpResponseBody" },
                "geolocation": "US"
            })
        });

        if (!response.ok) {
            throw new Error(`Zyte API responded with status: ${response.status}`);
        }

        const data = await response.json();

        console.log('Amazon products:', data);

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error fetching Amazon products:', error);
        return res.status(500).json({
            error: 'Failed to fetch products',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}