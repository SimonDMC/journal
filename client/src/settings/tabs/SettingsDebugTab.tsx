import { syncDatabase } from "../../database/sync";
import { wipeLocalDatabase } from "../util/debug";
import { uploadEntries } from "../util/entries";
import { decryptTextAndLog } from "../../util/crypto";
import { formatTimestampShort, getYear } from "../../util/time";
import { forceReload, getCurrentVersion } from "../../util/update";
import SettingsButton from "../ui/SettingsButton";
import SettingsContent from "../ui/SettingsContent";
import SettingsInput from "../ui/SettingsInput";
import SettingsSeparator from "../ui/SettingsSeparator";
import { generateAndSaveKey, showKeyHash, uploadKey } from "../util/key";
import SettingsWarn from "../ui/SettingsWarn";

export default function SettingsDebugTab() {
    return (
        <SettingsContent>
            <SettingsWarn>
                These actions are for testing, debugging and diagnosing. I would advise against
                using them unless you know what you're doing.
            </SettingsWarn>
            <SettingsSeparator />
            <SettingsButton
                label="Invoke Sync"
                desc="Force a server sync, uploading outstanding entries and downloading missing ones"
                actionLabel="Sync"
                action={syncDatabase}
            />
            <SettingsButton
                label="Wipe Local Entries"
                desc="Delete all your existing entries locally — remote entries stay in the database and get downloaded next sync"
                actionLabel="Delete"
                action={wipeLocalDatabase}
            />
            <SettingsButton
                label="Import Entries"
                desc="Delete all your existing entries and import them from an exported entries file. This is a dangerous operation!"
                actionLabel="Upload"
                action={uploadEntries}
            />
            <SettingsButton
                label="Force Reload"
                desc="Delete all app cache and redownload all assets"
                actionLabel="Reload"
                action={forceReload}
            />
            <SettingsButton
                label="Generate Key"
                desc="Generate a new key used to encrypt and decrypt entries when talking to the server"
                actionLabel="Generate"
                action={generateAndSaveKey}
            />
            <SettingsButton
                label="Import Key"
                desc="Import a key, used to encrypt and decrypt entries when talking to the server, from a .KEY file"
                actionLabel="Upload"
                action={uploadKey}
            />
            <SettingsButton
                label="View Key Hash"
                desc="Show a hash of your encryption key, useful for verifying it matches across devices"
                actionLabel="View"
                action={showKeyHash}
            />
            <SettingsInput
                label="Decrypt Text"
                desc="Decrypt some text with your encryption key and log the output to console"
                placeholder="Text"
                actionLabel="Decrypt"
                action={decryptTextAndLog}
            />
            <SettingsSeparator />
            <div className="settings-text build-info">
                Build <code>{__BUILD_INFO__.commitHash}</code> —{" "}
                {formatTimestampShort(__BUILD_INFO__.buildTimestamp)}.
                <br />
                Version <strong>v{getCurrentVersion()}</strong>. © SimonDMC,{" "}
                {getYear(__BUILD_INFO__.buildTimestamp)}.
            </div>
        </SettingsContent>
    );
}
