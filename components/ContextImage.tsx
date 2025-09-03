import { Box } from '@radix-ui/themes';
import { IconCircleXFilled } from '@tabler/icons-react';
import useImageBlob from '@/hooks/useImageBlob';

interface ContextImageProps {
    imageUrl: string;
    index: number;
    onPreview: (url: string) => void;
    onRemove: (index: number) => void;
}

export default function ContextImage({ imageUrl, index, onPreview, onRemove }: ContextImageProps) {
    const { imageUrl: blobUrl } = useImageBlob(imageUrl);

    return (
        <Box className="x-card-context-image relative">
            {blobUrl && (
                <img
                    src={blobUrl}
                    alt={`Context Image ${index + 1}`}
                    className="w-[50px] h-[50px] object-cover rounded-md"
                    onClick={() => onPreview(imageUrl)}
                    style={{ objectPosition: 'top' }}
                />
            )}
            <IconCircleXFilled
                size={20}
                className="absolute top-[-10px] right-[-10px] cursor-pointer rounded-full text-red-500"
                style={{ backgroundColor: 'var(--gray-2)' }}
                onClick={() => onRemove(index)}
            />
        </Box>
    );
}