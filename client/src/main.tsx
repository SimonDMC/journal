import "./styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

import { createRoot } from "react-dom/client";
import { Slide, ToastContainer } from "react-toastify";
import { routeTree } from "./routeTree.gen";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import BottomMargin from "./components/bottom-margin/BottomMargin";
import UpdatePopup from "./components/update-popup/UpdatePopup";
import { syncDatabase } from "./database/sync";
import { runMigrations } from "./util/migrations";
import SettingsPopup from "./components/settings/SettingsPopup";
import { useSettings } from "./state/settings";
import { injectAppropriateManifest } from "./util/pwa";
import { getCurrentVersion } from "./util/update";

// Create a new router instance
export const router = createRouter({
    routeTree,
    defaultPreload: "intent" /* defaultViewTransition: true */,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

// Figure out if we need a bottom mobile PWA margin
const bottomMarginVisible = window.matchMedia("(display-mode: standalone)").matches ? true : false;

// Sync database at the beginning of the session
if (!sessionStorage.getItem("journal-synced")) {
    // and then run potential migrations
    syncDatabase().then(() => runMigrations());
    sessionStorage.setItem("journal-synced", "true");
}

console.log("Loaded version", getCurrentVersion());

// Global settings keybind
const { openSettings, closeSettings } = useSettings.getState();
document.addEventListener("keydown", (e) => {
    const { settingsOpen } = useSettings.getState();

    const isMac = navigator.platform.toLowerCase().includes("mac");
    // allow ^, on mac since ⌘, is swallowed by safari (but not chrome)
    const isModifierPressed = e.ctrlKey || (isMac && e.metaKey);
    if (e.key == "," && isModifierPressed) {
        e.preventDefault();
        openSettings();
    }
    if (settingsOpen) {
        // no other navigation below when settings are open
        e.stopImmediatePropagation();

        if (e.key == "Escape" || (e.key == "," && isModifierPressed)) {
            closeSettings();
        }
    }
});

// Add manifest.json
injectAppropriateManifest();

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);
    root.render(
        <StrictMode>
            <BottomMargin visible={bottomMarginVisible} />
            <RouterProvider router={router} />
            <ToastContainer transition={Slide} />
            <UpdatePopup />
            <SettingsPopup />
        </StrictMode>,
    );
}
