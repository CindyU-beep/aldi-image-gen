import { useEffect } from 'react';

export const clarity = (projectId: string) => {
    (function (c: any, l: Document, a: string, r: string, i: string) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
        const t = l.createElement(r) as HTMLScriptElement;
        t.async = true;
        t.src = "https://www.clarity.ms/tag/" + i;
        const y = l.getElementsByTagName(r)[0];
        if (y && y.parentNode) {
            y.parentNode.insertBefore(t, y);
        }
    })(window, document, "clarity", "script", projectId);
};

export function useClarity(projectId: string) {
    useEffect(() => {
        if (
            typeof window !== 'undefined' && projectId && process.env.APP_ENV !== 'development'
        ) {
            clarity(projectId);
        }
    }, [projectId]);
}