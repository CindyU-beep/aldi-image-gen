export const getModelDisplayName = (
    modelIdentifier?: string,
    engine?: string,
    hasContextImages?: boolean,
): string => {
    console.log('[Debug] getModelDisplayName called with:', { modelIdentifier, engine, hasContextImages });
    
    if (!modelIdentifier) return "Unknown model";

    if (modelIdentifier === "GPT Image 1") {
        return hasContextImages ? "GPT-4 Vision (Edit)" : "GPT-4 Vision";
    } else if (modelIdentifier === "FLUX.1 Kontext Pro") {
        return "FLUX.1 Kontext Pro";
    } else if (modelIdentifier === "Gemini") {
        return hasContextImages ? "Gemini Flash Image (Nano Banana)" : `Gemini (${engine || 'default'})`;
    } else {
        // Fallback for any unmatched models
        return modelIdentifier;
    }
}

export function cleanSearchTerm(searchTerm: string): string {
    return searchTerm
        .replace(/[^\w\s]/g, '')
        .trim()
        .replace(/ +/g, '+');
}

const imageCache = new Map<string, boolean>();
const imagePlaceholder = "https://placehold.co/400x720/111111/7c7c7c?font=lato&text=No+image+available";

export function checkImageUrl(src?: string | null): string {
    if (!src) return imagePlaceholder;

    if (imageCache.has(src)) {
        return imageCache.get(src) ? src : imagePlaceholder;
    }

    const img = new Image();

    img.onload = () => imageCache.set(src, true);
    img.onerror = () => imageCache.set(src, false);

    img.src = src;

    return src;
}