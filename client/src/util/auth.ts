import type { UseNavigateResult } from "@tanstack/router-core";
import { errorToast } from "./toast";
import { router } from "../main";
import { useSettings } from "../state/settings";
import { postAPI } from "../services/api";

export enum RouteType {
    Redirect,
    Unauthed,
    SecondaryAuth,
    Authed,
}

export function isSecondaryAuthed() {
    const settings = useSettings.getState();
    if (sessionStorage.getItem("journal-secondary-authed")) return true;

    // secondary auth is enabled but not initialized
    if (
        settings.getString("security.secondary_auth") == "codeword" &&
        settings.getString("data.codeword_hash") == undefined
    )
        return true;
    if (
        settings.getString("security.secondary_auth") == "passkey" &&
        settings.getSetting("data.passkey") == undefined
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
    if (localStorage.getItem("journal-logged-in") && isSecondaryAuthed()) {
        if (route != RouteType.Authed) {
            navigate({ to: "/overview" });
            return false;
        }
    } else if (
        localStorage.getItem("journal-logged-in") &&
        settings.getString("security.secondary_auth") == "codeword" &&
        !isSecondaryAuthed()
    ) {
        navigate({ to: "/codeword" });
        return false;
    } else if (
        localStorage.getItem("journal-logged-in") &&
        settings.getString("security.secondary_auth") == "passkey" &&
        !isSecondaryAuthed()
    ) {
        navigate({ to: "/passkey" });
        return false;
    } else {
        if (route != RouteType.Unauthed) {
            navigate({ to: "/login" });
            return false;
        }
    }

    return true;
}

async function logoutWithoutNav() {
    try {
        await postAPI("/logout", {});
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server.");
        return;
    }
    localStorage.removeItem("journal-logged-in");
    sessionStorage.removeItem("journal-codeword");
}

export async function logout(navigate: UseNavigateResult<string>) {
    await logoutWithoutNav();
    navigate({ to: "/login" });
}

export async function logoutImperatively() {
    await logoutWithoutNav();
    router.navigate({ to: "/login" });
}
