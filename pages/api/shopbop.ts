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
        const { searchTerm, categoryId } = req.body;

        if (!searchTerm || !categoryId) {
            return res.status(400).json({ error: 'Search term and category ID are required' });
        }

        const apiKey = process.env.ZYTE_API_KEY || "";
        const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');

        // Call Zyte API to fetch Shopbop products
        const response = await fetch("https://api.zyte.com/v1/extract", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                "url": `https://www.shopbop.com/products?query=${cleanSearchTerm(searchTerm)}&searchSuggestion=false&bu=${categoryId}&ref_=SB_GBP_SRCH_SS`,
                "productList": true,
                "productListOptions": { "extractFrom": "httpResponseBody" },
                "geolocation": "AU"
            })
        });

        if (!response.ok) {
            throw new Error(`Zyte API responded with status: ${response.status}`);
        }

        const data = await response.json();

        console.log('Shopbop products:', data);

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error fetching Shopbop products:', error);
        return res.status(500).json({
            error: 'Failed to fetch products',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}