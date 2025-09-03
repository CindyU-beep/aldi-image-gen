import { Card, Inset, Flex, Text, IconButton } from '@radix-ui/themes';
import { IconTrash } from '@tabler/icons-react';
import useImageBlob from '@/hooks/useImageBlob';

interface ImageLibraryImageProps {
    image: {
        url: string;
        name: string;
    };
    isSelectionMode: boolean;
    onSelectCallback?: (url: string) => void;
    onDelete: (url: string, e: React.MouseEvent) => void;
}

export const ImageLibraryImage = ({
    image,
    isSelectionMode,
    onSelectCallback,
    onDelete
}: ImageLibraryImageProps) => {
    const { imageUrl, loading } = useImageBlob(image.url);

    if (loading || !imageUrl) {
        return null;
    }

    return (
        <Card
            className={`break-inside-avoid mb-3 inline-block w-full ${isSelectionMode ? "cursor-pointer hover:opacity-90" : ""}`}
            onClick={isSelectionMode && onSelectCallback ? () => onSelectCallback(image.url) : undefined}
            style={{ display: 'flex', flexDirection: 'column' }}
        >
            <Inset clip="padding-box" side="top" pb="current" className="flex flex-1 items-center justify-center bg-gray-100 !pb-0">
                <img
                    src={imageUrl}
                    alt={image.name}
                    style={{ width: '100%', height: 'auto' }}
                />
            </Inset>
            <Flex justify="between" align="start" gap="2" pt="3">
                <Text size="2">
                    {image.name}
                </Text>
                <Flex gap="2">
                    <IconButton
                        variant="ghost"
                        type="button"
                        radius="full"
                        onClick={(e) => {
                            onDelete(image.url, e);
                        }}
                    >
                        <IconTrash size={20} />
                    </IconButton>
                </Flex>
            </Flex>
        </Card>
    );
};