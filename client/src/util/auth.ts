import { API_URL } from "./config";
import type { UseNavigateResult } from "@tanstack/router-core";
import { errorToast } from "./toast";
import { router } from "../main";
import { useSettings } from "../state/settings";

export enum RouteType {
    Unauthed,
    SecondaryAuth,
    Authed,
}

export function isSecondaryAuthed() {
    const settings = useSettings.getState();
    if (sessionStorage.getItem("journal-secondary-authed")) return true;

    // secondary auth is enabled but not initialized
    if (settings.getString("security.secondary_auth") == "codeword" && settings.getString("data.codeword_hash") == undefined) return true;
    if (settings.getString("security.secondary_auth") == "passkey" && settings.getSetting("data.passkey") == undefined) return true;

    if (settings.getString("security.secondary_auth") == "none") return true;
    return false;
}

export function enforceAuth(navigate: UseNavigateResult<string>, route: RouteType) {
    const settings = useSettings.getState();
    if (localStorage.getItem("journal-logged-in") && isSecondaryAuthed()) {
        if (route != RouteType.Authed) {
            navigate({ to: "/overview" });
        }
    } else if (
        localStorage.getItem("journal-logged-in") &&
        settings.getString("security.secondary_auth") == "codeword" &&
        !isSecondaryAuthed()
    ) {
        navigate({ to: "/codeword" });
    } else if (
        localStorage.getItem("journal-logged-in") &&
        settings.getString("security.secondary_auth") == "passkey" &&
        !isSecondaryAuthed()
    ) {
        navigate({ to: "/passkey" });
    } else {
        navigate({ to: "/login" });
    }
}

async function logoutWithoutNav() {
    try {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
        });
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
