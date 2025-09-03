import { useEffect, useRef } from 'react';
import { Flex, Box, Heading, Separator, Text } from '@radix-ui/themes';
import { IconCubeUnfolded, IconCirclePlus, IconPhoto, IconHome, IconLayout2, IconEdit, IconDatabaseX } from '@tabler/icons-react';
import { useProjectCreate } from '@/hooks/useProjectCreate';
import { useProjectEdit } from '@/hooks/useProjectEdit';
import { useStoreReset } from '@/hooks/useStoreReset';
import useStore from '@/lib/store';

const navClasses = "w-full cursor-pointer border-radius-md hover:bg-[var(--gray-2)] transition-colors rounded-md";

type ProjectNavProps = {
    onProjectClicked: (id: string) => void;
    selectedPage: 'home' | 'explore';
    onPageChange: (page: 'home' | 'explore') => void;
}

export default function ProjectNav({ onProjectClicked, onPageChange }: ProjectNavProps) {
    const { projects } = useStore();
    const { openCreateDialog } = useProjectCreate();
    const { openEditDialog, ProjectEditDialog } = useProjectEdit();
    const { openResetDialog, ResetConfirmDialog } = useStoreReset();
    const prevProjectsLengthRef = useRef(projects.length);

    useEffect(() => {
        // Check if projects length has increased and automatically select the latest project
        if (projects.length > prevProjectsLengthRef.current) {
            const latestProject = projects[projects.length - 1];
            if (latestProject) {
                onProjectClicked(latestProject.id);
            }
        }
        prevProjectsLengthRef.current = projects.length;
    }, [projects, onProjectClicked]);

    return (
        <Flex direction="column" px="4" py="2" className="x-project-nav flex-1 mt-[60px]">
            <Box
                p="2"
                className={navClasses}
                onClick={() => onPageChange('home')}
            >
                <Flex align="center" gap="2">
                    <IconHome size={20} />
                    Home
                </Flex>
            </Box>
            <Box
                p="2"
                className={navClasses}
                onClick={() => onPageChange('explore')}
            >
                <Flex align="center" gap="2">
                    <IconLayout2 size={20} />
                    Explore
                </Flex>
            </Box>

            <Box
                p="2"
                className={navClasses}
                onClick={() => useStore.getState().openImageLibraryDialog()}
            >
                <Flex align="center" gap="2">
                    <IconPhoto size={20} />
                    Library
                </Flex>
            </Box>

            <Separator size="4" my="2" />

            <Heading size="3" as="h1" my="2" mx="2" color="gray">
                Projects
            </Heading>

            {/* List of projects */}
            <Flex direction="column">
                {projects.length > 0 ? (
                    projects.map(project => (
                        <Flex
                            key={project.id}
                            p="2"
                            className={navClasses + " group relative"}
                            align="center"
                            justify="between"
                        >
                            <Flex align="center" gap="2" onClick={() => onProjectClicked(project.id)} className="w-full">
                                <IconCubeUnfolded size={20} />
                                {project.name}
                            </Flex>
                            <IconEdit
                                size={20}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(project.id);
                                }}
                                className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity absolute right-2"
                            />
                        </Flex>
                    ))
                ) : (
                    <Box p="2">
                        <Text color="gray">Create new project below.</Text>
                    </Box>
                )}
            </Flex>

            <Box
                p="2"
                className={navClasses}
                onClick={openCreateDialog}
            >
                <Flex align="center" gap="2">
                    <IconCirclePlus size={20} />
                    New project
                </Flex>
            </Box>

            <Separator size="4" my="2" />

            <Heading size="3" as="h1" my="2" mx="2" color="gray">
                Settings
            </Heading>
            <Box
                p="2"
                className={navClasses}
                onClick={openResetDialog}
            >
                <Flex align="center" gap="2">
                    <IconDatabaseX size={20} />
                    Reset
                </Flex>
            </Box>
            <ProjectEditDialog projects={projects} />
            <ResetConfirmDialog />
        </Flex>
    );
}
