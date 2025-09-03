import { Flex, Heading, Text, Card, Separator, Grid, Box, Link } from '@radix-ui/themes';
import { IconTimelineEvent, IconSquareRoundedArrowRight, IconSeo } from '@tabler/icons-react';
import Image from 'next/image';

export default function ExplorePage() {
    const contacts = [
        { name: 'Rafal Rutyna', email: 'rafal.rutyna@microsoft.com' },
    ];

    return (
        <Flex direction="column" align="center" justify="center" className="flex-1 z-1 overflow-hidden" px="4" py="2">
            {/* Hero Section */}
            <Flex direction="column" align="center" justify="center" gap="2" my="9">
                <Flex direction="row" align="center" justify="center" gap="2" className="relative">
                    <Heading className="!text-2xl xl:!text-5xl 2xl:!text-7xl 3xl:!text-9xl text-center bg-clip-text text-transparent bg-gradient-to-br from-neutral-200 to-neutral-600 p-4">
                        <Text>Welcome to ImageDojo</Text>
                        <img src="/assets/ninja.png" alt="Gradient" className="hidden 3xl:block w-[80px] absolute bottom-[20px] left-[49.25%]" />
                    </Heading>
                </Flex>
                <Heading size="7" as="h2" color="gray" className="text-center">
                    AI image generation and comparision lab
                </Heading>
                <Separator orientation="horizontal" size="2" className="!hidden 3xl:m-4 3xl:!block" />
                <Text>
                    Create image modifications and compare them side by side. Use OpenAI and Google models to generate images and modify them with our easy-to-use interface.
                </Text>
            </Flex>

            {/* Image Section */}
            <Grid
                gap="4"
                columns="6"
                justify="center"
                mb="8"
            >
                {[...Array(6)].map((_, index) => (
                    <img
                        key={index}
                        src={`/home/home-${index + 1}.png`}
                        alt="Background Image"
                        className="w-[100px] 3xl:w-[150px] rounded-lg object-cover"
                    />
                ))}
            </Grid>

            {/* Cards Section */}
            <Grid gap="4" columns={{ initial: "1", md: "2", lg: "3" }} justify="center" py="4" width="100%" maxWidth="1440px">
                <Card size="3">
                    <Flex align="center" gap="2" mb="4" className="flex-row 3xl:flex-col 3xl:!items-start">
                        <IconTimelineEvent size={36} className="3xl:mb-2" color="#3e63dd" />
                        <Heading size="4">Timeline</Heading>
                    </Flex>
                    <Text as="p" my="4">
                        The timeline is the heart of ImageDojo, where you can see all your image modifications and their progress.
                        One project can have multiple timelines, and each timeline can have multiple modification cards.
                    </Text>
                    <Text as="p" my="4">
                        Imageine this, when you create a set of images, each veriant can be a new timeline with its own set of modification cards.
                    </Text>
                </Card>
                <Card size="3">
                    <Flex align="center" gap="2" mb="4" className="flex-row 3xl:flex-col 3xl:!items-start">
                        <IconSquareRoundedArrowRight size={36} className="3xl:mb-2" color="#3e63dd" />
                        <Heading size="4">Modification</Heading>
                    </Flex>
                    <Text as="p" my="4">
                        Modification cards are the building blocks of your timeline.
                        Each card represents a single modification to an image.
                    </Text>
                    <Text as="p" my="4">
                        Each modification can hold multiple outputs from the image generation process.
                        The best part, you can fork a modification to create a new timeline with the same starting point.
                    </Text>
                </Card>
                <Card size="3">
                    <Flex align="center" gap="2" mb="4" className="flex-row 3xl:flex-col 3xl:!items-start">
                        <IconSeo size={36} className="3xl:mb-2" color="#3e63dd" />
                        <Heading size="4">Search engine optimisation</Heading>
                    </Flex>
                    <Text as="p" my="4">
                        This feature is intended for products imported from Shopbop or Amazon and designed for eCommerce optimisation.
                        For best results, the first image in your timeline should be a model shot imported via product search, with any modifications made afterward.
                    </Text>
                    <Text as="p" my="4">
                        Make sure that the image you are using is not imported from the local library, as this will not work as well.
                    </Text>
                </Card>
            </Grid >
            <Flex className="flex flex-col items-center">
                <Box className="mb-4 mt-8">
                    Created by{' '}
                    {contacts.map((contact, index) => (
                        <span key={index}>
                            <Link href={`mailto:${contact.name}<${contact.email}>?subject=ImageDojo`}>
                                {contact.name}
                            </Link>
                            {index < contacts.length - 1 && ', '}
                        </span>
                    ))} • Global Black Belt Asia
                </Box>
                <Image
                    src="/assets/microsoft-logo-white.svg"
                    alt="Microsoft"
                    width="120"
                    height="40"
                />
            </Flex>
        </Flex >
    );
}