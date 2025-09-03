import { useState } from 'react';
import { Flex, Dialog, IconButton, Callout, Spinner, Box } from '@radix-ui/themes';
import { IconX, IconDownload, IconInfoCircle } from '@tabler/icons-react';
import Magnify from '@/components/Magnify';
import useImageBlob from '@/hooks/useImageBlob';

export function useImagePreview() {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const openPreview = (imageSrc: string) => {
        setPreviewImage(imageSrc);
        setIsPreviewOpen(true);
    };

    const closePreview = () => {
        setIsPreviewOpen(false);
    };

    const downloadImage = (blobUrl: string) => {
        if (blobUrl) {
            window.open(blobUrl, '_blank');
        }
    };

    const PreviewOverlay = () => {
        const { imageUrl: blobUrl, loading } = useImageBlob(previewImage || '');

        if (!previewImage) return null;

        return (
            <Dialog.Root open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <Dialog.Content
                    style={{
                        maxWidth: "calc(1440px - 48px)",
                        maxHeight: "90vh",
                        overflow: "hidden",
                        margin: "auto",
                        position: "relative"
                    }}
                >
                    <Dialog.Title>Preview</Dialog.Title>
                    <IconButton
                        aria-label="Download"
                        variant="ghost"
                        color="gray"
                        radius="full"
                        onClick={() => downloadImage(blobUrl)}
                        style={{ position: 'absolute', top: 20, right: 50 }}
                        highContrast
                    >
                        <IconDownload size={18} />
                    </IconButton>
                    <IconButton
                        aria-label="Close"
                        variant="ghost"
                        color="gray"
                        radius="full"
                        onClick={closePreview}
                        style={{ position: 'absolute', top: 20, right: 20 }}
                        highContrast
                    >
                        <IconX size={18} />
                    </IconButton>
                    <Callout.Root>
                        <Callout.Icon>
                            <IconInfoCircle />
                        </Callout.Icon>
                        <Callout.Text>
                            Click the image to enable magnifier.
                        </Callout.Text>
                    </Callout.Root>
                    {loading ? (
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                height: "calc(85vh - 140px)"
                            }}
                        >
                            <Spinner size="3" />
                        </Flex>
                    ) : (
                        <Box
                            className="mt-4 position-relative"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                width: "100%"
                            }}
                        >
                            <Magnify size={300} zoom={1.5} >
                                <img
                                    src={blobUrl}
                                    alt="Preview"
                                    style={{
                                        display: "block",
                                        maxWidth: "100%",
                                        maxHeight: "calc(85vh - 140px)",
                                        width: "auto",
                                        height: "auto"
                                    }}
                                />
                            </Magnify>
                        </Box>
                    )}
                </Dialog.Content>
            </Dialog.Root>
        );
    };

    return {
        previewImage,
        isPreviewOpen,
        openPreview,
        closePreview,
        PreviewOverlay
    };
}