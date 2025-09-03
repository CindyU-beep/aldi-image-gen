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
        const { searchTerm, perPage } = req.body;

        if (!searchTerm) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const apiKey = process.env.PEXELS_API_KEY || "";
        const imagesPerPage = perPage || 80;

        // Call Pexels API to fetch images
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=${imagesPerPage}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': apiKey
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Pexels API responded with status: ${response.status}`);
        }

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error fetching Pexels images:', error);
        return res.status(500).json({
            error: 'Failed to fetch images',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}