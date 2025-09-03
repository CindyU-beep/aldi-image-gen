import { useState } from 'react';
import { Flex, Dialog, IconButton, Text, Card, Badge, Heading } from '@radix-ui/themes';
import { IconX, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import useEmblaCarousel from 'embla-carousel-react';
import useStore from '@/lib/store';
import { Timeline, TimelineCard } from '@/components/Timeline';
import { checkImageUrl } from '@/lib/helpers';

interface ActionCardProps {
    title: string;
    content: React.ReactNode;
    index: number;
    variant: number;
}

const ActionCard = ({ title, content, index, variant }: ActionCardProps) => {
    return (
        <Card size="2" className="embla-slide min-w-[300px] max-w-[400px]" style={{ margin: '0 8px', flex: '0 0 auto' }}>
            <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                    <Badge color={variant % 2 === 0 ? 'blue' : 'purple'} size="2">V{variant}</Badge>
                    <Text size="1" color="gray">{index}</Text>
                </Flex>
                <Heading size="2" as="h3">{title}</Heading>
                <Flex direction="column" gap="2" className="pt-2">
                    {content}
                </Flex>
            </Flex>
        </Card>
    );
};

export function useActionsView() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTimeline, setActiveTimeline] = useState<{ projectId: string, timelineId: string } | null>(null);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });
    const { projects } = useStore();

    const openActionsView = (projectId: string, timelineId: string) => {
        setActiveTimeline({ projectId, timelineId });
        setIsOpen(true);
    };

    const closeActionsView = () => {
        setIsOpen(false);
        setActiveTimeline(null);
    };

    const getTimelineData = (): { timeline: Timeline | null, cards: TimelineCard[], project: any } => {
        if (!activeTimeline) return { timeline: null, cards: [], project: null };

        const project = projects.find(p => p.id === activeTimeline.projectId);
        if (!project) return { timeline: null, cards: [], project: null };

        const timeline = project.timelines.find((t: Timeline) => t.id === activeTimeline.timelineId);
        if (!timeline) return { timeline: null, cards: [], project: null };

        // Sort cards by index
        const sortedCards = [...timeline.cards].sort((a, b) => a.index - b.index);

        return { timeline, cards: sortedCards, project };
    };

    const generateActionCards = () => {
        const { timeline, cards, project } = getTimelineData();
        if (!timeline || !project) return [];

        const timelineIndex = project.timelines.findIndex((t: Timeline) => t.id === timeline.id);
        const actionCards: React.ReactNode[] = [];

        cards.forEach((card, cardIndex) => {
            // Context Images card
            if (card.contextImages && card.contextImages.length > 0) {
                actionCards.push(
                    <ActionCard
                        key={`${card.id}-images`}
                        title="Context Images"
                        index={card.index + 1}
                        variant={timelineIndex + 1}
                        content={
                            <Flex gap="2" wrap="wrap">
                                {card.contextImages.map((img, i) => (
                                    <img
                                        key={i}
                                        src={checkImageUrl(img)}
                                        alt={`Context ${i}`}
                                        className="w-[80px] h-[80px] object-cover rounded-md"
                                    />
                                ))}
                            </Flex>
                        }
                    />
                );
            }

            // Context Prompt card
            if (card.contextPrompt) {
                actionCards.push(
                    <ActionCard
                        key={`${card.id}-prompt`}
                        title="Prompt"
                        index={card.index + 1}
                        variant={timelineIndex + 1}
                        content={
                            <Text size="2">{card.contextPrompt}</Text>
                        }
                    />
                );
            }

            // Settings card
            if (card.contextSettings) {
                actionCards.push(
                    <ActionCard
                        key={`${card.id}-settings`}
                        title="Settings"
                        index={card.index + 1}
                        variant={timelineIndex + 1}
                        content={
                            <Flex direction="column" gap="1">
                                <Text size="1">Model: {card.contextSettings.model}</Text>
                                <Text size="1">Format: {card.contextSettings.format}</Text>
                                <Text size="1">Size: {card.contextSettings.size}</Text>
                                <Text size="1">Quality: {card.contextSettings.quality}</Text>
                                <Text size="1">Variations: {card.contextSettings.variations}</Text>
                            </Flex>
                        }
                    />
                );
            }

            // Output Images cards - one card per image
            if (card.outputImages && card.outputImages.length > 0) {
                card.outputImages.forEach((img, imgIndex) => {
                    actionCards.push(
                        <ActionCard
                            key={`${card.id}-output-${imgIndex}`}
                            title={`Output Image ${imgIndex + 1}`}
                            index={card.index + 1}
                            variant={timelineIndex + 1}
                            content={
                                <img
                                    src={checkImageUrl(img)}
                                    alt={`Output ${imgIndex}`}
                                    className="w-full object-contain rounded-md max-h-[300px]"
                                />
                            }
                        />
                    );
                });
            }
        });

        return actionCards;
    };

    const ActionsViewDialog = () => {
        const { timeline } = getTimelineData();
        const actionCards = generateActionCards();

        if (!timeline) return null;

        return (
            <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
                <Dialog.Content
                    style={{
                        maxWidth: "90vw",
                        width: "90vw",
                        maxHeight: "90vh",
                        margin: "auto"
                    }}
                >
                    <Flex justify="between" align="center" mb="4">
                        <Dialog.Title>Actions View - Timeline</Dialog.Title>
                        <IconButton
                            variant="ghost"
                            radius="full"
                            onClick={closeActionsView}
                            highContrast
                        >
                            <IconX size={18} />
                        </IconButton>
                    </Flex>

                    <div className="w-full overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {actionCards}
                        </div>
                    </div>

                    <Flex justify="between" mt="4">
                        <IconButton
                            variant="soft"
                            onClick={() => emblaApi?.scrollPrev()}
                            disabled={!emblaApi?.canScrollPrev()}
                        >
                            <IconArrowLeft />
                        </IconButton>
                        <IconButton
                            variant="soft"
                            onClick={() => emblaApi?.scrollNext()}
                            disabled={!emblaApi?.canScrollNext()}
                        >
                            <IconArrowRight />
                        </IconButton>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        );
    };

    return {
        openActionsView,
        closeActionsView,
        ActionsViewDialog
    };
}