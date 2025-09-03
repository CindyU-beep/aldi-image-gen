import { Dialog, Text, Box, IconButton, Flex, Button } from '@radix-ui/themes';
import { IconX } from '@tabler/icons-react';
import useStore from '../lib/store';
import { useState, useEffect, useMemo } from 'react';
import { getModelDisplayName } from '@/lib/helpers';
import { CompareImageCard } from './CompareImageCard';
import { CompareSlider } from './CompareSlider';

type CompareProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function Compare({ open, onOpenChange }: CompareProps) {
    const compareImages = useStore(state => state.compare);
    const [isSideBySide, setIsSideBySide] = useState(false);
    const [imageSettings, setImageSettings] = useState<Array<any>>([null, null]);
    const [modelNames, setModelNames] = useState<Array<string>>(['', '']);

    const hasValidCompare = compareImages.length === 2;

    // Fetch settings and model names when compareImages changes
    useEffect(() => {
        if (compareImages.length === 2) {
            const { genSettings, projects } = useStore.getState();

            const leftSettings = genSettings(compareImages[0]);
            const rightSettings = genSettings(compareImages[1]);
            setImageSettings([leftSettings, rightSettings]);

            // Calculate model names
            const newModelNames = compareImages.map((imageUrl, index) => {
                const contextImagesArray = projects.flatMap(
                    p => p.timelines.flatMap(
                        t => t.cards.filter(c => c.outputContextImage === imageUrl)
                    )
                )[0]?.contextImages || [];

                const settings = index === 0 ? leftSettings : rightSettings;
                return getModelDisplayName(
                    settings?.model,
                    settings?.engine,
                    Boolean(contextImagesArray.length)
                );
            });
            setModelNames(newModelNames);
        } else {
            setImageSettings([null, null]);
            setModelNames(['', '']);
        }
    }, [compareImages]);

    // Memoize the max width calculation
    const maxWidth = useMemo(() =>
        isSideBySide ? "calc(2144px / 2 - 24px)" : "calc(1072px / 2 - 24px)",
        [isSideBySide]
    );

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content
                maxWidth={isSideBySide ? "2144px" : "1072px"}
                maxHeight="95vh"
            >
                <IconButton
                    aria-label="Close"
                    variant="ghost"
                    color="gray"
                    radius="full"
                    onClick={() => onOpenChange(false)}
                    style={{ position: 'absolute', top: 20, right: 20 }}
                >
                    <IconX size="18" />
                </IconButton>
                <Dialog.Title>Compare</Dialog.Title>
                <Box style={{ maxHeight: "calc(85vh - 70px)" }} overflow="auto">
                    {hasValidCompare ? (
                        isSideBySide ? (
                            <Flex gap="4" align="center" justify="center">
                                {compareImages.map((imageUrl, index) => (
                                    <CompareImageCard
                                        key={imageUrl}
                                        imageUrl={imageUrl}
                                        imageSettings={imageSettings[index]}
                                        modelName={modelNames[index]}
                                        maxWidth={maxWidth}
                                    />
                                ))}
                            </Flex>
                        ) : (
                            <Box className="x-compare-slider-container">
                                <CompareSlider
                                    leftImageUrl={compareImages[0]}
                                    rightImageUrl={compareImages[1]}
                                />
                            </Box>
                        )
                    ) : (
                        <Box py="6">
                            <Text align="center" size="2" color="gray">
                                Select exactly 2 images to compare from your results
                            </Text>
                        </Box>
                    )}
                </Box>
                <Flex align="center" justify="center" mt="5">
                    <Button
                        highContrast
                        onClick={() => setIsSideBySide(!isSideBySide)}
                    >
                        {isSideBySide ? "Overlay Slider" : "Side by Side"}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    )
}