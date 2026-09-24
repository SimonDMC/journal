import { useState } from "react";
import SettingsContent from "../../ui/SettingsContent";
import { syncDatabase } from "../../../database/sync";
import { successToast } from "../../../util/toast";
import SettingsButton from "../../ui/SettingsButton";
import SettingsPassword from "../../ui/SettingsPassword";
import SettingsSeparator from "../../ui/SettingsSeparator";
import SettingsWarn from "../../ui/SettingsWarn";
import { login, getUserName, unlinkAccount, deleteAccount } from "../../util/account";
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

    async function confirmUnlink() {
        if (
            !confirm(
                // if we have a login required popup, it might mean the account is deleted. for that
                // reason, tailor the info message a bit towards possible account deletion
                useSettings.getState().getBoolean("alert.login_required")
                    ? `Are you sure you want to unlink the account ${getUserName()} from this device? If this account is deleted, your entries will remain saved only in your browser. Otherwise, they will also remain on the server, but they will no longer sync. If you aren't logged in on any other device, you'll likely lose access to this account!`
                    : `Are you sure you want to unlink the account ${getUserName()} from this device? Your entries will remain saved in your browser, and on the server, but they will no longer sync. If you aren't logged in on any other device, you'll likely lose access to this account!`,
            )
        ) {
            return;
        }

        await unlinkAccount();
        props.setAccountScreen(AccountScreen.CREATE_OR_LOGIN);
    }

    async function confirmDelete() {
        if (
            !confirm(
                `Are you sure you want to DELETE the account ${getUserName()}? Your entries will remain saved only in your browser. If you're logged into this account on other devices, you'll have to click "Unlink Account" on each of them. This action is irreversible.`,
            )
        ) {
            return;
        }

        await deleteAccount();
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
                danger={true}
                action={confirmUnlink}
            />
            <SettingsButton
                label="Delete Account"
                desc="Delete your account from the server. You will keep your entries locally, but they will no longer be synced with your other devices."
                actionLabel="Delete"
                danger={true}
                action={confirmDelete}
            />
        </SettingsContent>
    );
}
