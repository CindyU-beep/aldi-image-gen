import React, { useRef, useEffect, useState, ReactElement, cloneElement } from 'react';

interface MagnifyProps {
    children: ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>;
    size?: number; // Size of the magnifier glass
    zoom?: number; // Zoom level of the magnifier glass
}

const Magnify: React.FC<MagnifyProps> = ({
    children,
    size = 340,
    zoom = 1.15,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const magnifierRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Ensure we're working with an image element
    const isValidImage = React.isValidElement(children) && children.type === 'img';

    // Define and merge styles regardless of validity
    const imgElement = isValidImage ? cloneElement(children, {
        style: {
            height: 'auto',
            maxWidth: '100%',
            display: 'block',
            ...children.props.style,
        },
    } as React.ImgHTMLAttributes<HTMLImageElement>) : children;

    useEffect(() => {
        const container = containerRef.current;
        const magnifier = magnifierRef.current;
        const img = container?.querySelector('img') as HTMLImageElement;

        if (!container || !magnifier || !img) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isVisible) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Use natural dimensions to calculate zoomed sizes
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            const displayedWidth = img.offsetWidth;
            const displayedHeight = img.offsetHeight;

            // Calculate scaling ratios
            const ratioX = naturalWidth / displayedWidth;
            const ratioY = naturalHeight / displayedHeight;

            // Set background size based on the natural dimensions multiplied by the zoom factor
            magnifier.style.backgroundSize = `${naturalWidth * zoom}px ${naturalHeight * zoom}px`;

            // Position the magnifier box to follow the mouse pointer
            magnifier.style.left = `${x - size / 2}px`;
            magnifier.style.top = `${y - size / 2}px`;

            // Calculate background position so that the point under the mouse is centered in the magnifier
            const bgX = (x * ratioX * zoom) - (size / 2);
            const bgY = (y * ratioY * zoom) - (size / 2);
            magnifier.style.backgroundPosition = `-${bgX}px -${bgY}px`;
        };

        const handleClick = () => {
            setIsVisible(prev => !prev);
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('click', handleClick);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('click', handleClick);
        };
    }, [size, zoom, isVisible]);

    // After all hooks are called, you can have early returns
    if (!isValidImage) {
        console.error('Magnify: Child must be an img element');
        return children;
    }

    return (
        <div
            ref={containerRef}
            className="image-magnifier-container"
            style={{
                position: 'relative',
                cursor: 'zoom-in',
                display: 'inline-block',
                maxWidth: children.props.width || '100%',
                overflow: 'hidden',
            }}
        >
            {imgElement}
            <div
                ref={magnifierRef}
                className="image-magnifier-glass shadow-lg"
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundImage: `url(${children.props.src})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'var(--color-panel-solid)',
                    pointerEvents: 'none',
                    position: 'absolute',
                    opacity: isVisible ? 1 : 0,
                    border: '2px solid rgba(255, 255, 255, 1)',
                    zIndex: 99,
                    borderRadius: '50%',
                    transition: 'opacity 0.2s',
                }}
            />
        </div>
    );
};

export default Magnify;