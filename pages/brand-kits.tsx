"use client";
import Head from 'next/head';
import Image from 'next/image';
import { useCallback } from 'react';
import { IconButton, Flex, Heading, Text, Card, Grid, Box, Button, Separator } from '@radix-ui/themes';
import { IconLayoutSidebarLeftExpandFilled, IconLayoutSidebarLeftCollapse } from '@tabler/icons-react';
import Header from '@/components/Header';
import ProjectNav from '@/components/ProjectNav';
import { GridBackground } from '@/components/GridBackground';
import { ImageLibraryDialog } from '@/components/ImageLibraryDialog';
import { useProjectCreate } from '@/hooks/useProjectCreate';
import useStore from '@/lib/store';

export default function BrandKitsPage() {
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
        <title>Brand Kits • Marketing Studio</title>
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
              <Heading size="6">Brand kits</Heading>
              <Text color="gray">Centralize ALDI Nord assets: logos, color tokens, and templates.</Text>

              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Card>
                  <Flex direction="column" p="4" gap="3">
                    <Heading size="4">Logos</Heading>
                    <Flex align="center" gap="3">
                      <Image src="/aldi-nord.png" alt="ALDI Nord" width={64} height={64} />
                      <Button asChild variant="soft" color="blue">
                        <a href="/aldi-nord.png" download>
                          Download PNG
                        </a>
                      </Button>
                    </Flex>
                    <Text color="gray">Use on light backgrounds. Maintain clear space equal to the "A" height.</Text>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" p="4" gap="3">
                    <Heading size="4">Color palette</Heading>
                    <Grid columns={{ initial: '2', sm: '2' }} gap="3">
                      {[
                        { name: 'Blue 700', var: 'var(--aldi-blue-700)' },
                        { name: 'Blue 600', var: 'var(--aldi-blue-600)' },
                        { name: 'Cyan 400', var: 'var(--aldi-cyan-400)' },
                        { name: 'Red 500', var: 'var(--aldi-red-500)' },
                      ].map((c) => (
                        <Box key={c.name} className="rounded-md overflow-hidden border" style={{ borderColor: 'var(--gray-5)' }}>
                          <Box style={{ background: c.var, height: 56 }} />
                          <Box p="2">
                            <Text size="2">{c.name}</Text>
                            <Text size="1" color="gray">{c.var}</Text>
                          </Box>
                        </Box>
                      ))}
                    </Grid>
                  </Flex>
                </Card>
              </Grid>

              <Card>
                <Flex direction="column" p="4" gap="2">
                  <Heading size="4">Typography</Heading>
                  <Text color="gray">Primary UI uses system fonts via Radix. For marketing, use the brand-approved font where licensed.</Text>
                  <Separator size="4" my="2" />
                  <Text>H1 Example — ALDI Nord Headline</Text>
                  <Text color="gray">Body example — Use sufficient contrast and spacing.</Text>
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

