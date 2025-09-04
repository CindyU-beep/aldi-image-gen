import { useEffect, useState } from 'react';
import { Dialog, Button, Flex, Box, IconButton, Text, Card, Tabs, Spinner } from '@radix-ui/themes';
import { IconX } from '@tabler/icons-react';
import { useImageLibrary } from '@/hooks/useImageLibrary';
import useStore from '@/lib/store';
import { ImageLibraryImage } from './ImageLibraryImage';

export const ImageLibraryDialog = () => {
    const isDialogOpen = useStore(state => state.isImageLibraryDialogOpen);
    const closeImageLibraryDialog = useStore(state => state.closeImageLibraryDialog);
    const options = useStore(state => state.imageLibraryOptions);

    const isSelectionMode = options?.selectionMode || false;
    const onSelectCallback = options?.onSelect;

    const {
        libraryImages,
        isLoading,
        isUploading,
        selectedFile,
        fileInputRef,
        handleFileSelect,
        uploadSelectedFile,
        fetchLibraryImages,
        handleDeleteImage,
    } = useImageLibrary();

    // Fetch images when dialog opens
    useEffect(() => {
        if (isDialogOpen) {
            fetchLibraryImages();
        }
    }, [isDialogOpen, fetchLibraryImages]);

    return (
        <Dialog.Root open={isDialogOpen} onOpenChange={(open) => !open && closeImageLibraryDialog()}>
            <Dialog.Content maxWidth="calc(1440px - 48px)">
                <Dialog.Title>Library</Dialog.Title>
                <IconButton
                    aria-label="Close"
                    variant="ghost"
                    color="gray"
                    radius="full"
                    onClick={closeImageLibraryDialog}
                    style={{ position: 'absolute', top: 20, right: 20 }}
                    highContrast
                >
                    <IconX size={18} />
                </IconButton>

                <Tabs.Root defaultValue="library">
                    <Tabs.List>
                        <Tabs.Trigger value="library">Library</Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="library">
                        {/* Library images section */}
                        <Flex direction="row" align="start" py="4">
                            {isLoading ? (
                                <Flex justify="center" align="center" className="flex-1" height="60vh">
                                    <Spinner size="3" mr="2" />
                                    <Text color="gray">Loading...</Text>
                                </Flex>
                            ) : libraryImages.length === 0 ? (
                                <Flex justify="center" align="center" className="flex-1" height="60vh">
                                    <Text color="gray">No images found in library.</Text>
                                </Flex>
                            ) : (
                                <Box className="overflow-auto h-[60vh]">
                                    <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                                        {libraryImages.map((image) => (
                                            <ImageLibraryImage
                                                key={image.url}
                                                image={image}
                                                isSelectionMode={isSelectionMode}
                                                onSelectCallback={onSelectCallback}
                                                onDelete={handleDeleteImage}
                                            />
                                        ))}
                                    </div>
                                </Box>
                            )}
                        </Flex>
                        {/* Simple File upload section */}
                        <Card>
                            <Flex gap="2" align="center">
                                <Flex width="100%" position="relative" align="center" justify="between">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="absolute inset-0 h-[32px] w-[100px] cursor-pointer opacity-0"
                                        aria-label="Select file"
                                    />
                                    <Button
                                        type="button"
                                        variant="soft"
                                    >
                                        Select file
                                    </Button>
                                    {selectedFile && (
                                        <Text>
                                            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                                        </Text>
                                    )}
                                </Flex>
                                <Button
                                    onClick={uploadSelectedFile}
                                    disabled={!selectedFile || isUploading}
                                    type="button"
                                    highContrast
                                >
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>
                            </Flex>
                        </Card>
                    </Tabs.Content>
                </Tabs.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
};