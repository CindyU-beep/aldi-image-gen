import { useState } from 'react';
import { Dialog, Flex, Box, IconButton, ScrollArea, Callout, Badge, Text } from '@radix-ui/themes';
import { IconX, IconInfoCircle, IconShieldCheck, IconAlertTriangle, IconAlertCircle } from '@tabler/icons-react';
import { Shimmer } from '@/components/Shimmer';
import { toast } from 'react-toastify';
import Generation from '@/components/Generation';
import { useImageBlob } from './useImageBlob';

interface ComplianceCriteria {
    name: string;
    score: number;
    status: 'compliant' | 'warning' | 'non-compliant';
    feedback: string;
}

interface ComplianceData {
    overall_score: number;
    overall_status: 'compliant' | 'warning' | 'non-compliant';
    criteria: ComplianceCriteria[];
    summary: string;
}

export function useBrandCompliance() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    // Add useImageBlob hook to handle token generation
    const { imageUrl: tokenizedImageUrl } = useImageBlob(currentImageUrl || '');

    const checkCompliance = async (imageUrl: string | null) => {
        if (!imageUrl) {
            setIsDialogOpen(true);
            return;
        }

        setCurrentImageUrl(imageUrl);
        setIsDialogOpen(true);
        setIsLoading(true);
        setComplianceData(null);

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

            // Call brand compliance endpoint with tokenized image URL
            const response = await fetch('/api/brand-compliance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: finalImageUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze brand compliance');
            }

            const data = await response.json();
            console.log('Generated compliance analysis:', data);
            setComplianceData(data.compliance);
        } catch (error) {
            console.error('Error analyzing brand compliance:', error);
            toast.error('Failed to analyze brand compliance: ' + (error instanceof Error ? error.message : 'An unknown error occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'compliant':
                return <IconShieldCheck size={16} />;
            case 'warning':
                return <IconAlertTriangle size={16} />;
            case 'non-compliant':
                return <IconAlertCircle size={16} />;
            default:
                return <IconShieldCheck size={16} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant':
                return 'green';
            case 'warning':
                return 'yellow';
            case 'non-compliant':
                return 'red';
            default:
                return 'gray';
        }
    };

    const BrandComplianceDialog = () => {
        return (
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Content maxWidth="1072px" maxHeight="95vh">
                    <Dialog.Title>Brand Compliance Analysis</Dialog.Title>
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
                            <Shimmer text="Analyzing brand compliance..." textColor="--gray-a11" textGradient="--gray-12" isLoading>
                                Analyzing brand compliance...
                            </Shimmer>
                        </Flex>
                    )}

                    {!isLoading && complianceData && (
                        <>
                            <Callout.Root>
                                <Callout.Icon>
                                    <IconInfoCircle />
                                </Callout.Icon>
                                <Callout.Text>
                                    Brand compliance analysis for ALDI Nord guidelines.<br />
                                    Focuses on logo placement, message tone, and legal adherence. Scores below 70% are flagged as non-compliant.
                                </Callout.Text>
                            </Callout.Root>
                            
                            <Flex gap="8" mt="4">
                                <Box style={{ flex: '1' }}>
                                    {(tokenizedImageUrl || currentImageUrl) && (
                                        <img
                                            src={tokenizedImageUrl || currentImageUrl || undefined}
                                            alt="Brand Compliance Analysis"
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                    )}
                                </Box>
                                <ScrollArea scrollbars="vertical" style={{ flex: '1', height: 'calc(45vh - 70px)' }}>
                                    <Box mr="6">
                                        {/* Overall Score */}
                                        <Flex align="center" gap="3" mb="4">
                                            <Text size="4" weight="bold">Overall Score:</Text>
                                            <Badge size="2" color={getStatusColor(complianceData.overall_status)} variant="solid">
                                                {getStatusIcon(complianceData.overall_status)}
                                                {complianceData.overall_score}% - {complianceData.overall_status.charAt(0).toUpperCase() + complianceData.overall_status.slice(1)}
                                            </Badge>
                                        </Flex>

                                        {/* Summary */}
                                        {complianceData.summary && (
                                            <Box mb="4">
                                                <Text size="3" weight="medium" mb="2" style={{ display: 'block' }}>Summary:</Text>
                                                <Text size="2" color="gray">{complianceData.summary}</Text>
                                            </Box>
                                        )}

                                        {/* Criteria Details */}
                                        <Box>
                                            <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>Compliance Criteria:</Text>
                                            {complianceData.criteria.map((criterion, index) => (
                                                <Box key={index} mb="3" p="3" style={{ border: '1px solid var(--gray-6)', borderRadius: '8px' }}>
                                                    <Flex align="center" justify="between" mb="2">
                                                        <Text size="3" weight="medium">{criterion.name}</Text>
                                                        <Badge size="1" color={getStatusColor(criterion.status)} variant="solid">
                                                            {getStatusIcon(criterion.status)}
                                                            {criterion.score}%
                                                        </Badge>
                                                    </Flex>
                                                    <Text size="2" color="gray">{criterion.feedback}</Text>
                                                </Box>
                                            ))}
                                        </Box>
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
        checkCompliance,
        BrandComplianceDialog,
        isDialogOpen,
        setIsDialogOpen,
    };
}