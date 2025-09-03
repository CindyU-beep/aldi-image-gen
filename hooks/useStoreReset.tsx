import { useState, useCallback } from 'react';
import { Dialog, Button, Flex, Text, Box } from '@radix-ui/themes';
import { IconAlertTriangle } from '@tabler/icons-react';
import useStore from '@/lib/store';

export function useStoreReset() {
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const resetStore = useStore(state => state.resetStore);

    const openResetDialog = useCallback(() => {
        setIsResetDialogOpen(true);
    }, []);

    const closeResetDialog = useCallback(() => {
        setIsResetDialogOpen(false);
    }, []);

    const handleConfirmReset = useCallback(() => {
        resetStore();
        closeResetDialog();
    }, [resetStore, closeResetDialog]);

    const ResetConfirmDialog = () => {
        return (
            <Dialog.Root open={isResetDialogOpen}>
                <Dialog.Content maxWidth="500px">
                    <Dialog.Title>
                        <Flex align="center" gap="2">
                            <IconAlertTriangle size={20} color="var(--red-9)" />
                            Reset Application
                        </Flex>
                    </Dialog.Title>
                    <Box mb="4">
                        <Text size="3" color="gray">
                            This action will permanently delete all projects, timelines, and generated images.
                            This cannot be undone.
                        </Text>
                        <Box mt="3">
                            <Text size="2" weight="medium" color="red">
                                Are you sure you want to continue?
                            </Text>
                        </Box>
                    </Box>
                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button
                                size="3"
                                variant="soft"
                                color="gray"
                                onClick={closeResetDialog}
                            >
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            size="3"
                            color="red"
                            onClick={handleConfirmReset}
                            highContrast
                        >
                            Reset Everything
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        );
    };

    return {
        openResetDialog,
        closeResetDialog,
        ResetConfirmDialog,
        isResetDialogOpen,
    };
}
