import type { NextApiRequest, NextApiResponse } from 'next';
import { listImagesFromContainer, deleteImageFromBlob, getBlobServiceClient } from '@/lib/azureStorage';
import sharp from 'sharp';

// Library container name - using environment variable with fallback
const AZURE_STORAGE_CONTAINER_LIBRARY = process.env.AZURE_STORAGE_CONTAINER_LIBRARY || 'library';

// Helper: Sanitize file name for Azure Blob Storage
function sanitizeFileName(fileName: string): string {
    return fileName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^[.-_]+|[.-_]+$/g, '')
        .substring(0, 255);
}

async function getLibraryContainerClient() {
    try {
        const blobServiceClient = getBlobServiceClient();
        const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_LIBRARY);
        await containerClient.createIfNotExists();
        return containerClient;
    } catch (error) {
        console.error('Error getting library container client:', error);
        throw error;
    }
}

function normalizeBase64(raw: string): string {
    let clean = decodeURIComponent(raw).replace(/ /g, '+').replace(/\r?\n/g, '');
    const pad = clean.length % 4;
    if (pad) clean += '='.repeat(4 - pad);
    return clean;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const containerParam = req.query.container as string | undefined;
            const containerName = containerParam || AZURE_STORAGE_CONTAINER_LIBRARY;
            const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

            console.log(`[Image Library API] Fetching images from container: ${containerName}`);
            
            let images = await listImagesFromContainer(containerName, false, 60);

            // Sort by lastModified descending (if available), then slice
            if (limitParam && Array.isArray(images)) {
                images = images
                    .sort((a, b) => {
                        const aDate = new Date(a.lastModified || 0).getTime();
                        const bDate = new Date(b.lastModified || 0).getTime();
                        return bDate - aDate;
                    })
                    .slice(0, limitParam);
            }

            console.log(`[Image Library API] Retrieved ${images.length} images from container ${containerName}`);

            return res.status(200).json({ images });
        } catch (error) {
            console.error("[Image Library API] Error listing images from container:", error);
            const message = error instanceof Error ? error.message : String(error);
            
            // Provide more specific error messages
            if (message.includes('Authentication')) {
                return res.status(500).json({ 
                    error: "Authentication failed", 
                    details: "Please check your Azure authentication setup. Make sure you're logged in with 'az login' and have proper permissions.",
                    troubleshooting: "Run 'az login' and verify access to the storage account"
                });
            }
            
            return res.status(500).json({ error: "Failed to list images", details: message });
        }
    } else if (req.method === 'POST') {
        try {
            // Only support JSON with base64
            if (!req.body || !req.headers['content-type']?.includes('application/json')) {
                return res.status(400).json({ error: "No file provided or unsupported content type. Please use JSON with base64." });
            }

            let buffer: Buffer;
            let originalFileName: string;
            let fileContentType: string;

            const { file } = req.body;
            if (!file) {
                return res.status(400).json({ error: "No file provided" });
            }
            try {
                // Try JSON format
                try {
                    const fileData = typeof file === 'string' ? JSON.parse(file) : file;
                    originalFileName = fileData.name || `image-${Date.now()}.png`;
                    fileContentType = fileData.type || 'image/png';
                    const base64Data = fileData.data || file;
                    const base64Content = base64Data.includes('base64,')
                        ? base64Data.split('base64,')[1]
                        : base64Data;
                    buffer = Buffer.from(normalizeBase64(base64Content), 'base64');
                } catch {
                    // Direct base64 string
                    const base64Content = file.includes('base64,')
                        ? file.split('base64,')[1]
                        : file;
                    buffer = Buffer.from(normalizeBase64(base64Content), 'base64');
                    originalFileName = `image-${Date.now()}.png`;
                    fileContentType = 'image/png';
                }
            } catch {
                return res.status(400).json({ error: "Invalid file format" });
            }

            try {
                const imageInfo = await sharp(buffer).metadata();
                const format = imageInfo.format?.toLowerCase() || 'png';
                const mimeTypeMap = {
                    'jpeg': 'image/jpeg',
                    'jpg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp'
                };
                fileContentType = mimeTypeMap[format as keyof typeof mimeTypeMap] || 'image/png';
                console.log(`Image validated: ${format}, ${imageInfo.width}x${imageInfo.height}`);

                const safeFileName = sanitizeFileName(`image-${Date.now()}.${format}`);
                const containerClient = await getLibraryContainerClient();
                const blockBlobClient = containerClient.getBlockBlobClient(safeFileName);

                console.log(`[Azure Blob] Starting upload of ${safeFileName} (${buffer.length} bytes)`);

                await blockBlobClient.upload(buffer, buffer.length, {
                    blobHTTPHeaders: {
                        blobContentType: fileContentType,
                        blobCacheControl: 'public, max-age=31536000',
                        blobContentDisposition: `inline; filename="${encodeURIComponent(safeFileName)}"`,
                        blobContentLanguage: 'en-US',
                    },
                    metadata: {
                        originalName: originalFileName,
                        width: imageInfo.width?.toString() || '0',
                        height: imageInfo.height?.toString() || '0',
                        format: format,
                        uploadedAt: new Date().toISOString(),
                        source: 'web-upload',
                        application: 'gbb-image-gen'
                    }
                });

                // Return the blob URL directly (Azure AD authentication handles access)
                let imageUrl = blockBlobClient.url;

                console.log(`Successfully uploaded ${safeFileName} to ${AZURE_STORAGE_CONTAINER_LIBRARY}`);

                return res.status(200).json({
                    success: true,
                    imageUrl: imageUrl,
                    fileName: safeFileName,
                    size: buffer.length,
                    contentType: fileContentType,
                    width: imageInfo.width,
                    height: imageInfo.height
                });
            } catch (error) {
                console.error("Invalid image file:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                return res.status(400).json({
                    error: "Invalid image file - only JPG, PNG, GIF, and WebP are supported",
                    details: errorMessage
                });
            }
        } catch (error) {
            console.error("Error uploading to library:", error);
            const message = error instanceof Error ? error.message : String(error);
            return res.status(500).json({ error: "Failed to upload image to library", details: message });
        }
    } else if (req.method === 'DELETE') {
        try {
            const imageUrl = req.query.url as string | undefined;
            if (!imageUrl) {
                return res.status(400).json({ error: "Image URL is required" });
            }
            await deleteImageFromBlob(imageUrl, AZURE_STORAGE_CONTAINER_LIBRARY);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error deleting from library:", error);
            const message = error instanceof Error ? error.message : String(error);
            return res.status(500).json({ error: "Failed to delete image from library", details: message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
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