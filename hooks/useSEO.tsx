import { useState } from 'react';
import { Dialog, Flex, Box, IconButton, ScrollArea, Callout } from '@radix-ui/themes';
import { IconX, IconInfoCircle } from '@tabler/icons-react';
import { Shimmer } from '@/components/Shimmer';
import { toast } from 'react-toastify';
import Generation from '@/components/Generation';
import Markdown from 'react-markdown';
import { useImageBlob } from './useImageBlob';

export function useSEO() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [seoData, setSeoData] = useState<any>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    // Add useImageBlob hook to handle token generation
    const { imageUrl: tokenizedImageUrl } = useImageBlob(currentImageUrl || '');

    const createSEO = async (productUrl: string | null, imageUrl: string | null) => {
        if (!imageUrl) {
            setIsDialogOpen(true);
            return;
        }

        setCurrentImageUrl(imageUrl);
        setIsDialogOpen(true);
        setIsLoading(true);
        setSeoData(null);

        try {
            // Wait for the tokenized URL to be ready
            let finalImageUrl = imageUrl;

            // If it's already a proxy URL, use it directly
            if (imageUrl.startsWith('/api/image-proxy')) {
                finalImageUrl = imageUrl;
            } else if (imageUrl.includes('.blob.core.windows.net')) {
                // If it's an Azure Blob Storage URL, get the tokenized version
                const response = await fetch(`/api/blob-url?url=${encodeURIComponent(imageUrl)}`);
                const data = await response.json();
                finalImageUrl = data.imageUrl;
            }

            // If productUrl is provided, fetch product data first
            let productData = null;
            if (!productUrl) {
                const productResponse = await fetch('/api/seo-description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: productUrl,
                    }),
                });

                if (!productResponse.ok) {
                    const errorData = await productResponse.json();
                    console.warn('Failed to fetch product data:', errorData);
                } else {
                    productData = await productResponse.json();
                    console.log('Fetched product data:', productData);
                }
            }

            // Call SEO endpoint with tokenized image URL and optional product data
            const response = await fetch('/api/seo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: finalImageUrl,
                    productData: productData || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate SEO metadata');
            }

            const data = await response.json();
            console.log('Generated SEO metadata:', data);
            setSeoData(data.seo);
        } catch (error) {
            console.error('Error generating SEO:', error);
            toast.error('Failed to generate SEO metadata: ' + (error instanceof Error ? error.message : 'An unknown error occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const SEODialog = () => {
        return (
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Content maxWidth="1072px" maxHeight="95vh">
                    <Dialog.Title>SEO</Dialog.Title>
                    <IconButton
                        aria-label="Close"
                        variant="ghost"
                        color="gray"
                        radius="full"
                        onClick={() => setIsDialogOpen(false)}
                        style={{ position: 'absolute', top: 20, right: 20 }}
                        highContrast
                    >
                        <IconX size={18} />
                    </IconButton>

                    {isLoading && (
                        <Flex direction="column" align="center" justify="center" minHeight="300px" position="relative">
                            <Generation />
                            <Shimmer text="Generating SEO metadata..." textColor="--gray-a11" textGradient="--gray-12" isLoading>
                                Generating SEO metadata...
                            </Shimmer>
                        </Flex>
                    )}

                    {!isLoading && seoData?.raw && (
                        <>
                            <Flex gap="8" mt="4" className="markdown">
                                <Box style={{ flex: '1' }}>
                                    {(tokenizedImageUrl || currentImageUrl) && (
                                        <img
                                            src={tokenizedImageUrl || currentImageUrl || undefined}
                                            alt="Generated SEO Image"
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                    )}
                                </Box>
                                <ScrollArea scrollbars="vertical" style={{ flex: '1', height: 'calc(45vh - 70px)' }}>
                                    <Box className="markdown" mr="6">
                                        <Markdown>{seoData.raw}</Markdown>
                                    </Box>
                                </ScrollArea>
                            </Flex>
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Root>
        );
    };

    return {
        createSEO,
        SEODialog,
        isDialogOpen,
        setIsDialogOpen,
    };
}