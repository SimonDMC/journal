import "../styles/reset-password.css";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "../settings/util/account";
import { errorToast } from "../util/toast";

type ResetPasswordSearchParams = {
    email: string;
    token: string;
};

export const Route = createFileRoute("/reset-password")({
    component: ResetPassword,
    validateSearch: (search: Record<string, unknown>): ResetPasswordSearchParams => {
        // validate and parse the search params into a typed state
        return {
            email: search.email as string,
            token: search.token as string,
        };
    },
});

function ResetPassword() {
    const [mainInput, setMainInput] = useState("");
    const [confirmInput, setConfirmInput] = useState("");
    const searchParams = Route.useSearch();

    async function attemptReset() {
        if (!mainInput || !confirmInput) return;

        if (mainInput != confirmInput) {
            errorToast("Passwords don't match.");
            return;
        }

        const res = await resetPassword(searchParams.email, searchParams.token, mainInput);
        if (res) {
            setMainInput("");
            setConfirmInput("");
        }
    }

    return (
        <main className="reset-password">
            <div className="container">
                <div className="row">
                    <div className="left">Reset Password</div>
                    <div className="right">
                        <input
                            type="password"
                            placeholder="New Password"
                            className="settings-password"
                            value={mainInput}
                            onChange={(e) => setMainInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter")
                                    ((e.target as HTMLElement).nextSibling as HTMLElement).focus();
                            }}
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="settings-password"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") attemptReset();
                            }}
                        />
                        <button className="settings-button" onClick={attemptReset}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
