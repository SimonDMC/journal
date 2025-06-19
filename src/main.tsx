import "./styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { createRoot } from "react-dom/client";
import { Slide, ToastContainer } from "react-toastify";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import BottomMargin from "./components/bottom-margin/BottomMargin";
import UpdatePopup from "./components/update-popup/UpdatePopup";

// Create a new router instance
const router = createRouter({ routeTree, defaultPreload: "intent" /* defaultViewTransition: true */ });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

// Figure out if we need a bottom mobile PWA margin
const bottomMarginVisible = window.matchMedia("(display-mode: standalone)").matches ? true : false;

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
        </StrictMode>
    );
}
