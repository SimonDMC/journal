import { useState } from "react";
import { AccountScreen } from "../../../types/settings";
import { errorToast } from "../../../util/toast";
import SettingsContent from "../../ui/SettingsContent";
import { createAccount } from "../../util/account";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function AccountCreate(props: {
    setAccountScreen: React.Dispatch<React.SetStateAction<AccountScreen>>;
}) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    async function attemptCreateAccount() {
        if (!email || !username || !password) {
            errorToast("All fields are mandatory.");
            return;
        }

        if (password != passwordConfirm) {
            errorToast("Passwords do not match.");
            return;
        }

        const success = await createAccount(email, username, password);
        if (success) props.setAccountScreen(AccountScreen.MANAGEMENT);
    }

    return (
        <SettingsContent>
            <button
                className="settings-back-button"
                onClick={() => props.setAccountScreen(AccountScreen.CREATE_OR_LOGIN)}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div className="settings-multi-input-container long-inputs">
                <div className="settings-multi-input-row">
                    <div className="left">Email</div>
                    <div className="right">
                        <input
                            className="settings-multi-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") {
                                    ((e.target as HTMLElement).nextSibling as HTMLElement).focus();
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="settings-multi-input-row">
                    <div className="left">Username</div>
                    <div className="right">
                        <input
                            className="settings-multi-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter")
                                    ((e.target as HTMLElement).nextSibling as HTMLElement).focus();
                            }}
                        />
                    </div>
                </div>
                <div className="settings-multi-input-row">
                    <div className="left">Password</div>
                    <div className="right">
                        <input
                            type="password"
                            className="settings-multi-input collapse"
                            value={password}
                            placeholder="Password"
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter")
                                    ((e.target as HTMLElement).nextSibling as HTMLElement).focus();
                            }}
                        />
                    </div>
                </div>
                <div className="settings-multi-input-row">
                    <div className="left"></div>
                    <div className="right">
                        <input
                            type="password"
                            className="settings-multi-input"
                            value={passwordConfirm}
                            placeholder="Confirm Password"
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") {
                                    attemptCreateAccount();
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="settings-multi-input-row">
                    <div></div>
                    <button className="settings-button" onClick={() => attemptCreateAccount()}>
                        Create Account
                    </button>
                </div>
            </div>
        </SettingsContent>
    );
}
