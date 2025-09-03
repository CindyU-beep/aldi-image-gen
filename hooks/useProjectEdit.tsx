import { useState, useCallback } from 'react';
import { Dialog, Button, Flex, Box, TextField } from '@radix-ui/themes';
import useStore from '@/lib/store';

export function useProjectEdit() {
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const updateProjectName = useStore(state => state.updateProjectName);

    const openEditDialog = useCallback((projectId: string) => {
        setEditingProjectId(projectId);
    }, []);

    const closeEditDialog = useCallback(() => {
        setEditingProjectId(null);
    }, []);

    const handleEditProject = useCallback((projectId: string, name: string) => {
        if (name.trim()) {
            updateProjectName(projectId, name.trim());
            closeEditDialog();
        }
    }, [updateProjectName, closeEditDialog]);

    const ProjectEditDialog = ({ projects }: { projects: { id: string, name: string }[] }) => {
        if (!editingProjectId) return null;
        const project = projects.find(p => p.id === editingProjectId);
        const [localName, setLocalName] = useState(project?.name || '');

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleEditProject(editingProjectId, localName);
            }
        };

        return (
            <Dialog.Root open={!!editingProjectId}>
                <Dialog.Content maxWidth="500px">
                    <Dialog.Title>Edit project name</Dialog.Title>
                    <Box mb="4">
                        <TextField.Root
                            size="3"
                            placeholder="Enter a new name"
                            value={localName}
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
                                onClick={closeEditDialog}
                            >
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button size="3" onClick={() => handleEditProject(editingProjectId, localName)} highContrast>
                            Save
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        );
    };

    return {
        openEditDialog,
        closeEditDialog,
        ProjectEditDialog,
        editingProjectId,
    };
}