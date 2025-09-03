import { HoverCard, DataList } from '@radix-ui/themes';
import useImageBlob from '@/hooks/useImageBlob';

interface CompareImageCardProps {
    imageUrl: string;
    imageSettings: any;
    modelName: string;
    maxWidth: string;
}

export function CompareImageCard({ imageUrl, imageSettings, modelName, maxWidth }: CompareImageCardProps) {
    const imageBlob = useImageBlob(imageUrl);

    return (
        <HoverCard.Root>
            <HoverCard.Trigger>
                <img
                    src={imageBlob.imageUrl}
                    alt="Comparison image"
                    style={{
                        maxWidth,
                        height: 'auto',
                        maxHeight: 'calc(85vh - 70px)',
                        objectFit: 'contain',
                    }}
                    className="object-contain"
                />
            </HoverCard.Trigger>

            {imageSettings && (
                <HoverCard.Content side="bottom" sideOffset={-200} className="m-3">
                    <DataList.Root m="3" className="!gap-1">
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Model</DataList.Label>
                            <DataList.Value>{modelName}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Format</DataList.Label>
                            <DataList.Value>{imageSettings?.format || "Unknown"}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Size</DataList.Label>
                            <DataList.Value>{imageSettings?.size || "Unknown"}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Quality</DataList.Label>
                            <DataList.Value>{imageSettings?.quality || "Unknown"}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Fidelity</DataList.Label>
                            <DataList.Value>{imageSettings?.fidelity || "Unknown"}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Background</DataList.Label>
                            <DataList.Value>{imageSettings?.background || "Auto"}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item align="center">
                            <DataList.Label minWidth="88px">Variations</DataList.Label>
                            <DataList.Value>{imageSettings?.variations || "Unknown"}</DataList.Value>
                        </DataList.Item>
                    </DataList.Root>
                </HoverCard.Content>
            )}
        </HoverCard.Root>
    );
}