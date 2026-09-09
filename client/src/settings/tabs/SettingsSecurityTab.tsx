import { setCodeword, setCodewordMismatched, setupPasskey } from "../util/auth";
import { generateKey, uploadKey, downloadKey } from "../util/key";
import { changePassword, changePasswordMismatched } from "../util/password";
import { useSettings } from "../util/state";
import SettingsButton from "../ui/SettingsButton";
import SettingsContent from "../ui/SettingsContent";
import SettingsPassword from "../ui/SettingsPassword";
import SettingsSelect from "../ui/SettingsSelect";
import SettingsSeparator from "../ui/SettingsSeparator";

export default function SettingsSecurityTab() {
    const settingsState = useSettings();

    return (
        <SettingsContent>
            <SettingsPassword
                label="Change Password"
                mainPlaceholder="New Password"
                confirmPlaceholder="Confirm Password"
                actionLabel="Change"
                action={changePassword}
                actionFail={changePasswordMismatched}
            />
            <SettingsSeparator />
            <SettingsButton
                label="Generate Key"
                desc="Generate a new key used to encrypt and decrypt entries when talking to the server"
                actionLabel="Generate"
                action={generateKey}
            />
            <SettingsButton
                label="Import Key"
                desc="Import a key, used to encrypt and decrypt entries when talking to the server, from a .KEY file"
                actionLabel="Upload"
                action={uploadKey}
            />
            <SettingsButton label="Download Key" actionLabel="Download" action={downloadKey} />
            <SettingsSeparator />
            <SettingsSelect
                label="Secondary Auth"
                settingKey="security.secondary_auth"
                desc="Add a second layer of authentication to Journal"
                options={{
                    none: "None",
                    codeword: "Codeword",
                    passkey: "Passkey",
                }}
            />
            {settingsState.getString("security.secondary_auth") == "codeword" && (
                <SettingsPassword
                    label="Set Codeword"
                    desc="Set a codeword that you'll have to type every time you open Journal"
                    mainPlaceholder="Codeword"
                    confirmPlaceholder="Confirm Codeword"
                    actionLabel="Set"
                    action={setCodeword}
                    actionFail={setCodewordMismatched}
                />
            )}
            {settingsState.getString("security.secondary_auth") == "passkey" && (
                <SettingsButton
                    label="Setup Passkey"
                    desc="Setup a passkey, making you verify with a face or fingerprint scan every time you open Journal (based on what your device supports)"
                    actionLabel="Setup"
                    action={setupPasskey}
                />
            )}
        </SettingsContent>
    );
}
