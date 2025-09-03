import { useRef, useEffect, useCallback } from 'react';

// Keep scroll groups outside the hook for persistence across renders
const scrollGroups: Record<string, HTMLDivElement[]> = {};

export function useSyncScroll(group: string) {
    // Create the ref consistently on every render
    const elementRef = useRef<HTMLDivElement>(null);

    // Memoize the scroll handler
    const handleScroll = useCallback((event: Event) => {
        if (!scrollGroups[group]) return;

        const target = event.target as HTMLDivElement;
        const scrollLeft = target.scrollLeft;

        // Sync all other elements in the group
        scrollGroups[group].forEach(element => {
            if (element !== target && element.scrollLeft !== scrollLeft) {
                // Prevent scroll event loops
                element.scrollLeft = scrollLeft;
            }
        });
    }, [group]);

    // Register and clean up the element
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Initialize the group if it doesn't exist
        if (!scrollGroups[group]) {
            scrollGroups[group] = [];
        }

        // Add this element to the group
        scrollGroups[group].push(element);

        // Add scroll event listener
        element.addEventListener('scroll', handleScroll);

        // Clean up function
        return () => {
            // Remove scroll event listener
            element.removeEventListener('scroll', handleScroll);

            // Remove this element from the group
            if (scrollGroups[group]) {
                const index = scrollGroups[group].indexOf(element);
                if (index !== -1) {
                    scrollGroups[group].splice(index, 1);
                }

                // Clean up empty groups
                if (scrollGroups[group].length === 0) {
                    delete scrollGroups[group];
                }
            }
        };
    }, [group, handleScroll]);

    return elementRef;
}