import type { UseNavigateResult } from "@tanstack/router-core";
import { useSettings } from "../settings/util/state";

export enum RouteType {
    Redirect,
    SecondaryAuth,
    App,
}

export function isSecondaryAuthed() {
    const settings = useSettings.getState();
    if (sessionStorage.getItem("journal-secondary-authed")) return true;

    // secondary auth is enabled but not initialized
    if (
        settings.getString("security.secondary_auth") == "codeword" &&
        !settings.getString("data.codeword_hash")
    )
        return true;
    if (
        settings.getString("security.secondary_auth") == "passkey" &&
        !settings.getSetting("data.passkey")
    )
        return true;

    if (settings.getString("security.secondary_auth") == "none") return true;
    return false;
}

/**
 * Check if this route is accessible in the current auth state, and redirect away if it isn't.
 * @param navigate navigation function
 * @param route current route auth type
 * @returns true if route is accessible, false otherwise
 */
export function enforceAuth(navigate: UseNavigateResult<string>, route: RouteType) {
    const settings = useSettings.getState();
    if (isSecondaryAuthed()) {
        if (route != RouteType.App) {
            navigate({ to: "/overview" });
            return false;
        }
    } else if (
        settings.getString("security.secondary_auth") == "codeword" &&
        !isSecondaryAuthed()
    ) {
        navigate({ to: "/codeword" });
        return false;
    } else if (settings.getString("security.secondary_auth") == "passkey" && !isSecondaryAuthed()) {
        navigate({ to: "/passkey" });
        return false;
    }

    return true;
}
