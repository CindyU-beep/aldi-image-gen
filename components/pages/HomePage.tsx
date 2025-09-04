import { Flex, Heading, Text, Card, Separator, Grid, Box, Button } from '@radix-ui/themes';
import { IconBulb, IconPhotoUp, IconBrandInstagram, IconShieldCheck, IconArrowRight } from '@tabler/icons-react';
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
        <Flex direction="column" className="flex-1 z-1 overflow-auto" px="4" py="6">
            {/* Hero */}
            <Card
                size="4"
                className="x-container x-hero-banner overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, var(--aldi-blue-600) 0%, var(--aldi-cyan-400) 100%)`,
                    color: 'white'
                }}
            >
                <Flex direction="column" align="center" justify="center" p="7" gap="3">
                    <Heading className="text-center !text-white">
                        Marketing Studio for ALDI Nord
                </Heading>
                    <Text className="text-center max-w-[800px]" color="gray" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        Create campaign visuals, product packshots, and social formats — fast, on-brand, and collaborative.
                    </Text>
                    <Flex gap="3" mt="2">
                        <Button onClick={openCreateDialog} color="blue" variant="solid" className="!rounded-full !px-5">
                            Start a new campaign <IconArrowRight size={18} />
                        </Button>
                        <Button variant="soft" onClick={openLibrary} color="gray" className="!rounded-full !px-5">
                            Browse library
                        </Button>
                    </Flex>
                </Flex>
                <Box className="w-full" style={{ height: 8, background: 'var(--aldi-orange-500)' }} />
                </Card>

            {/* Features */}
            <Grid gap="4" columns={{ initial: '1', md: '2', lg: '4' }} justify="center" py="6" width="100%" maxWidth="1280px" className="x-container">
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconBulb color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Campaign generator</Heading>
                        <Text color="gray">Enter a brief, generate variations, compare timelines, and approve.</Text>
                    </Flex>
                </Card>
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconPhotoUp color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Product packshots</Heading>
                        <Text color="gray">Clean backgrounds, consistent lighting, PSD/PNG export.</Text>
                    </Flex>
                </Card>
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconBrandInstagram color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Social formats</Heading>
                        <Text color="gray">Ready-to-use sizes for Instagram, Facebook, flyers, and POS.</Text>
                    </Flex>
                </Card>
                <Card className="x-modern-card">
                    <Flex direction="column" p="4" gap="2">
                        <span className="x-feature-icon"><IconShieldCheck color="var(--aldi-blue-600)" /></span>
                        <Heading size="4">Brand guardrails</Heading>
                        <Text color="gray">Colors, logo safe zones, and approvals built-in.</Text>
                    </Flex>
                </Card>
            </Grid>

            <Separator my="4" size="4" />

            {/* Recent generations strip */}
            <Box className="w-full max-w-[1280px] mx-auto">
                <Flex justify="between" align="center" mb="2">
                    <Heading size="5">Recent generations</Heading>
                    <Button variant="ghost" onClick={openLibrary}>View all</Button>
                </Flex>
                <Grid columns={{ initial: '2', sm: '3', md: '4', lg: '6' }} gap="3">
                    {[...libraryImages].slice(-12).reverse().map(img => (
                        <Box key={img.url} className="rounded-md overflow-hidden border" style={{ borderColor: 'var(--gray-5)' }}>
                            <img src={img.url} alt="Recent" className="w-full h-[140px] object-cover" />
                        </Box>
                    ))}
                </Grid>
                </Box>
            </Flex>
    );
}