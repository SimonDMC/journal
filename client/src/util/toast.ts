import { Slide, toast, type ToastOptions } from "react-toastify";
import { useSettings } from "../state/settings";

const toastOptions = {
    position: "top-right",
    theme: "dark",
    transition: Slide,
} as ToastOptions;

export function infoToast(message: string) {
    toast.info(message, toastOptions);
}

export function successToast(message: string) {
    toast.success(message, toastOptions);
}

export function warningToast(message: string) {
    if (useSettings.getState().getSetting("general.suppress_toasts")) return;
    toast.warn(message, toastOptions);
}

export function errorToast(message: string) {
    if (useSettings.getState().getSetting("general.suppress_toasts")) return;
    toast.error(message, toastOptions);
}
