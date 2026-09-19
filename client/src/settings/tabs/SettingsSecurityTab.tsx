import { setCodeword, setCodewordMismatched, setupPasskey } from "../util/auth";
import { useSettings } from "../util/state";
import SettingsButton from "../ui/SettingsButton";
import SettingsContent from "../ui/SettingsContent";
import SettingsPassword from "../ui/SettingsPassword";
import SettingsSelect from "../ui/SettingsSelect";
import SettingsStatus from "../ui/SettingsStatus";

export default function SettingsSecurityTab() {
    const settingsState = useSettings();

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
        </SettingsContent>
    );
}
