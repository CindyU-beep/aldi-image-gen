import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadImageToBlob, deleteImageFromBlob } from '@/lib/azureStorage';

// Helper to handle POST and DELETE in one handler
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const { base64Image, format } = req.body;

            if (!base64Image) {
                return res.status(400).json({ error: "Base64 image is required" });
            }

            // Generate a unique filename
            const filename = `image-${Date.now()}.${format || 'png'}`;

            // Upload to Azure Blob Storage
            const imageUrl = await uploadImageToBlob(base64Image, filename);

            return res.status(200).json({ imageUrl });
        } catch (error) {
            console.error("Error handling blob storage request:", error);
            const message = error instanceof Error ? error.message : String(error);
            return res.status(500).json({
                error: "Failed to upload image to blob storage",
                details: message
            });
        }
    } else if (req.method === 'DELETE') {
        try {
            const imageUrl = req.query.url as string;

            if (!imageUrl) {
                return res.status(400).json({ error: "Image URL is required" });
            }

            try {
                // Extract the blob name from the URL
                const url = new URL(imageUrl);
                const pathSegments = url.pathname.split('/');
                const blobName = pathSegments[pathSegments.length - 1];

                if (!blobName) {
                    return res.status(400).json({
                        success: false,
                        message: "Could not extract blob name from URL"
                    });
                }

                // Delete from Azure Blob Storage
                await deleteImageFromBlob(imageUrl);
                return res.status(200).json({ success: true });
            } catch (error: any) {
                // Handle BlobNotFound errors gracefully
                if (error.code === "BlobNotFound" || error.statusCode === 404) {
                    console.warn(`Blob not found (already deleted or never existed): ${imageUrl}`);
                    // Consider this a success since the end result is the same
                    return res.status(200).json({
                        success: true,
                        message: "Blob not found but considered deleted successfully"
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error("Error deleting from blob storage:", error);
            const message = error instanceof Error ? error.message : String(error);
            return res.status(500).json({
                error: "Failed to delete image from blob storage",
                details: message
            });
        }
    } else {
        res.setHeader('Allow', ['POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
};