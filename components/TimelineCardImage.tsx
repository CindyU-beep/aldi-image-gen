import { Box, Flex, DataList, Text, Spinner } from '@radix-ui/themes';
import useImageBlob from '@/hooks/useImageBlob';
import { getModelDisplayName } from '@/lib/helpers';
import type { Settings } from '@/lib/store';

interface TimelineCardImageProps {
    src: string;
    onImageClick: (src: string) => void;
    contextSettings?: Settings;
    contextPrompt?: string;
    contextImages?: string[];
}

export default function TimelineCardImage({ src, onImageClick, contextSettings, contextPrompt, contextImages }: TimelineCardImageProps) {
    // Replace the displayModel function with our helper
    const modelName = getModelDisplayName(
        contextSettings?.model,
        contextSettings?.engine,
        Boolean(contextImages?.length)
    );

    // Correctly destructure the hook return value
    const { imageUrl, loading } = useImageBlob(src);

    return (
        <Flex position="relative" align="center" justify="center" className="x-embla-slide-image rounded-lg" mt="3" onClick={() => onImageClick(src)}>
            <Box
                className="x-embla-slide-image-bg"
                style={{
                    backgroundImage: `url(${imageUrl})`
                }}
            />
            {loading ? (
                <Flex
                    position="absolute"
                    inset="0"
                    align="center"
                    justify="center"
                >
                    <Spinner size="3" />
                </Flex>
            ) : (
                imageUrl && (
                    <img
                        src={imageUrl}
                        alt={`Generated image`}
                        style={{ opacity: loading ? 0.5 : 1 }}
                    />
                )
            )}
            <Flex
                position="absolute"
                direction="column"
                align="start"
                justify="end"
                inset="0"
                className="x-embla-slide-image-overlay"
            >
                <Box p="3" width="100%" className="whitespace-normal text-ellipsis overflow-hidden">
                    <Text size="2">{contextPrompt || "No prompt"}</Text>
                </Box>
                <DataList.Root m="3" className="!gap-0">
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Model</DataList.Label>
                        <DataList.Value>
                            {modelName}
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Format</DataList.Label>
                        <DataList.Value>
                            {contextSettings?.format}
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Size</DataList.Label>
                        <DataList.Value>
                            {contextSettings?.size}
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Quality</DataList.Label>
                        <DataList.Value>
                            {contextSettings?.quality}
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Fidelity</DataList.Label>
                        <DataList.Value>
                            {contextSettings?.fidelity || "Unknown"}
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Background</DataList.Label>
                        <DataList.Value>
                            {contextSettings?.background || "Auto"}
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Variations</DataList.Label>
                        <DataList.Value>
                            {contextSettings?.variations}
                        </DataList.Value>
                    </DataList.Item>
                </DataList.Root>
            </Flex>
        </Flex >
    );
}