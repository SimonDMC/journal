import { Slide, toast, type ToastOptions } from "react-toastify";

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
    toast.warn(message, toastOptions);
}

export function errorToast(message: string) {
    toast.error(message, toastOptions);
}
