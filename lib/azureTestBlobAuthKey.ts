import { BlobServiceClient } from '@azure/storage-blob';
import { AzureCliCredential } from '@azure/identity';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAuth() {
    // Get account name from environment variables if available
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'aldidemostorage';
    console.log(`Testing authentication for Azure Storage account: ${accountName}`);

    try {
        console.log('Attempting to authenticate via Azure CLI...');

        // Try Azure CLI credential first
        const credential = new AzureCliCredential();

        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            credential
        );

        // List all containers to test access
        console.log('Listing containers via Azure CLI credential...');
        let containerCount = 0;
        try {
            for await (const container of blobServiceClient.listContainers()) {
                console.log(`Container: ${container.name}`);
                containerCount++;
            }
            console.log(`Found ${containerCount} containers via Azure CLI credential`);
        } catch (cliError) {
            console.log('Azure CLI credential failed:', cliError instanceof Error ? cliError.message : String(cliError));

            // Fall back to connection string if Azure CLI auth fails
            console.log('\nTrying connection string authentication as fallback...');
            if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                try {
                    const connectionStringClient = BlobServiceClient.fromConnectionString(
                        process.env.AZURE_STORAGE_CONNECTION_STRING
                    );

                    console.log('Listing containers via connection string...');
                    containerCount = 0;
                    for await (const container of connectionStringClient.listContainers()) {
                        console.log(`Container: ${container.name}`);
                        containerCount++;
                    }
                    console.log(`Found ${containerCount} containers via connection string`);

                    console.log('\nConnection string authentication works!');
                    console.log('This confirms the issue is with RBAC permissions, not the storage account.');
                } catch (csError) {
                    console.log('Connection string authentication also failed:', csError instanceof Error ? csError.message : String(csError));
                }
            } else {
                console.log('No connection string available for fallback testing');
            }

            throw cliError; // Re-throw the original error
        }

        console.log('Authentication successful!');
    } catch (error) {
        console.error('Authentication failed:');
        console.error(error instanceof Error ? error.message : String(error));

        console.log('\n🔍 Advanced troubleshooting steps:');
        console.log('1. Check which Azure account you\'re logged in with:');
        console.log('   $ az account show --query user.name -o tsv');
        console.log('   Make sure this matches "rutynarafal@microsoft.com"');

        console.log('\n2. Microsoft-specific: Check if you need to set your tenant:');
        console.log('   $ az account set --subscription "Microsoft Non-Production"');

        console.log('\n3. Try assigning the Storage Blob Data Owner role (higher privileges):');
        console.log('   - Go to Azure Portal → Storage account → Access control (IAM)');
        console.log('   - Click "+ Add" → "Add role assignment"');
        console.log('   - Select "Storage Blob Data Owner" role');
        console.log('   - Add yourself as a member');

        console.log('\n4. Check if there are any Deny assignments:');
        console.log('   - In IAM, look for a "Deny assignments" tab');

        console.log('\n5. Microsoft-specific: Check if you need to use storage explorer with your work account');
    }
}

testAuth()
    .then(() => console.log('Test completed'))
    .catch(err => console.error('Unhandled error:', err));