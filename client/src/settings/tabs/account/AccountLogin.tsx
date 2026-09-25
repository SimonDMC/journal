import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { AccountScreen } from "../../../types/settings";
import { errorToast } from "../../../util/toast";
import SettingsContent from "../../ui/SettingsContent";
import { login } from "../../util/account";

export default function AccountLogin(props: {
    setAccountScreen: React.Dispatch<React.SetStateAction<AccountScreen>>;
}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function attemptLogin() {
        if (!username || !password) {
            errorToast("All fields are mandatory.");
            return;
        }

        const success = await login(username, password);
        if (success) {
            localStorage.setItem("journal-username", username);
            props.setAccountScreen(AccountScreen.IMPORT_KEY);
        }
    }

    return (
        <SettingsContent>
            <button
                className="settings-back-button"
                onClick={() => props.setAccountScreen(AccountScreen.CREATE_OR_LOGIN)}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div className="settings-multi-input-container">
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
                            className="settings-multi-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") attemptLogin();
                            }}
                        />
                    </div>
                </div>
                <div className="settings-multi-input-row align-end">
                    <div className="note">
                        <a onClick={() => props.setAccountScreen(AccountScreen.FORGOT_PASSWORD)}>
                            Forgot password?
                        </a>
                    </div>
                    <button className="settings-button" onClick={() => attemptLogin()}>
                        Login
                    </button>
                </div>
            </div>
        </SettingsContent>
    );
}
