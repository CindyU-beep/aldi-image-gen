import type { NextApiRequest, NextApiResponse } from 'next';
import { getBlobServiceClient, generateBlobSAS } from '@/lib/azureStorage';

const imagePlaceholder = "https://placehold.co/400x720/111111/7c7c7c?font=lato&text=No+image+available";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=600');

    try {
        const imageUrl = req.query.url as string;
        const containerOverride = req.query.container as string;

        if (!imageUrl) {
            return res.status(400).json({
                error: "Image URL is required",
                imageUrl: imagePlaceholder
            });
        }

        // Strip query parameters (SAS tokens) from the URL
        const baseUrl = imageUrl.split('?')[0];

        // Parse the Azure Blob Storage URL
        const url = new URL(baseUrl);

        // Azure Blob Storage URL format: https://{account}.blob.core.windows.net/{container}/{blob}
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        if (pathSegments.length < 2) {
            return res.status(400).json({
                error: "Invalid Azure Blob Storage URL format. Expected: https://{account}.blob.core.windows.net/{container}/{blob}",
                imageUrl: imagePlaceholder
            });
        }

        // Extract container and blob from the URL path
        const containerFromUrl = pathSegments[0];
        const blobPath = pathSegments.slice(1).join('/'); // Support nested blob paths

        // Use container override if provided, otherwise use container from URL
        const containerName = containerOverride || containerFromUrl;

        if (!blobPath) {
            return res.status(400).json({
                error: "Could not extract blob name from URL",
                imageUrl: imagePlaceholder
            });
        }

        // Check if blob exists in Azure Storage
        try {
            const blobServiceClient = getBlobServiceClient();
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlobClient(blobPath);

            const exists = await blobClient.exists();

            if (!exists) {
                console.warn(`Blob not found: ${blobPath} in container ${containerName}`);
                return res.status(200).json({
                    exists: false,
                    imageUrl: imagePlaceholder,
                    message: "Image not found in storage"
                });
            }

            // Generate new SAS token for the blob
            const sasToken = generateBlobSAS(containerName, blobPath, 4320); // 3 days expiry

            // Construct the correct URL with the proper container
            const storageAccount = url.hostname.split('.')[0];
            const correctBaseUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobPath}`;
            const newImageUrl = sasToken ? `${correctBaseUrl}?${sasToken}` : correctBaseUrl;

            return res.status(200).json({
                exists: true,
                imageUrl: newImageUrl,
                originalUrl: imageUrl,
                message: "Image found and SAS token refreshed",
                metadata: {
                    containerName,
                    blobName: blobPath,
                    sasGenerated: !!sasToken,
                    containerFromUrl: containerFromUrl,
                    containerOverridden: !!containerOverride,
                    storageAccount
                }
            });

        } catch (storageError: any) {
            // Handle specific Azure Storage errors
            if (storageError.code === 'ContainerNotFound') {
                console.warn(`Container not found: ${containerName}`);
                return res.status(200).json({
                    exists: false,
                    imageUrl: imagePlaceholder,
                    message: "Container not found"
                });
            }

            if (storageError.code === 'BlobNotFound') {
                console.warn(`Blob not found: ${blobPath} in container ${containerName}`);
                return res.status(200).json({
                    exists: false,
                    imageUrl: imagePlaceholder,
                    message: "Image not found in storage"
                });
            }

            // Re-throw other storage errors
            throw storageError;
        }

    } catch (error) {
        console.error("Error checking blob availability:", error);
        const message = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Failed to check image availability",
            details: message,
            imageUrl: imagePlaceholder
        });
    }
}