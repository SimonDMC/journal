import { getSettings } from "./profile";
import { API_URL } from "./config";
import type { UseNavigateResult } from "@tanstack/router-core";
import { errorToast } from "./toast";
import { router } from "../main";

export enum RouteType {
    Unauthed,
    Auth2FA,
    Authed,
}

export function is2faAuthed() {
    const options = getSettings();
    if (sessionStorage.getItem("journal-2fa-authed")) return true;

    // 2fa method is selected but not initialized
    if (options["2fa_method"] == 1 && !options["codeword"]) return true;
    if (options["2fa_method"] == 2 && !options["passkey"]) return true;

    if (!options["2fa_method"]) return true;
    return false;
}

export function enforceAuth(navigate: UseNavigateResult<string>, route: RouteType) {
    const options = getSettings();
    if (localStorage.getItem("journal-logged-in") && is2faAuthed()) {
        if (route != RouteType.Authed) navigate({ to: "/overview" });
    } else if (localStorage.getItem("journal-logged-in") && options["2fa_method"] == 1 && !is2faAuthed()) {
        navigate({ to: "/codeword" });
    } else if (localStorage.getItem("journal-logged-in") && options["2fa_method"] == 2 && !is2faAuthed()) {
        navigate({ to: "/bioauth" });
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
