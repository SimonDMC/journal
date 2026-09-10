import "../Settings.css";
import { useState } from "react";
import SettingsContent from "../ui/SettingsContent";
import { isLoggedIn } from "../util/account";
import { faArrowLeft, faArrowRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import SettingsCard from "../ui/SettingsCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { errorToast } from "../../util/toast";

enum AccountScreen {
    CREATE_OR_LOGIN,
    CREATE,
    LOGIN,
    IMPORT_KEY,
    MANAGEMENT,
}

export default function SettingsGeneralTab() {
    const [accountScreen, setAccountScreen] = useState(
        isLoggedIn() && false ? AccountScreen.MANAGEMENT : AccountScreen.CREATE_OR_LOGIN,
    );

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    function attemptLogin() {
        if (!email || !username || !password) {
            errorToast("All fields are mandatory.");
        }

        if (password != passwordConfirm) {
            errorToast("Passwords do not match.");
            return;
        }
    }

    if (accountScreen == AccountScreen.CREATE_OR_LOGIN) {
        return (
            <SettingsContent>
                <div className="settings-card-container">
                    <SettingsCard
                        icon={faUserPlus}
                        title="Create Account"
                        desc="Create a new account to sync entries between devices"
                        onClick={() => setAccountScreen(AccountScreen.CREATE)}
                    />
                    <SettingsCard
                        icon={faArrowRightToBracket}
                        title="Log In"
                        desc="Log into an existing account from a new device"
                        onClick={() => setAccountScreen(AccountScreen.LOGIN)}
                    />
                </div>
            </SettingsContent>
        );
    }

    if (accountScreen == AccountScreen.CREATE) {
        return (
            <SettingsContent>
                <button
                    className="settings-back-button"
                    onClick={() => setAccountScreen(AccountScreen.CREATE_OR_LOGIN)}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <div className="settings-multi-input-container">
                    <div className="settings-multi-input-row">
                        <div className="left">Email</div>
                        <div className="right">
                            <input
                                className="settings-multi-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key == "Enter")
                                        (
                                            (e.target as HTMLElement).nextSibling as HTMLElement
                                        ).focus();
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
                                        (
                                            (e.target as HTMLElement).nextSibling as HTMLElement
                                        ).focus();
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
                                placeholder="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key == "Enter")
                                        (
                                            (e.target as HTMLElement).nextSibling as HTMLElement
                                        ).focus();
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
                                        attemptLogin();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="settings-multi-input-row">
                        <div></div>
                        <button className="settings-button" onClick={() => attemptLogin()}>
                            Create Account
                        </button>
                    </div>
                </div>
            </SettingsContent>
        );
    }

    return <SettingsContent>{accountScreen}</SettingsContent>;
}
