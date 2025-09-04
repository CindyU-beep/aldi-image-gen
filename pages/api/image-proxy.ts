import type { NextApiRequest, NextApiResponse } from 'next';
import { getBlobServiceClient } from '@/lib/azureStorage';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { container, blob, url } = req.query;

        // Handle both direct container/blob parameters and URL parameter
        let containerName: string;
        let blobName: string;

        if (url && typeof url === 'string') {
            // Extract container and blob from full URL
            try {
                const blobUrl = new URL(url);
                const pathSegments = blobUrl.pathname.split('/').filter(segment => segment.length > 0);
                if (pathSegments.length < 2) {
                    return res.status(400).json({ error: 'Invalid blob URL format' });
                }
                containerName = pathSegments[0];
                blobName = pathSegments.slice(1).join('/');
            } catch (urlError) {
                return res.status(400).json({ error: 'Invalid URL format' });
            }
        } else if (container && blob && typeof container === 'string' && typeof blob === 'string') {
            containerName = container;
            blobName = blob;
        } else {
            return res.status(400).json({ error: 'Either container and blob parameters, or url parameter is required' });
        }

        console.log(`Serving image: ${containerName}/${blobName}`);

        // Get the blob service client (uses Azure AD authentication)
        const blobServiceClient = getBlobServiceClient();
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        // Check if blob exists
        const exists = await blobClient.exists();
        if (!exists) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Get blob properties to determine content type
        const properties = await blobClient.getProperties();
        const contentType = properties.contentType || 'application/octet-stream';

        // Download the blob
        const downloadResponse = await blobClient.download();
        
        if (!downloadResponse.readableStreamBody) {
            return res.status(500).json({ error: 'Failed to download image' });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // For Node.js environments, we need to handle the stream differently
        const chunks: Buffer[] = [];
        
        // Convert ReadableStream to Node.js stream
        const nodeStream = downloadResponse.readableStreamBody as any;
        
        return new Promise((resolve, reject) => {
            nodeStream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });
            
            nodeStream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                res.status(200).send(buffer);
                resolve(undefined);
            });
            
            nodeStream.on('error', (error: Error) => {
                console.error('Error streaming blob:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to stream image' });
                }
                reject(error);
            });
        });

    } catch (error) {
        console.error('Error serving blob:', error);
        const message = error instanceof Error ? error.message : String(error);
        
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Failed to serve image',
                details: message
            });
        }
    }
}

export const config = {
    api: {
        responseLimit: '100mb',
    },
};