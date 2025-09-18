import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserName } from "../util/profile";

const DEFAULTS: Record<string, unknown> = {
    "general.show_mood": true,
    "general.show_stats": true,
    "general.show_one_year_ago": true,
};

type SettingsState = {
    settings: Record<string, unknown>;
    getSetting: (key: string) => unknown;
    getBoolean: (key: string) => boolean;
    setSetting: (key: string, value: unknown) => void;
    settingsOpen: boolean;
    openSettings: () => void;
    closeSettings: () => void;
};

// Zustand store with persist
export const useSettings = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: {},

            getSetting: (key) => {
                const { settings } = get();
                return settings[key] ?? DEFAULTS[key];
            },

            getBoolean: (key) => {
                return get().getSetting(key) as boolean;
            },

            setSetting: (key, value) => {
                set((state) => ({
                    settings: { ...state.settings, [key]: value },
                }));
            },

            settingsOpen: false,
            openSettings: () => set({ settingsOpen: true }),
            closeSettings: () => set({ settingsOpen: false }),
        }),
        {
            name: `journal-settings-${getUserName()}`, // storage key
            partialize: (state) => ({ settings: state.settings }), // only persist settings
        }
    )
);
