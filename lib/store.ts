import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

const defaultSettings = {
    model: 'GPT Image 1',
    format: 'png',
    size: '1024x1536',
    quality: 'High',
    fidelity: 'Low',
    background: 'Auto',
    variations: 1,
}

interface Settings {
    model: string
    engine?: string
    format: string
    size: string
    quality: string
    fidelity: string
    background: string
    variations: number
}

export type { Settings };

export interface Card {
    id: string
    index: number
    contextUrl: string
    contextPrompt: string
    contextImages: string[]
    contextSettings: Settings
    outputContextImage: string | null
    outputImages: string[]
}

export interface Timeline {
    id: string
    fromTimelineId: string | null
    cards: Card[]
}

export interface Project {
    id: string
    name: string
    timelines: Timeline[]
}

export interface ImageLibraryOptions {
    selectionMode?: boolean;
    onSelect?: (imageUrl: string, productUrl?: string) => void;
}

export type Store = {
    /* state */
    asside: boolean
    projects: Project[]
    settings: Settings
    compare: string[]
    isImageLibraryDialogOpen: boolean;
    imageLibraryOptions: ImageLibraryOptions | null;
    isProjectCreateDialogOpen: boolean; // <-- new state for project dialog
    isActionsViewOpen: boolean;
    activeActionsTimeline: { projectId: string, timelineId: string } | null;

    /* actions */
    setAsside: (asside: boolean) => void
    setSettings: (settings: Settings) => void
    getSettings: () => Settings
    addProject: (name: string) => void
    removeProject: (projectId: string) => void
    addTimeline: (projectId: string, fromTimelineId: string | null) => void
    removeTimeline: (projectId: string, timelineId: string) => void
    addCard: (
        projectId: string,
        timelineId: string,
        index: number,
        contextUrl: string | null,
        contextImage: string | null
    ) => void
    updateCard: (
        projectId: string,
        timelineId: string,
        cardId: string,
        updates: Partial<Omit<Card, 'id'>>,
    ) => void
    forkCard: (
        projectId: string,
        fromTimelineId: string,
        fromIndex: number,
        contextUrl: string | null,
        contextImage: string | null
    ) => void
    removeLastCard: (projectId: string, timelineId: string) => void
    addCompare: (imageUrl: string) => void
    removeCompare: (imageUrl: string) => void
    clearCompare: () => void
    openImageLibraryDialog: (options?: ImageLibraryOptions) => void;
    closeImageLibraryDialog: () => void;
    genSettings: (outputContextImage: string) => Settings | null;
    openProjectCreateDialog: () => void;
    closeProjectCreateDialog: () => void;
    openActionsView: (projectId: string, timelineId: string) => void;
    closeActionsView: () => void;
    updateProjectName: (projectId: string, name: string) => void;
    resetStore: () => void;
}

const useStore = create<Store>()(
    persist<Store>(
        (set, get) => ({
            /* state */
            asside: true,
            projects: [],
            settings: defaultSettings,
            compare: [],
            isImageLibraryDialogOpen: false,
            imageLibraryOptions: null,
            isProjectCreateDialogOpen: false, // keep state as is
            isActionsViewOpen: false,
            activeActionsTimeline: null,

            /* actions */
            setAsside: (asside: boolean) => set({ asside }),
            setSettings: (settings: any) => set({ settings }),
            getSettings: () => get().settings,
            addProject: (name) => set((state) => {
                const projectId = uuid();
                const timelineId = uuid();

                return {
                    projects: [...state.projects, {
                        id: projectId,
                        name,
                        timelines: [{
                            id: timelineId,
                            fromTimelineId: null,
                            cards: [{
                                id: uuid(),
                                index: 0,
                                contextUrl: '',
                                contextPrompt: '',
                                contextImages: [],
                                contextSettings: get().settings,
                                outputContextImage: null,
                                outputImages: [],
                            }],
                        }],
                    }],
                };
            }),

            removeProject: (projectId) => set((state) => ({
                projects: state.projects.filter(p => p.id !== projectId),
            })),

            addTimeline: (projectId, fromTimelineId) =>
                set((state) => ({
                    projects: state.projects.map(project => {
                        if (project.id !== projectId) return project
                        const newTimelineId = uuid();
                        return {
                            ...project,
                            timelines: [...project.timelines, {
                                id: newTimelineId,
                                fromTimelineId,
                                cards: [{
                                    id: uuid(),
                                    index: 0,
                                    contextUrl: '',
                                    contextPrompt: '',
                                    contextImages: [],
                                    contextSettings: get().settings,
                                    outputContextImage: null,
                                    outputImages: [],
                                }],
                            }],
                        }
                    }),
                })),

            removeTimeline: (projectId, timelineId) =>
                set((state) => ({
                    projects: state.projects.map(project => {
                        if (project.id !== projectId) return project
                        return {
                            ...project,
                            timelines: project.timelines.filter(t => t.id !== timelineId),
                        }
                    }),
                })),

            addCard: (projectId, timelineId, index, contextUrl, contextImage) =>
                set((state) => ({
                    projects: state.projects.map(project => {
                        if (project.id !== projectId) return project
                        return {
                            ...project,
                            timelines: project.timelines.map(timeline => {
                                if (timeline.id !== timelineId) return timeline
                                return {
                                    ...timeline,
                                    cards: [...timeline.cards, {
                                        id: uuid(),
                                        index,
                                        contextUrl: contextUrl || '',
                                        contextPrompt: '',
                                        contextImages: contextImage ? [contextImage] : [],
                                        contextSettings: get().settings,
                                        outputContextImage: null,
                                        outputImages: [],
                                    }],
                                }
                            }),
                        }
                    }),
                })),

            updateCard: (projectId, timelineId, cardId, updates) =>
                set((state) => ({
                    projects: state.projects.map(project => {
                        if (project.id !== projectId) return project
                        return {
                            ...project,
                            timelines: project.timelines.map(timeline => {
                                if (timeline.id !== timelineId) return timeline
                                return {
                                    ...timeline,
                                    cards: timeline.cards.map(card =>
                                        card.id === cardId ? { ...card, ...updates } : card
                                    ),
                                }
                            }),
                        }
                    }),
                })),

            forkCard: (projectId, fromTimelineId, fromIndex, contextUrl, contextImage) =>
                set((state) => ({
                    projects: state.projects.map(project => {
                        if (project.id !== projectId) return project
                        const newTimeline = {
                            id: uuid(),
                            fromTimelineId,
                            cards: [{
                                id: uuid(),
                                index: fromIndex,
                                contextUrl: contextUrl || '',
                                contextPrompt: '',
                                contextImages: contextImage ? [contextImage] : [],
                                contextSettings: get().settings,
                                outputContextImage: null,
                                outputImages: [],
                            }],
                        }
                        return { ...project, timelines: [...project.timelines, newTimeline] }
                    }),
                })),

            removeLastCard: (projectId, timelineId) =>
                set((state) => {
                    const project = state.projects.find((p) => p.id === projectId);
                    if (!project) return state;

                    const timeline = project.timelines.find((t) => t.id === timelineId);
                    if (!timeline || timeline.cards.length === 0) return state;

                    const lastCard = timeline.cards[timeline.cards.length - 1];

                    const deleteBlobFromUrl = async (imageUrl: string) => {
                        try {
                            if (!imageUrl || !imageUrl.trim()) return;
                            fetch(`/api/blob-storage?url=${encodeURIComponent(imageUrl)}`, {
                                method: 'DELETE',
                            }).catch(error => console.error("Failed to delete image from Azure:", error));
                        } catch (error) {
                            console.error("Error while trying to delete image:", error);
                        }
                    };

                    if (lastCard.outputImages && Array.isArray(lastCard.outputImages)) {
                        lastCard.outputImages.forEach(imageUrl => {
                            if (imageUrl) deleteBlobFromUrl(imageUrl);
                        });
                    }

                    timeline.cards.pop();

                    return {
                        ...state,
                        projects: [...state.projects]
                    };
                }),

            addCompare: (imageUrl) =>
                set((state) => {
                    if (state.compare.includes(imageUrl)) {
                        return { compare: state.compare };
                    }
                    if (state.compare.length < 2) {
                        return { compare: [...state.compare, imageUrl] };
                    }
                    return { compare: state.compare };
                }),

            removeCompare: (imageUrl) =>
                set((state) => ({
                    compare: state.compare.filter(url => url !== imageUrl)
                })),

            clearCompare: () => set({ compare: [] }),

            openImageLibraryDialog: (options) => set({
                isImageLibraryDialogOpen: true,
                imageLibraryOptions: options || null
            }),

            closeImageLibraryDialog: () => set({
                isImageLibraryDialogOpen: false,
                imageLibraryOptions: null
            }),

            genSettings: (outputContextImage: string) => {
                if (!outputContextImage) return null;
                const projects = get().projects;
                for (const project of projects) {
                    for (const timeline of project.timelines) {
                        for (const card of timeline.cards) {
                            if (card.outputContextImage === outputContextImage) {
                                return card.contextSettings;
                            }
                        }
                    }
                }
                return null;
            },

            // New actions for project create dialog
            openProjectCreateDialog: () => set({ isProjectCreateDialogOpen: true }),
            closeProjectCreateDialog: () => set({ isProjectCreateDialogOpen: false }),

            openActionsView: (projectId: string, timelineId: string) => set({
                isActionsViewOpen: true,
                activeActionsTimeline: { projectId, timelineId }
            }),

            closeActionsView: () => set({
                isActionsViewOpen: false,
                activeActionsTimeline: null
            }),

            updateProjectName: (projectId, name) =>
                set((state) => ({
                    projects: state.projects.map(project =>
                        project.id === projectId ? { ...project, name } : project
                    ),
                })),

            resetStore: () =>
                set(() => ({
                    asside: true,
                    projects: [],
                    settings: defaultSettings,
                    compare: [],
                    isImageLibraryDialogOpen: false,
                    imageLibraryOptions: null,
                    isProjectCreateDialogOpen: false,
                    isActionsViewOpen: false,
                    activeActionsTimeline: null,
                })),
        }),
        {
            name: 'ImageGenStore',
            partialize: (state) => ({
                ...state,
                imageLibraryOptions: null,
                isActionsViewOpen: false,
                activeActionsTimeline: null
            }),
        },
    ),
)

export default useStore
