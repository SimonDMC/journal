import { setCodeword, setCodewordMismatched, setupPasskey } from "../util/auth";
import { useSettings } from "../util/state";
import SettingsButton from "../ui/SettingsButton";
import SettingsContent from "../ui/SettingsContent";
import SettingsPassword from "../ui/SettingsPassword";
import SettingsSelect from "../ui/SettingsSelect";
import SettingsStatus from "../ui/SettingsStatus";
import SettingsSeparator from "../ui/SettingsSeparator";
import { wipeAllData } from "../util/entries";
import { isLoggedIn } from "../util/account";
import { CloseOpenPopupEvent, eventTarget, OpenPrivacyPopupEvent } from "../../util/events";

export default function SettingsSecurityTab() {
    const settingsState = useSettings();

    function viewPrivacyPolicy() {
        eventTarget.dispatchEvent(new CloseOpenPopupEvent());
        eventTarget.dispatchEvent(new OpenPrivacyPopupEvent());
    }

    async function confirmWipe() {
        if (
            !confirm(
                isLoggedIn()
                    ? "Are you SURE you want to delete all your locally-stored Journal data? This includes your account login, your encryption key, your entries, and your settings. If you don't have a backup of your encryption key or a backup of your entries, YOU WILL NOT BE ABLE TO GET YOUR ENTRIES BACK! Do note that this does not impact your data stored on the server, or on your other devices."
                    : "Are you SURE you want to delete all your Journal data? This includes your entries and your settings. Unless you have a backup of your entries, YOU WILL NOT BE ABLE TO GET YOUR ENTRIES BACK!",
            )
        ) {
            return;
        }

        if (await wipeAllData()) {
            // navigate() breaks, possibly due to the wipe. regardless, i think it's fine (possibly
            // even desired) to do a full-page navigation
            window.location.replace("/overview");
        }
    }

    return (
        <SettingsContent>
            <SettingsSelect
                label="Secondary Auth"
                settingKey="security.secondary_auth"
                desc="Add a second layer of security to Journal, which you'll have to authenticate with every time you open the app"
                options={{
                    none: "None",
                    codeword: "Codeword",
                    passkey: "Passkey",
                }}
            />
            {settingsState.getString("security.secondary_auth") == "codeword" && (
                <>
                    <SettingsPassword
                        label="Set Codeword"
                        desc="Set a codeword that you'll have to type every time you open Journal. Make sure you remember it!"
                        mainPlaceholder="Codeword"
                        confirmPlaceholder="Confirm Codeword"
                        actionLabel="Set"
                        action={setCodeword}
                        actionFail={setCodewordMismatched}
                    />
                    {settingsState.getSetting("data.codeword_hash") ? (
                        <SettingsStatus text="Codeword active" success={true} />
                    ) : (
                        <SettingsStatus text="Codeword not set yet" success={false} />
                    )}
                </>
            )}
            {settingsState.getString("security.secondary_auth") == "passkey" && (
                <>
                    <SettingsButton
                        label={
                            settingsState.getSetting("data.passkey")
                                ? "Re-setup Passkey"
                                : "Setup Passkey"
                        }
                        desc="Setup a passkey, making you verify with a face or fingerprint scan every time you open Journal (based on what your device supports)"
                        actionLabel="Setup"
                        action={setupPasskey}
                    />
                    {settingsState.getSetting("data.passkey") ? (
                        <SettingsStatus text="Passkey active" success={true} />
                    ) : (
                        <SettingsStatus text="Passkey not set up yet" success={false} />
                    )}
                </>
            )}
            <SettingsSeparator />
            <SettingsButton
                label="View Privacy Policy"
                actionLabel="Open"
                action={viewPrivacyPolicy}
            />
            <SettingsButton
                label="Wipe All Data"
                desc="Remove ALL data Journal stores in your browser — your account login, encryption key, entries, and settings. This does not delete your account, or any data on it, if you have one."
                actionLabel="Wipe"
                danger={true}
                action={confirmWipe}
            />
        </SettingsContent>
    );
}
