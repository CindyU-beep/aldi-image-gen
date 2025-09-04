"use client";
import Head from 'next/head';
import { useCallback } from 'react';
import { IconButton, Flex, Heading, Text, Card, Separator, Grid, Box } from '@radix-ui/themes';
import { IconLayoutSidebarLeftExpandFilled, IconLayoutSidebarLeftCollapse } from '@tabler/icons-react';
import Header from '@/components/Header';
import ProjectNav from '@/components/ProjectNav';
import { GridBackground } from '@/components/GridBackground';
import { ImageLibraryDialog } from '@/components/ImageLibraryDialog';
import { useProjectCreate } from '@/hooks/useProjectCreate';
import useStore from '@/lib/store';

export default function BrandGuidelinesPage() {
  const assideOpen = useStore(state => state.asside);
  const setAsside = useStore(state => state.setAsside);
  const { ProjectCreateDialog } = useProjectCreate();

  const toggleSidebar = useCallback(() => {
    setAsside(!assideOpen);
  }, [assideOpen, setAsside]);

  const handleProjectClick = () => {
    window.location.href = '/';
  };

  const handlePageChange = () => {
    window.location.href = '/';
  };

  return (
    <>
      <Head>
        <title>Brand Guidelines • Marketing Studio</title>
      </Head>
      <Header />
      <Flex className="h-screen w-full">
        <Box
          className="x-aside"
          style={{
            width: !assideOpen ? '0px' : '340px',
            flexShrink: 0,
            transition: 'width 0.3s ease'
          }}
        >
          {assideOpen && (
            <ProjectNav
              onProjectClicked={handleProjectClick}
              selectedPage={'home'}
              onPageChange={handlePageChange}
            />
          )}
        </Box>

        <Flex className="x-main w-full overflow-auto z-2">
          <Flex className="px-4 py-2 z-2">
            <IconButton
              onClick={toggleSidebar}
              variant="ghost"
              my="1"
              mx="1"
              className="!cursor-pointer"
              highContrast
            >
              {!assideOpen ? (
                <IconLayoutSidebarLeftExpandFilled />
              ) : (
                <IconLayoutSidebarLeftCollapse />
              )}
            </IconButton>
          </Flex>
          <Flex className="flex-1 overflow-auto relative">
            <GridBackground />
            <Flex direction="column" className="p-6 gap-5 w-full">
              <Heading size="6">Brand guidelines</Heading>
              <Text color="gray">Usage rules, safe zones, approvals, and policy references for ALDI Nord branding.</Text>

              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Card>
                  <Flex direction="column" p="4" gap="2">
                    <Heading size="4">Logo usage</Heading>
                    <Text>- Maintain minimum clear space equal to the height of the "A".</Text>
                    <Text>- Do not rotate, distort, or apply effects.</Text>
                    <Text>- Use full-color logo on light backgrounds; use monochrome where required.</Text>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" p="4" gap="2">
                    <Heading size="4">Color usage</Heading>
                    <Text>- Use brand blues for primary actions and accents.</Text>
                    <Text>- Reserve orange/red for highlights, warnings, or promotions.</Text>
                    <Text>- Ensure WCAG AA contrast for text and UI.</Text>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" p="4" gap="2">
                    <Heading size="4">Imagery</Heading>
                    <Text>- Product imagery on clean, uncluttered backgrounds.</Text>
                    <Text>- Avoid overlapping logos and busy textures.</Text>
                    <Text>- Prefer natural lighting and consistent shadows.</Text>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" p="4" gap="2">
                    <Heading size="4">Copy and tone</Heading>
                    <Text>- Clear, concise, value-forward. Avoid superlatives unless substantiated.</Text>
                    <Text>- Use sentence case for UI and headlines.</Text>
                    <Text>- Localize for markets; avoid idioms that don’t translate.</Text>
                  </Flex>
                </Card>
              </Grid>

              <Card>
                <Flex direction="column" p="4" gap="2">
                  <Heading size="4">Approvals and compliance</Heading>
                  <Text>- Include legal checks for promotional claims.</Text>
                  <Text>- Archived assets should be immutable; use versioning for updates.</Text>
                  <Separator size="4" my="2" />
                  <Text color="gray">This section can later connect to workflow approvals.</Text>
                </Flex>
              </Card>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <ProjectCreateDialog />
      <ImageLibraryDialog />
    </>
  );
}

