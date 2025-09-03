import { useSyncScroll } from '@/hooks/useSyncScroll';
import { Flex } from '@radix-ui/themes';

type TimelineSyncContainerProps = {
    group: string;
    children: React.ReactNode;
};

export default function TimelineSyncContainer({ group, children }: TimelineSyncContainerProps) {
    const scrollRef = useSyncScroll(group);

    return (
        <Flex
            ref={scrollRef}
            className="overflow-x-auto smooth-scrollbar"
        >
            {children}
        </Flex>
    );
}