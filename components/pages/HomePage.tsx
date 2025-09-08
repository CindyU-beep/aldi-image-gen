import { Flex, Heading, Text, Card, Separator, Grid, Box, Button } from '@radix-ui/themes';
import { IconBulb, IconPhotoUp, IconBrandInstagram, IconShieldCheck, IconArrowRight, IconEye } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useProjectCreate } from '@/hooks/useProjectCreate';
import useStore from '@/lib/store';
import { useImageLibrary } from '@/hooks/useImageLibrary';

export default function HomePage() {
    const { openCreateDialog } = useProjectCreate();
    const { libraryImages, fetchLibraryImages } = useImageLibrary();

    useEffect(() => {
        fetchLibraryImages('images', 12);
    }, [fetchLibraryImages]);

    const openLibrary = () => useStore.getState().openImageLibraryDialog();

    return (
        <Flex direction="column" className="flex-1 z-1" px="5" py="6">
            {/* Hero */}
            <span
                style={{
                    background: `linear-gradient(135deg, var(--aldi-blue-600) 0%, var(--aldi-cyan-400) 100%)`,
                    color: 'white',
                    display: 'display-box',
                    overflow: 'visible'
                }}
            >
                <Flex direction="column" align="center" justify="center" p="7" gap="3">
                    <Heading className="text-center !text-white">
                        AI Marketing Studio
                </Heading>
                    <Text className="text-center max-w-[800px]" color="gray" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        Turn your concepts into high-impact visuals with our AI-driven ad builder—designed for Aldi’s brand and audiences.
                    </Text>
                    <Flex gap="3" mt="2">
                        <Button onClick={openCreateDialog} color="blue" variant="solid" className="!rounded-full !px-5">
                            Start a new campaign <IconArrowRight size={18} />
                        </Button>
                        <Button variant="soft" onClick={openLibrary} color="gray" className="!rounded-full !px-5 !text-white">
                            Browse library
                        </Button>
                    </Flex>
                </Flex>
                <Box className="w-full" style={{ height: 8, background: 'var(--aldi-orange-500)' }} />
            </span>

            {/* Features */}
            <Grid gap="4" columns={{ initial: '1', md: '2', lg: '4' }} justify="center" py="6" width="100%" maxWidth="1280px" className="x-container">
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconBulb color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Campaign Generator</Heading>
                        <Text color="gray">Enter your campaign idea, generate AI ad variations, and iterate with confidence.</Text>
                    </Flex>
                </Card>
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconPhotoUp color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Product Photoshoots</Heading>
                        <Text color="gray">Transform everyday photos into high-impact, brand-ready visuals.</Text>
                    </Flex>
                </Card>
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconBrandInstagram color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Made for all formats</Heading>
                        <Text color="gray">Automatically generate ad sizes for every platform—social, search, and display.</Text>
                    </Flex>
                </Card>
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconShieldCheck color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Brand guardrails</Heading>
                        <Text color="gray">Ensure brand consistency at scale with built-in guardrails and AI-powered approvals</Text>
                    </Flex>
                </Card>
            </Grid>

            <Separator my="4" size="4" />

            {/* Recent generations strip */}
            <Box className="w-full max-w-[1280px] mx-auto">
                <Flex justify="between" align="center" mb="4">
                    <Heading size="6">Recent generations</Heading>
                    <Button variant="ghost" onClick={openLibrary} className="!text-[var(--aldi-blue-600)]">
                        View all <IconArrowRight size={16} />
                    </Button>
                </Flex>
                {/* Pinterest-style masonry grid */}
                <Box 
                    className="mt-4"
                    style={{
                        columns: 'auto',
                        columnWidth: '280px',
                        columnGap: '16px',
                        columnFill: 'balance'
                    }}
                >
                    {[...libraryImages].slice(-12).reverse().map((img, index) => (
                        <Box 
                            key={img.url} 
                            className="group relative rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-white mb-4 break-inside-avoid"
                            style={{ 
                                borderColor: 'var(--gray-4)',
                                display: 'inline-block',
                                width: '100%'
                            }}
                        >
                            <img 
                                src={img.url} 
                                alt={`Generated image ${index + 1}`}
                                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                style={{ display: 'block' }}
                            />
                            <Box 
                                className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            />
                            <Box 
                                className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                                <Flex justify="between" align="end">
                                    <Box>
                                        <Text size="2" className="text-white font-medium drop-shadow-lg">
                                            AI Generated
                                        </Text>
                                        <Text size="1" className="text-white/80 drop-shadow-lg">
                                            Campaign #{index + 1}
                                        </Text>
                                    </Box>
                                    <Button size="1" variant="soft" className="!bg-white/20 !text-white !backdrop-blur-sm">
                                        <IconEye size={14} />
                                    </Button>
                                </Flex>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Empty state if no images */}
                {libraryImages.length === 0 && (
                    <Heading size="4" className="mb-2 text-center py-12">No generations yet</Heading>
                )}
            </Box>
        </Flex>
    );
}