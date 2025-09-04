import {
    BlobServiceClient,
    ContainerClient
} from '@azure/storage-blob';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';

// Configuration
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_IMAGES || 'images';
const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT || 'aldidemostorage';

// Helper function to generate SAS token for blob access
const generateBlobSAS = (containerName: string, blobName: string, expiryMinutes: number = 60): string | null => {
    // This storage account has key-based authentication disabled
    // SAS tokens cannot be generated without storage account keys
    // Return null to use direct blob URLs with Azure AD authentication
    console.log('Storage account has key-based authentication disabled - using Azure AD authentication');
    return null;
};

// Get a reference to the blob service client
export const getBlobServiceClient = (): BlobServiceClient => {
    const accountName = AZURE_STORAGE_ACCOUNT;

    if (!accountName) {
        throw new Error('Azure Storage account name not configured. Please set AZURE_STORAGE_ACCOUNT environment variable.');
    }

    // Skip connection string if key-based auth is disabled (which is common for secure storage accounts)
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
        console.log('Connection string available, but skipping due to key-based authentication restrictions...');
        console.log('Using Service Principal authentication instead for better security.');
    }

    // Use Service Principal (Client Secret) authentication
    if (process.env.AZURE_CLIENT_ID && process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_SECRET) {
        try {
            console.log('Using Azure Service Principal (Client Secret) authentication...');
            const credential = new ClientSecretCredential(
                process.env.AZURE_TENANT_ID,
                process.env.AZURE_CLIENT_ID,
                process.env.AZURE_CLIENT_SECRET
            );
            return new BlobServiceClient(
                `https://${accountName}.blob.core.windows.net`,
                credential
            );
        } catch (error) {
            console.error('Failed to create BlobServiceClient with Service Principal:', error);
        }
    }

    // Fallback to DefaultAzureCredential (includes managed identity, CLI, etc.)
    try {
        console.log('Falling back to DefaultAzureCredential...');
        const credential = new DefaultAzureCredential();
        return new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            credential
        );
    } catch (fallbackError) {
        console.error('Failed to create BlobServiceClient with DefaultAzureCredential:', fallbackError);
        throw new Error(`Failed to authenticate with Azure Storage. Please check your Azure authentication configuration. Error: ${fallbackError}`);
    }
};

// Get a reference to the container client - now working with private containers
const getContainerClient = async (containerName: string = AZURE_STORAGE_CONTAINER): Promise<ContainerClient> => {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create the container if it doesn't exist (with private access)
    try {
        await containerClient.createIfNotExists();
        console.log(`Container ${containerName} ensured (private access)`);
    } catch (error) {
        console.error(`Error creating container ${containerName}:`, error);
        throw error;
    }

    return containerClient;
};

export async function uploadImageToBlob(
    base64Image: string,
    fileName: string,
    containerName: string = AZURE_STORAGE_CONTAINER,
): Promise<string> {
    try {
        // Strip the data URI prefix if present
        const base64Data = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Get container client with the specified container name
        const containerClient = await getContainerClient(containerName);

        // Generate a unique file name with timestamp
        const uniqueFileName = `${Date.now()}-${fileName}`;

        // Get a block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);

        // Get the file extension and determine MIME type
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        const mimeTypeMap: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp'
        };
        const contentType = mimeTypeMap[fileExtension] || `image/${fileExtension}`;

        // Upload the buffer with improved metadata
        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: {
                blobContentType: contentType,
                blobCacheControl: 'public, max-age=86400' // Cache for 1 day
            },
            metadata: {
                uploadedAt: new Date().toISOString(),
                originalName: fileName
            }
        });

        // Return the raw blob URL without SAS token
        return blockBlobClient.url;
    } catch (error) {
        console.error(`Error uploading to Azure Blob Storage (container: ${containerName}):`, error);
        throw error;
    }
}

// Update all other methods to support SAS tokens

export async function deleteImageFromBlob(
    imageUrl: string,
    containerName: string = AZURE_STORAGE_CONTAINER
): Promise<void> {
    try {
        // Extract the blob name from the URL
        const url = new URL(imageUrl);
        const pathSegments = url.pathname.split('/');
        const blobName = pathSegments[pathSegments.length - 1];

        if (!blobName) {
            throw new Error(`Could not extract blob name from URL: ${imageUrl}`);
        }

        // Get container client with the specified container name
        const containerClient = await getContainerClient(containerName);

        // Get blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Check if blob exists before attempting to delete to avoid unnecessary errors
        const exists = await blockBlobClient.exists();
        if (!exists) {
            console.log(`Blob ${blobName} does not exist, skipping deletion`);
            return;
        }

        // Delete the blob
        await blockBlobClient.delete();
        console.log(`Successfully deleted blob: ${blobName}`);
    } catch (error) {
        console.error(`Error deleting from Azure Blob Storage (container: ${containerName}):`, error);
        throw error;
    }
}

export async function listImagesFromContainer(
    containerName: string = AZURE_STORAGE_CONTAINER,
    generateSAS: boolean = false, // Default to false since SAS generation doesn't work with Azure AD
    expiryMinutes: number = 5
): Promise<{ name: string, url: string, lastModified?: Date, size?: number }[]> {
    try {
        // Log the container name to verify it's being passed correctly
        console.log(`Listing images from container: ${containerName}`);

        const containerClient = await getContainerClient(containerName);

        // List all blobs in the container
        const blobs: { name: string, url: string, lastModified?: Date, size?: number }[] = [];
        const iterator = containerClient.listBlobsFlat();

        for await (const blob of iterator) {
            const blobClient = containerClient.getBlobClient(blob.name);
            let blobUrl = blobClient.url;

            // Skip SAS generation since it's not supported with Azure AD auth
            // The images will be served through the image proxy API instead
            console.log(`Found blob: ${blob.name}, URL: ${blobUrl}`);

            blobs.push({
                name: blob.name,
                url: `/api/image-proxy?container=${containerName}&blob=${encodeURIComponent(blob.name)}`,
                lastModified: blob.properties.lastModified,
                size: blob.properties.contentLength
            });
        }

        console.log(`Retrieved ${blobs.length} images from container ${containerName}`);
        return blobs;
    } catch (error) {
        console.error(`Error listing images from container ${containerName}:`, error);
        throw error;
    }
}

export async function uploadFileToBlob(
    file: File,
    containerName: string = AZURE_STORAGE_CONTAINER,
    generateSAS: boolean = true
): Promise<string> {
    try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get container client with the specified container name
        const containerClient = await getContainerClient(containerName);

        // Generate a unique file name
        const fileName = file.name;
        const uniqueFileName = `${Date.now()}-${fileName}`;

        // Get a block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);

        // Get the content type
        const contentType = file.type || 'application/octet-stream';

        // Upload the buffer with improved metadata
        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: {
                blobContentType: contentType,
                blobCacheControl: 'public, max-age=86400' // Cache for 1 day
            },
            metadata: {
                uploadedAt: new Date().toISOString(),
                originalName: fileName,
                size: file.size.toString()
            }
        });

        // Return the URL of the uploaded blob with SAS if requested
        let blobUrl = blockBlobClient.url;

        if (generateSAS) {
            const sasToken = generateBlobSAS(containerName, uniqueFileName);
            if (sasToken) {
                blobUrl = `${blobUrl}?${sasToken}`;
            }
        }

        return blobUrl;
    } catch (error) {
        console.error(`Error uploading file to Azure Blob Storage (container: ${containerName}):`, error);
        throw error;
    }
}

// console.log('Storage account name available:', !!AZURE_STORAGE_ACCOUNT);
// console.log('Storage access key available:', !!AZURE_STORAGE_ACCESS_KEY);