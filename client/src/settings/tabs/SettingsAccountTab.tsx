import "../Settings.css";
import { useState } from "react";
import SettingsContent from "../ui/SettingsContent";
import { createAccount, getUserName, isLoggedIn, login, unlinkAccount } from "../util/account";
import { faArrowLeft, faArrowRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import SettingsCard from "../ui/SettingsCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { errorToast } from "../../util/toast";
import SettingsSeparator from "../ui/SettingsSeparator";
import { downloadKey } from "../util/key";
import SettingsButton from "../ui/SettingsButton";
import SettingsWarn from "../ui/SettingsWarn";
import { useSettings } from "../util/state";
import SettingsPassword from "../ui/SettingsPassword";
import { changePassword, changePasswordMismatched } from "../util/password";

enum AccountScreen {
    CREATE_OR_LOGIN,
    CREATE,
    LOGIN,
    IMPORT_KEY,
    MANAGEMENT,
}

export default function SettingsGeneralTab() {
    const [accountScreen, setAccountScreen] = useState(
        isLoggedIn() ? AccountScreen.MANAGEMENT : AccountScreen.CREATE_OR_LOGIN,
    );

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const settingsState = useSettings();

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
        if (success) setAccountScreen(AccountScreen.MANAGEMENT);
    }

    async function attemptLogin() {
        if (!username || !password) {
            errorToast("All fields are mandatory.");
            return;
        }

        const success = await login(username, password);
        if (success) useSettings.getState().setSetting("alert.login_required", false);
    }

    if (accountScreen == AccountScreen.CREATE_OR_LOGIN) {
        return (
            <SettingsContent>
                <div className="settings-card-container">
                    <SettingsCard
                        icon={faUserPlus}
                        title="Create Account"
                        desc="Create a new account to sync your entries between devices"
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
                                    if (e.key == "Enter") {
                                        (
                                            (e.target as HTMLElement).nextSibling as HTMLElement
                                        ).focus();
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
                                className="settings-multi-input collapse"
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

    if (accountScreen == AccountScreen.MANAGEMENT) {
        return (
            <SettingsContent>
                <div className="settings-text">
                    Logged in as: <b>{getUserName()}</b>
                </div>
                <SettingsSeparator />
                {settingsState.getBoolean("alert.login_required") && (
                    <>
                        <SettingsWarn>
                            Your login session has expired. <br />
                            Login again to resume syncing.
                        </SettingsWarn>
                        <div className="settings-multi-input-container">
                            <div className="settings-multi-input-row">
                                <div className="left">Login Again</div>
                                <div className="right">
                                    <input
                                        className="settings-multi-input"
                                        value={username}
                                        placeholder="Username"
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key == "Enter")
                                                (
                                                    (e.target as HTMLElement)
                                                        .nextSibling as HTMLElement
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
                                        value={password}
                                        placeholder="Password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key == "Enter") attemptLogin();
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="settings-multi-input-row">
                                <div></div>
                                <button className="settings-button" onClick={() => attemptLogin()}>
                                    Login
                                </button>
                            </div>
                        </div>
                        <SettingsSeparator />
                    </>
                )}
                {settingsState.getBoolean("alert.key_irrecoverability") && (
                    <SettingsWarn>
                        By design, your encryption is key never shared with the server and thus{" "}
                        <b>cannot be recovered</b>. It is strongly recommended to make a local
                        backup by clicking "Download Key."
                    </SettingsWarn>
                )}
                <SettingsButton
                    label="Download Key"
                    desc="Download your encryption key. Useful for backing it up or adding a new device to your Journal."
                    actionLabel="Download"
                    action={downloadKey}
                />
                <SettingsButton
                    label="Show QR Code"
                    desc="Show a QR code with your encryption key embedded in it, for adding a new device to your Journal. Do not share this with anyone!"
                    actionLabel="Show"
                    action={downloadKey}
                />
                <SettingsSeparator />
                <SettingsPassword
                    label="Change Password"
                    mainPlaceholder="New Password"
                    confirmPlaceholder="Confirm Password"
                    actionLabel="Change"
                    action={changePassword}
                    actionFail={changePasswordMismatched}
                />
                <SettingsButton
                    label="Unlink Account"
                    desc="Remove the account from this device. You will keep your entries locally, but they will no longer be synced with your other devices."
                    actionLabel="Unlink"
                    action={unlinkAccount}
                />
            </SettingsContent>
        );
    }

    return <SettingsContent>{accountScreen}</SettingsContent>;
}
