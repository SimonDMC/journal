import { getOptions } from "./profile";
import { API_URL } from "./config";
import type { NavigateFunction } from "react-router";

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

export function enforceAuth(navigate: NavigateFunction, route: RouteType) {
    const options = getOptions();
    if (localStorage.getItem("logged-in") && is2faAuthed()) {
        if (route != RouteType.Authed) navigate("/overview");
    } else if (localStorage.getItem("logged-in") && options["2fa_method"] == 1 && !is2faAuthed()) {
        navigate("/codeword");
    } else if (localStorage.getItem("logged-in") && options["2fa_method"] == 2 && !is2faAuthed()) {
        navigate("/bioauth");
    } else {
        navigate("/login");
    }
}

export async function logout(navigate: NavigateFunction) {
    await fetch(`${API_URL}/logout`, {
        method: "POST",
    });
    localStorage.removeItem("logged-in");
    sessionStorage.removeItem("codeword");
    navigate("/login");
}
