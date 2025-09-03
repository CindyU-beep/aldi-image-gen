import { useState, useCallback } from 'react';
import { Dialog, Button, Flex, Box, TextField } from '@radix-ui/themes';
import useStore from '@/lib/store';

export function useProjectCreate() {
    const isCreateDialogOpen = useStore(state => state.isProjectCreateDialogOpen);
    const openProjectCreateDialog = useStore(state => state.openProjectCreateDialog);
    const closeProjectCreateDialog = useStore(state => state.closeProjectCreateDialog);
    const { addProject, projects } = useStore.getState();

    const openCreateDialog = useCallback(() => {
        openProjectCreateDialog();
    }, [openProjectCreateDialog]);

    const handleCreateProject = useCallback((name: string) => {
        if (name.trim()) {
            addProject(name.trim());
            closeProjectCreateDialog();
        }
    }, [addProject, closeProjectCreateDialog]);

    const ProjectCreateDialog = () => {

        const [localName, setLocalName] = useState(() => {
            const projectCount = projects.length;
            return projectCount > 0 ? `New project ${projectCount + 1}` : 'New project';
        });

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateProject(localName);
            }
        };

        return (
            <Dialog.Root open={isCreateDialogOpen}>
                <Dialog.Content maxWidth="500px">
                    <Dialog.Title>New project</Dialog.Title>
                    <Box mb="4">
                        <TextField.Root
                            size="3"
                            placeholder="Enter a name for your new project"
                            defaultValue={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </Box>
                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button
                                size="3"
                                variant="soft"
                                color="gray"
                                onClick={closeProjectCreateDialog}
                            >
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button size="3" onClick={() => handleCreateProject(localName)} highContrast>
                            Create
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        );
    };

    return {
        openCreateDialog,
        ProjectCreateDialog
    };
}