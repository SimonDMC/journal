import { API_URL } from "../util/config";
import { errorToast, successToast } from "../util/toast";

export async function changePassword(password: string) {
    const res = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
    });

    if (res.ok) {
        successToast("Password changed successfully!");
    } else {
        errorToast("Failed to change password.");
    }
}

export async function changePasswordMismatched() {
    errorToast("Passwords do not match.");
}
