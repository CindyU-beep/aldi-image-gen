'use client'
import { useState } from 'react';
import Toolbar from '@/components/Toolbar';
import Header from '@/components/Header';
import { IconButton, Flex, Box } from '@radix-ui/themes';
import { IconLayoutSidebarLeftExpandFilled, IconLayoutSidebarLeftCollapse } from '@tabler/icons-react';
import { GridBackground } from '@/components/GridBackground';
import ProjectNav from '@/components/ProjectNav';
import HomePage from '@/components/pages/HomePage';
import ExplorePage from '@/components/pages/ExplorePage';
import ProjectPage from '@/components/pages/ProjectPage';
import { useProjectCreate } from '@/hooks/useProjectCreate';
import { ImageLibraryDialog } from '@/components/ImageLibraryDialog';
import useStore from '@/lib/store';

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<'home' | 'explore' | 'project'>('home');
  const assideOpen = useStore(state => state.asside);
  const setAsside = useStore(state => state.setAsside);
  const { ProjectCreateDialog } = useProjectCreate();

  const handleProjectClick = (id: string) => {
    setSelectedProjectId(id);
    setSelectedPage('project');
  };

  const handlePageChange = (page: 'home' | 'explore') => {
    setSelectedPage(page);
  };

  const toggleSidebar = () => {
    setAsside(!assideOpen);
  };

  return (
    <>
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
              selectedPage={selectedPage === 'project' ? 'home' : selectedPage}
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

            {selectedPage === 'home' && (
              <HomePage />
            )}

            {selectedPage === 'explore' && (
              <ExplorePage />
            )}

            {selectedPage === 'project' && selectedProjectId && (
              <ProjectPage selectedProjectId={selectedProjectId} />
            )}

          </Flex>
        </Flex>
      </Flex>
      {selectedPage === 'project' && selectedProjectId && (
        <Toolbar />
      )}
      <ProjectCreateDialog />
      <ImageLibraryDialog />
    </>
  );
}