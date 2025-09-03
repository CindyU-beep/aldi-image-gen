import { IconButton, Flex, Box, Heading, Tooltip } from '@radix-ui/themes';
import { IconTrash, IconCubeUnfolded } from '@tabler/icons-react';
import useStore from '@/lib/store';
import Timeline from '@/components/Timeline';
import { useEffect, useState, useRef } from 'react';
import { useActionsView } from '@/hooks/useActionsView';

export interface CardData {
    id: string
    index: number
    contextUrl: string
    contextPrompt: string
    contextImages: string[]
    outputImages: string[]
    outputContextImage: string | null
    contextSettings?: {
        model?: string
        engine?: string
        format?: string
        size?: string
        quality?: string
        background?: string
        fidelity?: string
        variations?: number
    }
}

interface ProjectProps {
    selectedProjectId: string | null;
}

export default function ProjectPage({ selectedProjectId }: ProjectProps) {
    const {
        projects,
        removeProject,
        addTimeline,
        removeTimeline,
    } = useStore();

    const { ActionsViewDialog } = useActionsView();

    const [hasScrolled, setHasScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Compact scroll detection effect
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkScroll = () => setHasScrolled(container.scrollTop > 50);
        container.addEventListener('scroll', checkScroll);
        checkScroll();

        return () => container.removeEventListener('scroll', checkScroll);
    }, []);

    // Map function to transform timelines for the Timeline component
    const mapTimelinesForComponent = (projectTimelines: any[]) => {
        return projectTimelines.map(timeline => ({
            ...timeline,
            cards: timeline.cards.map((card: any) => ({
                ...card,
            }))
        }));
    };

    // Get the current project - either the selected one or the first one
    const currentProject = selectedProjectId
        ? projects.find(project => project.id === selectedProjectId)
        : projects.length > 0 ? projects[0] : null;

    // Get the current project name for the title
    const pageTitle = currentProject ? currentProject.name : 'No Project';

    return (
        <Flex direction="column" className="flex-1" px="4" py="2">
            {currentProject ? (
                <>
                    <Box position="fixed" top="0" width="calc(100% - 80px)" pr="4" className={`backdrop-blur-sm z-10 transition-shadow duration-200 ${hasScrolled ? 'shadow-lg' : ''}`}>
                        <Flex justify="between" align="center">
                            <Heading size="5" as="h1" my="1" className="py-2">
                                {pageTitle}
                            </Heading>
                            <Tooltip content="Delete project" side="bottom">
                                <IconButton
                                    variant="ghost"
                                    radius="full"
                                    onClick={() => removeProject(currentProject.id)}
                                    highContrast
                                >
                                    <IconTrash size={20} />
                                </IconButton>
                            </Tooltip>
                        </Flex>
                    </Box>

                    <Flex
                        ref={scrollContainerRef}
                        direction="column"
                        justify={currentProject.timelines.length === 1 ? "center" : "start"}
                        gap="3"
                        className="flex-1 overflow-auto pt-[60px]"
                    >
                        <Timeline
                            projectId={currentProject.id}
                            timelines={mapTimelinesForComponent(currentProject.timelines)}
                            addTimeline={addTimeline}
                            removeTimeline={removeTimeline}
                        />
                    </Flex>
                </>
            ) : (
                <Flex direction="column" className="flex-1" gap="3" align="center" justify="center">
                    <IconCubeUnfolded size={100} color="gray" />
                    <Heading size="5" color="gray">Select or create a project.</Heading>
                </Flex>
            )}
            <ActionsViewDialog />
        </Flex>
    );
}