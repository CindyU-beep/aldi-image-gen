import ReactCompareImage from 'react-compare-image';
import useImageBlob from '@/hooks/useImageBlob';
import { Flex } from '@radix-ui/themes';
import { useState, useEffect } from 'react';

interface CompareSliderProps {
    leftImageUrl: string;
    rightImageUrl: string;
}

export function CompareSlider({ leftImageUrl, rightImageUrl }: CompareSliderProps) {
    const leftImageBlob = useImageBlob(leftImageUrl);
    const rightImageBlob = useImageBlob(rightImageUrl);
    const [isZoomedIn, setIsZoomedIn] = useState(false);

    useEffect(() => {
        const checkZoom = () => {
            const zoom = Math.round(window.devicePixelRatio * 100);
            // Check if zoom divides evenly by 100 to a single digit (100, 200, 300 = normal, 110, 125, 150 = zoomed)
            const isNormalZoom = zoom % 100 === 0;
            setIsZoomedIn(!isNormalZoom);
        };

        checkZoom();
        window.addEventListener('resize', checkZoom);

        return () => window.removeEventListener('resize', checkZoom);
    }, []);

    return (
        leftImageBlob.imageUrl && rightImageBlob.imageUrl && (
            <Flex direction="column" align="center" className="w-full">
                <div className={`flex justify-center items-center ${isZoomedIn ? 'w-[800px]' : 'w-full'}`}>
                    <ReactCompareImage
                        leftImage={leftImageBlob.imageUrl}
                        rightImage={rightImageBlob.imageUrl}
                    />
                </div>
            </Flex>
        )
    );
}