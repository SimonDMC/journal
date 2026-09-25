import { postAPI } from "../../services/api";
import { errorToast, successToast } from "../../util/toast";

export async function changePassword(password: string) {
    try {
        const res = await postAPI("/change-password", { password });

        if (res.ok) {
            successToast("Password changed successfully!");
        } else {
            errorToast("Failed to change password. Are you logged in?");
        }
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server. Are you connected to the internet?");
        return;
    }
}

export async function changePasswordMismatched() {
    errorToast("Passwords do not match.");
}

export async function forgotPassword(email: string) {
    try {
        const res = await postAPI("/forgot-password", { email });
        if (res.ok) {
            successToast("Password reset link sent. Check your inbox!");
            return true;
        }

        if (res.status == 404) {
            errorToast("No account with that email exists.");
            return false;
        }

        errorToast("An unexpected error occurred. Try again later.");
        return false;
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server. Are you connected to the internet?");
        return false;
    }
}

export async function resetPassword(email: string, token: string, password: string) {
    try {
        const res = await postAPI("/reset-password", { email, token, password });
        if (res.ok) {
            successToast(
                "Password reset successfully. Return to the Journal tab and log in with this password.",
            );
            return true;
        }

        if (res.status == 404) {
            errorToast("No account with that email exists.");
            return false;
        }

        if (res.status == 401) {
            errorToast(
                "This password reset link is invalid. Perhaps you clicked 'Send Link' multiple times and opened an older one.",
            );
            return false;
        }

        if (res.status == 406) {
            errorToast("This password reset link has expired. Generate a new one and try again.");
            return false;
        }

        errorToast("An unexpected error occurred. Try again later.");
        return false;
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server. Are you connected to the internet?");
        return false;
    }
}
