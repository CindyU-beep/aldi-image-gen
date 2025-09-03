import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
    ContainerClient
} from '@azure/storage-blob';

// Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_IMAGES || 'images';
const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT || '';
const AZURE_STORAGE_ACCESS_KEY = process.env.AZURE_STORAGE_ACCESS_KEY || '';

// Get a reference to the blob service client
export const getBlobServiceClient = (): BlobServiceClient => {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error('Azure Storage connection string not configured');
    }
    return BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
};

// Create a shared key credential for SAS generation
const getSharedKeyCredential = (): StorageSharedKeyCredential | null => {
    if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_ACCESS_KEY) {
        console.warn('Azure Storage account name or access key not configured. SAS tokens will not be available.');
        return null;
    }
    return new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
};

// Generate a SAS token for a blob with improved settings
export const generateBlobSAS = (
    containerName: string,
    blobName: string,
    expiryMinutes: number = 5
): string => {
    const sharedKeyCredential = getSharedKeyCredential();

    if (!sharedKeyCredential) {
        console.warn('Cannot generate SAS token: credentials not available');
        return '';
    }

    // Add 5 min buffer before current time to handle clock skew
    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const sasOptions = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('racwd'), // Read, Add, Create, Write, Delete
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
    };

    try {
        const sasToken = generateBlobSASQueryParameters(
            sasOptions,
            sharedKeyCredential
        ).toString();
        return sasToken;
    } catch (error) {
        console.error('Error generating SAS token:', error);
        return '';
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
    generateSAS: boolean = true,
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

            if (generateSAS) {
                const sasToken = generateBlobSAS(containerName, blob.name, expiryMinutes);
                if (sasToken) {
                    blobUrl = `${blobUrl}?${sasToken}`;
                }
            }

            blobs.push({
                name: blob.name,
                url: blobUrl,
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