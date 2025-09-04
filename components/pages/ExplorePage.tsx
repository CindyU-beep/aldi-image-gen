import { Flex, Box, Heading, Spinner, Text } from '@radix-ui/themes';
import { useEffect, useState, useRef } from 'react';
import { useImageLibrary } from '@/hooks/useImageLibrary';

export default function ExplorePage() {
    const { libraryImages, fetchLibraryImages, isLoading } = useImageLibrary();
    const [hasScrolled, setHasScrolled] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

    // Fetch images from the "images" container on mount
    useEffect(() => {
        fetchLibraryImages('images', 50);
    }, [fetchLibraryImages]);

    // Handler for image click toggling selection
    const handleImageClick = (url: string) => {
        setSelectedImage((prev) => (prev === url ? null : url));
    };

    return (
        <Flex direction="column" className="flex-1 z-1">
            <Box position="fixed" top="0" width="calc(100% - 80px)" pr="4" className={`backdrop-blur-sm z-10 transition-shadow duration-200 ${hasScrolled ? 'shadow-lg' : ''}`}>
                <Flex justify="between" align="center">
                    <Heading size="5" as="h1" my="1" className="py-2">
                        Explore
                    </Heading>
                    <Text size="2" color="gray">
                        Last ({libraryImages.length}) generations
                    </Text>
                </Flex>
            </Box>
            <Box pt="80px" className="overflow-auto p-4 flex-1" ref={scrollContainerRef}>
                {isLoading ? (
                    <Flex justify="center" align="center" className="flex-1 h-full">
                        <Spinner size="3" mr="2" />
                        <Text color="gray">Loading images...</Text>
                    </Flex>
                ) : libraryImages.length === 0 ? (
                    <Flex justify="center" align="center" className="flex-1 h-full">
                        <Text color="gray">No images found.</Text>
                    </Flex>
                ) : (
                    <Box className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                        {[...libraryImages].reverse().map((image) => (
                            <Box
                                key={image.url}
                                className={`x-explore-grid-container break-inside-avoid cursor-pointer rounded-lg overflow-hidden ${selectedImage && selectedImage !== image.url ? 'filter grayscale' : ''
                                    }`}
                                onClick={() => handleImageClick(image.url)}
                            >
                                <img
                                    src={image.url}
                                    alt="Explore"
                                    className="x-exploregrid-image"
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Flex>
    );
}