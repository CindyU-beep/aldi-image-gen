import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔍 Azure AI Foundry Connection Test');
console.log('===================================');

const AZURE_AI_FOUNDRY_ENDPOINT = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
const AZURE_AI_FOUNDRY_API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY;
const FLUX_DEPLOYMENT_NAME = process.env.FLUX_DEPLOYMENT_NAME;

console.log('Environment Variables:');
console.log(`AZURE_AI_FOUNDRY_ENDPOINT: ${AZURE_AI_FOUNDRY_ENDPOINT ? '✅ Set' : '❌ Missing'}`);
console.log(`AZURE_AI_FOUNDRY_API_KEY: ${AZURE_AI_FOUNDRY_API_KEY ? '✅ Set (length: ' + AZURE_AI_FOUNDRY_API_KEY.length + ')' : '❌ Missing'}`);
console.log(`FLUX_DEPLOYMENT_NAME: ${FLUX_DEPLOYMENT_NAME ? '✅ Set' : '❌ Missing'}`);

if (!AZURE_AI_FOUNDRY_ENDPOINT || !AZURE_AI_FOUNDRY_API_KEY || !FLUX_DEPLOYMENT_NAME) {
    console.log('\n❌ Missing required environment variables!');
    console.log('Please check your .env file has all required values.');
    process.exit(1);
}

console.log('\n🔗 Testing Azure AI Foundry Connection...');

async function testConnection() {
    try {
        const baseUrl = AZURE_AI_FOUNDRY_ENDPOINT.replace(/\/$/, '');
        const endpoint = `${baseUrl}/openai/deployments/${FLUX_DEPLOYMENT_NAME}/images/generations?api-version=2025-04-01-preview`;
        
        console.log(`Testing endpoint: ${endpoint}`);
        
        const payload = {
            prompt: "A simple test image",
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "b64_json"
        };

        console.log('Sending request...');
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AZURE_AI_FOUNDRY_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Connection successful!');
            console.log('Response data keys:', Object.keys(data));
            if (data.data && data.data.length > 0) {
                console.log('✅ Image generation working!');
                console.log('Generated images:', data.data.length);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Request failed');
            console.log('Error response:', errorText);
            
            // Try to parse as JSON for better error details
            try {
                const errorData = JSON.parse(errorText);
                console.log('Parsed error:', JSON.stringify(errorData, null, 2));
            } catch (e) {
                console.log('Raw error text:', errorText);
            }
        }

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        
        if (error.message.includes('fetch failed')) {
            console.log('\n🔧 Troubleshooting suggestions:');
            console.log('1. Check your internet connection');
            console.log('2. Verify the endpoint URL is correct');
            console.log('3. Check if your API key is valid');
            console.log('4. Ensure the deployment name exists');
            console.log('5. Check if there are any firewall restrictions');
        }
    }
}

testConnection();
