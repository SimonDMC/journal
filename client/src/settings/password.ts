import { postAPI } from "../services/api";
import { errorToast, successToast } from "../util/toast";

export async function changePassword(password: string) {
    const res = await postAPI("/change-password", { password });

    if (res.ok) {
        successToast("Password changed successfully!");
    } else {
        errorToast("Failed to change password.");
    }
}

export async function changePasswordMismatched() {
    errorToast("Passwords do not match.");
}
