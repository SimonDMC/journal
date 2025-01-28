import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getOptions } from "./profile";
import { API_URL } from "./config";

export enum RouteType {
    Unauthed,
    Auth2FA,
    Authed,
}

export function is2faAuthed() {
    const options = getOptions();
    if (sessionStorage.getItem("2fa-authed")) return true;

    // 2fa method is selected but not initialized
    if (options["2fa_method"] == 1 && !options["codeword"]) return true;
    if (options["2fa_method"] == 2 && !options["passkey"]) return true;

    if (!options["2fa_method"]) return true;
    return false;
}

export function enforceAuth(router: AppRouterInstance, route: RouteType) {
    const options = getOptions();
    if (localStorage.getItem("logged-in") && is2faAuthed()) {
        if (route != RouteType.Authed) router.push("/overview");
    } else if (localStorage.getItem("logged-in") && options["2fa_method"] == 1 && !is2faAuthed()) {
        router.push("/codeword");
    } else if (localStorage.getItem("logged-in") && options["2fa_method"] == 2 && !is2faAuthed()) {
        router.push("/bioauth");
    } else {
        router.push("/login");
    }
}

export async function logout(router: AppRouterInstance) {
    await fetch(`${API_URL}/logout`, {
        method: "POST",
    });
    localStorage.removeItem("logged-in");
    sessionStorage.removeItem("codeword");
    router.push("/login");
}
