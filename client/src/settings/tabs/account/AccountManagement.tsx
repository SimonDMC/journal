import { useState } from "react";
import SettingsContent from "../../ui/SettingsContent";
import { syncDatabase } from "../../../database/sync";
import { successToast } from "../../../util/toast";
import SettingsButton from "../../ui/SettingsButton";
import SettingsPassword from "../../ui/SettingsPassword";
import SettingsSeparator from "../../ui/SettingsSeparator";
import SettingsWarn from "../../ui/SettingsWarn";
import { login, getUserName, unlinkAccount } from "../../util/account";
import { downloadKey, showQRCode } from "../../util/key";
import { changePassword, changePasswordMismatched } from "../../util/password";
import { useSettings } from "../../util/state";
import { AccountScreen } from "../../../types/settings";

export default function AccountManagement(props: {
    setAccountScreen: React.Dispatch<React.SetStateAction<AccountScreen>>;
}) {
    const [password, setPassword] = useState("");
    const settingsState = useSettings();

    async function attemptReLogin() {
        if (!password) {
            return;
        }

        const success = await login(getUserName(), password);
        if (success) {
            useSettings.getState().setSetting("alert.login_required", false);
            successToast("Re-logged in successfully!");
            syncDatabase();
        }
    }

    async function unlinkAndLogout() {
        await unlinkAccount();
        props.setAccountScreen(AccountScreen.CREATE_OR_LOGIN);
    }

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
                        Re-enter your password to resume syncing.
                    </SettingsWarn>
                    <div className="settings-multi-input-container">
                        <div className="settings-multi-input-row">
                            <div className="left">Login Again</div>
                            <div className="right">
                                <input
                                    type="password"
                                    className="settings-multi-input"
                                    value={password}
                                    placeholder="Password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") attemptReLogin();
                                    }}
                                />
                            </div>
                        </div>
                        <div className="settings-multi-input-row">
                            <div></div>
                            <button className="settings-button" onClick={() => attemptReLogin()}>
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
                    <b>cannot be recovered</b>. It is strongly recommended to make a local backup by
                    clicking "Download Key."
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
                action={showQRCode}
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
                action={unlinkAndLogout}
            />
        </SettingsContent>
    );
}
