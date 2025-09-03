import { type ElementType } from 'react';

interface ShimmerProps {
    children: string;
    as?: ElementType;
    className?: string;
    text?: string;
    textColor?: string;
    textGradient?: string;
    isLoading?: boolean;
}

export function Shimmer({
    children,
    as: Component = 'span',
    className = '',
    text,
    textColor = '--black-a4',
    textGradient = '--black-a12',
    isLoading = false,
}: ShimmerProps) {
    return (
        <>
            <style jsx>{`
                .loading-shimmer {
                    animation-delay: 0.5s;
                    animation-duration: 3s;
                    animation-iteration-count: infinite;
                    animation-name: loading-shimmer;
                    background: var(${textColor}) gradient(linear,100% 0,0 0,from(var(${textColor})),color-stop(0.5,var(${textGradient})),to(var(${textColor})));
                    background: var(${textColor}) -webkit-gradient(linear,100% 0,0 0,from(var(${textColor})),color-stop(0.5,var(${textGradient})),to(var(${textColor})));
                    background-clip: text;
                    background-repeat: no-repeat;
                    background-size: 50% 200%;
                    display: inline-block;
                }

                [dir="ltr"] .loading-shimmer {
                    background-position: -100% top;
                }

                [dir="rtl"] .loading-shimmer {
                    background-position: 200% top;
                }

                @keyframes loading-shimmer {
                    0% {
                        background-position: -100% top;
                    }
                    to {
                        background-position: 250% top;
                    }
                }
            `}</style>

            <Component
                className={isLoading ? `loading-shimmer text-transparent ${className}` : ''}>
                {text ? text : children}
            </Component>
        </>
    );
}