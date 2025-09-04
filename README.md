# Image Dojo

![Image Dojo Logo](/public/assets/ninja.png)

An AI-powered image generation and comparison lab that lets you easily create, modify, and compare product images using OpenAI and Google AI models.

## Features

- **Timeline Management**: Create multiple timelines to track your image modifications
- **AI Image Generation**: Generate product images using OpenAI and Google Gemini models
- **SEO Optimization**: Generate SEO metadata for your product images
- **Side-by-side Comparison**: Compare different image variations easily
- **Prompt Library**: Use pre-built prompts for fashion, lifestyle, and product photography

## Architecture

Image Dojo is built as a Next.js application with the following components:

- **Frontend**: React, Radix UI, Tailwind CSS
- **Backend**: Next.js API routes
- **AI Integration**: Azure OpenAI, Google Gemini
- **Storage**: Azure Blob Storage

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Azure OpenAI API key
- Google Gemini API key

### Environment Setup

1. Clone the repository
2. Create a `.env` file with the following variables:

```bash
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=images
AZURE_STORAGE_LIBRARY_NAME=library

# Azure OpenAI Image Service
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_API_DEPLOYMENT_NAME=your_api_deployment_name
AZURE_OPENAI_API_VERSION=your_api_version
AZURE_OPENAI_API_KEY=your_api_key

# Azure OpenAI 4o
AZURE_OPENAI_4o_ENDPOINT=your_openai_4o_endpoint
AZURE_OPENAI_4o_API_DEPLOYMENT_NAME=your_4o_deployment_name
AZURE_OPENAI_4o_API_VERSION=your_api_version
AZURE_OPENAI_4o_API_KEY=your_api_key

# Other APIs
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Run the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage Guide

### Creating a Project

1. Start by creating a new campaign from the home page
2. Add a timeline to your project
3. Import product images from your local library
4. Use AI to generate variations or modifications of your product images
5. Compare different variations side by side

### Working with Timelines

The timeline feature allows you to track the evolution of your image modifications:

- **Fork a modification**: Create a new timeline branch from any existing modification
- **Compare variations**: Select any two images to compare them side by side
- **Apply premade prompts**: Choose from fashion, lifestyle, or product photography prompts

### SEO Optimization

Generate SEO metadata for your product images including:
- Product title
- Meta description
- Keywords
- Alt text
- Product descriptions

## Deployment

### Deploy on Vercel

The easiest way to deploy your Image Dojo application is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a GitHub repository
2. Import the project into Vercel
3. Set up the environment variables
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Created by [Rafal Rutyna](mailto:rafal.rutyna@microsoft.com) • Global Black Belt Asia

![Microsoft Logo](/public/assets/microsoft-logo-white.svg)

## Reference Articles

https://www.datacamp.com/tutorial/gpt-image-1
https://apidog.com/blog/how-to-use-openai-4o-image-generation-api-gpt-image-1
