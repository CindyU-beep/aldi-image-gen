import { Card, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { IconSquareRoundedArrowRight } from '@tabler/icons-react';
import useStore from '../lib/store';

interface TimelineCardNewProps {
    projectId: string
    timelineId: string
    index: number,
    contextUrl: string
    inputContextImage: string | null
}

export default function TimelineCardNew({ projectId, timelineId, index, contextUrl, inputContextImage }: TimelineCardNewProps) {

    const { addCard } = useStore();

    return (
        <Card variant="ghost" className="x-card-new">
            <Flex direction="column" align="center" justify="center" className="h-full mx-2">
                <Tooltip content="Modify" delayDuration={0}>
                    <IconButton variant="ghost" radius="full" onClick={() => addCard(projectId, timelineId, index, contextUrl, inputContextImage)} highContrast>
                        <IconSquareRoundedArrowRight size={24} />
                    </IconButton>
                </Tooltip>
            </Flex>
        </Card>
    )
}