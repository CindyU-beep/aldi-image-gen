import { Card, TextArea, Button, IconButton, Flex, Tabs, Heading, Tooltip, Radio, Text, Switch, Badge } from '@radix-ui/themes';
import { IconTrash, IconArrowsSplit, IconPhotoPlus, IconCircleArrowLeft, IconCircleArrowRight, IconArrowBarBoth, IconSeo, IconX } from '@tabler/icons-react';
import useStore, { Settings } from '@/lib/store';
import { CardData } from '@/components/pages/ProjectPage';
import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useImagePreview } from '@/hooks/useImagePreview';
import { useSEO } from '@/hooks/useSEO';
import TimelineCardImage from './TimelineCardImage';
import { TimelineCardPrompts } from './TimelineCardPrompts';
import Generation from './Generation';
import { Shimmer } from './Shimmer';

interface TimelineCardData extends Omit<CardData, "outputContextImage" | "outputImages"> {
    outputContextImage?: string | null;
    outputImages?: string[];
    contextSettings: Settings;
    contextImages: string[];
}

interface TimelineCardProps {
    projectId: string
    timelineId: string
    card: CardData
    index: number
    width: number
    isLast: boolean
}

export default function TimelineCard({ projectId, timelineId, card, index, width, isLast }: TimelineCardProps) {

    const { removeLastCard, forkCard, addCompare, removeCompare, compare } = useStore();
    const [activeTab, setActiveTab] = useState("input");
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const { generateImage, isGenerating } = useImageGeneration();
    const [emblaRef, emblaApi] = useEmblaCarousel({});
    const { openPreview, PreviewOverlay } = useImagePreview();
    const { createSEO, SEODialog } = useSEO();

    // Initialize default settings if they don't exist
    const cardObj: TimelineCardData = {
        ...card,
        contextSettings: {
            model: card.contextSettings?.model ?? "GPT Image 1",
            engine: card.contextSettings?.engine,
            variations: card.contextSettings?.variations ?? 1,
            format: card.contextSettings?.format ?? "png",
            quality: card.contextSettings?.quality ?? "High",
            background: card.contextSettings?.background ?? "Auto",
            fidelity: card.contextSettings?.fidelity ?? "Low",
            size: card.contextSettings?.size ?? "1024x1536",
        },
        contextUrl: card.contextUrl || "",
        contextPrompt: card.contextPrompt || "",
        outputImages: card.outputImages || [],
        outputContextImage: card.outputContextImage ?? null,
        contextImages: card.contextImages || [],
    };

    // Align updateCard signature with the one expected by generateImage (Partial<CardData>)
    const updateCard = useStore(
        (state) => state.updateCard as (
            projectId: string,
            timelineId: string,
            cardId: string,
            update: Partial<CardData>,
        ) => void,
    )

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateCard(projectId, timelineId, card.id, { contextPrompt: e.target.value })
    }

    // Updated handleGenerate function
    const handleGenerate = async (e?: React.KeyboardEvent) => {
        // Check if this is a keyboard event and handle accordingly
        if (e) {
            if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            } else if (e.key !== 'Enter') {
                return;
            }
        }

        const storeSettings = useStore.getState().getSettings();
        setActiveTab("output");

        // Clear existing output images when regenerating to show loading state
        if (cardObj.outputImages && cardObj.outputImages.length > 0) {
            updateCard(projectId, timelineId, card.id, { outputImages: [] });
        }

        try {
            await generateImage({
                projectId,
                timelineId,
                cardId: card.id,
                contextPrompt: cardObj.contextPrompt,
                contextImages: cardObj.contextImages,
                settings: storeSettings,
                updateCard,
            });
        } catch (error) {
            // Error handling is already done in the hook
            console.error("Error in handleGenerate:", error);
        }
    };

    // Add this effect to update the current slide index when navigating
    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            setCurrentSlideIndex(emblaApi.selectedScrollSnap());
        };

        emblaApi.on("select", onSelect);
        onSelect();

        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi]);

    // Add this effect after your other useEffect hooks
    useEffect(() => {
        if (cardObj.outputImages && cardObj.outputImages.length > 0) {
            setActiveTab("output");
        }
    }, [cardObj.outputImages]);

    // Handle compare toggle for A/B comparison
    const handleCompare = (checked: boolean, src: string) => {
        if (checked) {
            addCompare(src);
        } else {
            removeCompare(src);
        }
    };

    // Check if an image is in the compare array
    const isInCompare = (src: string) => {
        return compare.includes(src);
    };

    const handleImageGallerySelect = () => {
        useStore.getState().openImageLibraryDialog({
            selectionMode: true,
            onSelect: (imageUrl: string, productUrl?: string) => {
                // Create updates object for the card
                const updates: Partial<CardData> = {
                    contextImages: [...(card.contextImages || []), imageUrl]
                };

                // If product URL is provided and no context URL is set, add it
                if (productUrl && (!card.contextUrl || card.contextUrl === '')) {
                    updates.contextUrl = productUrl;
                }

                // Update the card with the changes
                updateCard(projectId, timelineId, card.id, updates);

                // Close the dialog after selection
                useStore.getState().closeImageLibraryDialog();
            }
        });
    };

    const removeContextImage = (indexToRemove: number) => {
        const updatedImages = (card.contextImages || []).filter((_, i) => i !== indexToRemove);
        updateCard(projectId, timelineId, card.id, { contextImages: updatedImages });
    };

    return (
        <Card size="4" className="x-card" style={{ width: `${width}px` }}>
            <Flex justify="between" align="center">
                <Text weight="bold">{index + 1}</Text>
                {cardObj.outputImages && cardObj.outputImages.some(src => isInCompare(src)) &&
                    <Flex gap="3" align="center" justify="center">
                        <Badge color="indigo" radius="full" size="2">
                            <IconArrowBarBoth size={16} />Comparing</Badge>
                    </Flex>
                }
            </Flex>
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full min-h-[500px]">
                <Tabs.List justify="center" highContrast>
                    <Tabs.Trigger value="input">Input</Tabs.Trigger>
                    <Tabs.Trigger value="output">Output</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="input" my="3" className="x-card-input">
                    <Flex direction="column" gap="3">
                        <Heading size="2">
                            Context image(s)
                        </Heading>
                        <Card>
                            <Flex gap="3" align="center" wrap="wrap" className="min-h-[60px]">
                                {(cardObj.contextImages || []).map((imageUrl, imgIndex) => (
                                    <div key={imgIndex} className="relative">
                                        <img
                                            src={imageUrl}
                                            alt={`Context ${imgIndex}`}
                                            className="w-16 h-16 object-cover rounded-md cursor-pointer"
                                            onClick={() => openPreview(imageUrl)}
                                        />
                                        <IconButton
                                            size="1"
                                            variant="solid"
                                            radius="full"
                                            color="gray"
                                            className="absolute -top-1 -right-1 cursor-pointer"
                                            onClick={() => removeContextImage(imgIndex)}
                                        >
                                            <IconX size={12} />
                                        </IconButton>
                                    </div>
                                ))}
                                <IconButton variant="ghost" radius="full" onClick={handleImageGallerySelect} highContrast>
                                    <IconPhotoPlus size={20} />
                                </IconButton>
                            </Flex>
                        </Card>
                        <Heading size="2">
                            Context prompt
                        </Heading>
                        <TextArea
                            placeholder="Prompt"
                            value={card.contextPrompt}
                            onChange={handlePromptChange}
                            onKeyDown={handleGenerate}
                            rows={10}
                        />

                        <TimelineCardPrompts onPromptSelected={(prompt) => {
                            updateCard(projectId, timelineId, card.id, { contextPrompt: prompt });
                        }} />

                        {isLast && (
                            <>
                                <Button
                                    onClick={() => handleGenerate()}
                                    disabled={isGenerating}
                                    size="3"
                                    highContrast
                                >
                                    {isGenerating ? "Generating..." : "Generate"}
                                </Button>
                            </>
                        )}
                    </Flex>
                </Tabs.Content>
                <Tabs.Content value="output">
                    <div className="x-embla" ref={emblaRef}>
                        <Flex className="x-embla-container" align="start">
                            {cardObj.outputImages && cardObj.outputImages.length > 0 ? (
                                cardObj.outputImages.map((src: string, i: number) => (
                                    <div key={i} className="x-embla-slide">
                                        <TimelineCardImage
                                            src={src}
                                            onImageClick={openPreview}
                                            contextSettings={cardObj.contextSettings}
                                            contextImages={cardObj.contextImages}
                                            contextPrompt={cardObj.contextPrompt}
                                        />
                                        <Flex gap="3" align="center" justify="between" mt="3">
                                            <Flex gap="3" align="center" justify="center">
                                                <Radio
                                                    name={`context-${card.id}`}
                                                    value={String(i)}
                                                    checked={cardObj.outputContextImage === src}
                                                    onChange={() => {
                                                        return updateCard(projectId, timelineId, card.id, {
                                                            outputContextImage: src
                                                        });
                                                    }}
                                                />
                                                <Text as="label" size="2">
                                                    Context
                                                </Text>
                                            </Flex>
                                            <Flex gap="3" align="center" justify="center">
                                                <Text as="label" size="2">Compare</Text>
                                                <Switch
                                                    size="1"
                                                    color="indigo"
                                                    checked={isInCompare(src)}
                                                    onCheckedChange={(checked) => handleCompare(checked, src)}
                                                />
                                            </Flex>
                                        </Flex>
                                    </div>
                                ))
                            ) : isGenerating ? (
                                <Flex direction="column" align="center" justify="center" p="6" width="100%" className="x-embla-slide-message relative">
                                    <Generation />
                                    <Shimmer text="Generating..." textColor="--gray-a11" textGradient="--gray-12" isLoading>
                                        Generating...
                                    </Shimmer>
                                </Flex>
                            ) : (
                                <Flex direction="column" align="center" justify="center" p="6" width="100%" className="x-embla-slide-message">
                                    <Text color="gray">No image generated yet</Text>
                                </Flex>
                            )}
                        </Flex>
                        {cardObj.outputImages && cardObj.outputImages.length > 0 ? (
                            <Flex gap="3" justify="center" align="center" my="3">
                                <IconButton
                                    variant="ghost"
                                    radius="full"
                                    onClick={() => emblaApi?.scrollPrev()}
                                    className={`${currentSlideIndex === 0 ? '!opacity-0' : ''}`}
                                    disabled={currentSlideIndex === 0}
                                    highContrast
                                >
                                    <IconCircleArrowLeft size={20} />
                                </IconButton>
                                <Flex gap="3" align="center" width="60px" justify="center">
                                    <Text color="gray">{emblaApi ? currentSlideIndex + 1 : 1} of {cardObj.outputImages.length}</Text>
                                </Flex>
                                <IconButton
                                    variant="ghost"
                                    radius="full"
                                    onClick={() => emblaApi?.scrollNext()}
                                    className={`${currentSlideIndex === cardObj.outputImages.length - 1 ? '!opacity-0' : ''}`}
                                    disabled={currentSlideIndex === cardObj.outputImages.length - 1}
                                    highContrast
                                >
                                    <IconCircleArrowRight size={20} />
                                </IconButton>
                            </Flex>
                        ) : null}
                    </div>
                </Tabs.Content>
            </Tabs.Root>

            <Flex gap="3" justify="between" align="center">
                <Flex gap="3">
                    <Tooltip content="New variant">
                        <IconButton variant="ghost" radius="full" onClick={() =>
                            forkCard(projectId, timelineId, index, cardObj.contextUrl ?? null, card.outputContextImage ?? null)
                        } highContrast>
                            <IconArrowsSplit size={20} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip content="Generate SEO description">
                        <IconButton variant="ghost" radius="full" onClick={() =>
                            createSEO(card.contextUrl ?? null, card.outputContextImage ?? null)
                        } highContrast>
                            <IconSeo size={20} />
                        </IconButton>
                    </Tooltip>
                </Flex>
                {isLast && (
                    <Tooltip content="Delete card">
                        <IconButton variant="ghost" radius="full" onClick={() => removeLastCard(projectId, timelineId)} highContrast>
                            <IconTrash size={20} />
                        </IconButton>
                    </Tooltip>
                )}
            </Flex>

            {/* Move PreviewOverlay here so it's available regardless of active tab */}
            <PreviewOverlay />

            {/* Add the SEO Dialog */}
            <SEODialog />
        </Card>
    )
}
