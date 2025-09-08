'use client'
import { useMemo, useEffect, useState, useCallback } from 'react';
import { Tooltip, Card, Flex, Heading, IconButton } from '@radix-ui/themes';
import { IconTrash, IconSquareRoundedPlus } from '@tabler/icons-react'; // Removed IconCarouselHorizontal
import TimelineCard from '@/components/TimelineCard';
import TimelineCardNew from '@/components/TimelineCardNew';
import TimelineSyncContainer from '@/components/TimelineSyncContainer';
import EditableTimelineName from '@/components/EditableTimelineName';
import useStore from '@/lib/store';

// Define card interface for better reusability and type safety
export interface TimelineCard {
    id: string;
    index: number;
    contextUrl: string;
    contextPrompt: string;
    contextImages: string[];
    outputImages: string[];
    outputContextImage: string | null;
    contextSettings: {
        model: string;
        engine?: string;
        format: string;
        size: string;
        quality: string;
        background?: string;
        fidelity?: string;
        variations: number;
    };
}

export type Timeline = {
    id: string;
    name: string;
    cards: TimelineCard[];
};

const CARD_WIDTH = 400;
const CARD_GAP = 12;
const CARD_ADD_WIDTH = 24;

interface TimelineProps {
    projectId: string;
    timelines: Timeline[];
    addTimeline: (projectId: string, timelineId: string) => void;
    removeTimeline: (projectId: string, timelineId: string) => void;
}

interface TimelineCardResult {
    elements: React.ReactNode[];
    leftPadding: number;
    rightPadding: number;
}

export default function Timeline({ projectId, timelines, addTimeline, removeTimeline }: TimelineProps) {
    const asside = useStore(state => state.asside);
    const updateTimelineName = useStore(state => state.updateTimelineName);
    const [timelineWidth, setTimelineWidth] = useState<number>(0);
    // Use openActionsView directly from store
    // const openActionsView = useStore(state => state.openActionsView);

    // Calculate timeline width based on window size and asside state
    const calculateTimelineWidth = useCallback(() => {
        const windowWidth = window.innerWidth;
        const assideWidth = asside ? 340 : 0;
        const otherPaddings = 96;

        const availableWidth = windowWidth - assideWidth - otherPaddings;
        setTimelineWidth(availableWidth);
    }, [asside]);

    // Initialize width on component mount and recalculate on window resize
    useEffect(() => {
        calculateTimelineWidth();
        window.addEventListener('resize', calculateTimelineWidth);

        return () => {
            window.removeEventListener('resize', calculateTimelineWidth);
        };
    }, [calculateTimelineWidth]);

    // Calculate maximum index across all timelines in a project
    const calculateMaxIndex = useCallback((timelines: Timeline[]): number => {
        let maxIndex = 0;
        timelines.forEach(timeline => {
            if (timeline.cards.length > 0) {
                const timelineMaxIndex = Math.max(...timeline.cards.map(card => card.index));
                maxIndex = Math.max(maxIndex, timelineMaxIndex);
            }
        });
        return maxIndex;
    }, []);

    // Find the minimum index across all timelines in a project
    const calculateMinIndex = useCallback((timelines: Timeline[]): number => {
        let minIndex = Infinity;
        timelines.forEach(timeline => {
            if (timeline.cards.length > 0) {
                const timelineMinIndex = Math.min(...timeline.cards.map(card => card.index));
                minIndex = Math.min(minIndex, timelineMinIndex);
            }
        });
        return minIndex === Infinity ? 0 : minIndex;
    }, []);

    // Generate timeline cards with proper alignment
    const generateTimelineCards = useCallback((timeline: Timeline, projectId: string, startIndex: number, maxIndex: number): TimelineCardResult => {
        const elements: React.ReactNode[] = [];
        const sortedCards = [...timeline.cards].sort((a, b) => a.index - b.index);

        // Calculate effective start and end indices for this timeline
        const firstCardIndex = sortedCards.length > 0 ? sortedCards[0].index : 0;
        const lastCardIndex = sortedCards.length > 0 ? sortedCards[sortedCards.length - 1].index : 0;

        // Calculate padding values based on card width + gap
        const leftPadding = (firstCardIndex - startIndex) * (CARD_WIDTH + CARD_GAP);
        const rightPadding = (maxIndex - lastCardIndex) * (CARD_WIDTH + CARD_GAP) + CARD_ADD_WIDTH;

        // Add the actual timeline cards
        sortedCards.forEach((card, arrayIndex) => {
            elements.push(
                <TimelineCard
                    key={card.id}
                    projectId={projectId}
                    timelineId={timeline.id}
                    card={card}
                    index={card.index}
                    width={CARD_WIDTH}
                    isLast={arrayIndex === sortedCards.length - 1}
                />
            );
        });

        return {
            elements,
            leftPadding,
            rightPadding
        };
    }, []);

    // Memoize indices calculation to avoid recalculating on every render
    const { minIndex, maxIndex } = useMemo(() => ({
        minIndex: calculateMinIndex(timelines),
        maxIndex: calculateMaxIndex(timelines)
    }), [timelines, calculateMinIndex, calculateMaxIndex]);

    // Find the card with the highest index in this specific timeline
    const getLastCardImageForTimeline = (timeline: Timeline): string | null => {
        if (!timeline || timeline.cards.length === 0) return null;

        const maxIndex = Math.max(...timeline.cards.map(c => c.index));
        const lastCard = timeline.cards.find(c => c.index === maxIndex);

        if (!lastCard) return null;

        // First try to use the selected context image
        if (lastCard.outputContextImage) {
            return lastCard.outputContextImage;
        }

        // If no context image is selected, use the first output image as fallback
        if (lastCard.outputImages && lastCard.outputImages.length > 0) {
            return lastCard.outputImages[0];
        }

        return null;
    };

    return (
        <>
            {timelines.map((timeline, timelineIndex) => {
                // Generate cards and get padding information
                const { elements, leftPadding, rightPadding } = generateTimelineCards(
                    timeline,
                    projectId,
                    minIndex,
                    maxIndex
                );

                // Determine if this is the last timeline
                const isLastTimeline = timelineIndex === timelines.length - 1;
                const timelineClasses = `${isLastTimeline ? 'x-timeline-last x-timeline-animate' : ''}`;

                return (
                    <Flex key={timeline.id} className={timelineClasses} style={{ width: `${timelineWidth}px` }}>
                        <Card size="5" className="x-timeline" mb="4">
                            <Flex justify="between" align="center" mb="2">
                                <EditableTimelineName
                                    name={timeline.name || `Variant ${timelineIndex + 1}`}
                                    onNameChange={(newName) => updateTimelineName(projectId, timeline.id, newName)}
                                    size="4"
                                />
                                {/* <Tooltip content="Actions view">
                                    <IconButton
                                        variant="ghost"
                                        radius="full"
                                        onClick={() => openActionsView(projectId, timeline.id)}
                                        highContrast
                                        aria-label="Actions view"
                                    >
                                        <IconCarouselHorizontal size={20} />
                                    </IconButton>
                                </Tooltip> */}
                                <Tooltip content="Delete timeline & cards">
                                    <IconButton
                                        variant="ghost"
                                        radius="full"
                                        onClick={() => removeTimeline(projectId, timeline.id)}
                                        highContrast
                                        aria-label="Delete timeline"
                                    >
                                        <IconTrash size={20} />
                                    </IconButton>
                                </Tooltip>
                            </Flex>
                            <TimelineSyncContainer group="timelines">
                                <Flex align="center" minWidth="max-content" pb="3" width="100%">
                                    {/* Container with left and right padding */}
                                    <div
                                        style={{
                                            marginLeft: leftPadding > 0 ? `${leftPadding}px` : '0',
                                            paddingRight: rightPadding > 0 ? `${rightPadding}px` : '0'
                                        }}
                                    >
                                        <Flex gap="4" align="center">
                                            {elements}
                                            <TimelineCardNew
                                                key="new-card"
                                                projectId={projectId}
                                                timelineId={timeline.id}
                                                index={timeline.cards.length > 0 ? Math.max(...timeline.cards.map(c => c.index)) + 1 : 0}
                                                contextUrl={timeline.cards.length > 0 ? timeline.cards[0].contextUrl : ''}
                                                inputContextImage={getLastCardImageForTimeline(timeline)}
                                            />
                                        </Flex>
                                    </div>
                                </Flex>
                            </TimelineSyncContainer>
                            <Flex justify="end" mt="3">
                                <Tooltip content="New timeline">
                                    <IconButton
                                        variant="ghost"
                                        radius="full"
                                        onClick={() => addTimeline(projectId, timeline.id)}
                                        highContrast
                                        aria-label="Add timeline"
                                    >
                                        <IconSquareRoundedPlus size={20} />
                                    </IconButton>
                                </Tooltip>
                            </Flex>
                        </Card>
                    </Flex>
                );
            })}
        </>
    );
}