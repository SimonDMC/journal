import "./Settings.css";
import { useState } from "react";
import SettingsTab from "./SettingsTab";
import SettingsToggle from "./SettingsToggle";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../state/settings";
import SettingsButton from "./SettingsButton";
import { changePassword, changePasswordMismatched } from "../../settings/password";
import { exportEntries, uploadEntries } from "../../settings/entries";
import SettingsPassword from "./SettingsPassword";
import SettingsSeparator from "./SettingsSeparator";
import { downloadKey, generateKey, uploadKey } from "../../settings/key";
import SettingsSelect from "./SettingsSelect";
import { setCodeword, setCodewordMismatched, setupPasskey } from "../../settings/auth";
import { syncDatabase } from "../../database/sync";
import SettingsContent from "./SettingsContent";
import { forceReload } from "../../util/update";
import { showKeyHash } from "../../util/encryption";
import { wipeLocalDatabase } from "../../settings/debug";

export default function SettingsPopup() {
    const [selected, setSelected] = useState("general");
    const settingsState = useSettings();

    function closePopup(event: React.MouseEvent) {
        if (event.target !== event.currentTarget) return;
        useSettings.getState().closeSettings();
    }

    return (
        <AnimatePresence>
            {settingsState.settingsOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="settings-bg"
                    onClick={closePopup}
                >
                    <div className="settings-body">
                        <div className="settings-tabs">
                            <SettingsTab id="general" label="General" setSelected={setSelected} selected={selected} />
                            <SettingsTab id="security" label="Security" setSelected={setSelected} selected={selected} />
                            <SettingsTab id="debug" label="Debug" setSelected={setSelected} selected={selected} />
                        </div>
                        {selected == "general" && (
                            <SettingsContent>
                                <SettingsToggle
                                    label="Show Mood"
                                    settingKey="general.show_mood"
                                    desc="Show mood selection while writing entries"
                                />
                                <SettingsToggle
                                    label="Show Stats"
                                    settingKey="general.show_stats"
                                    desc="Show entry count and total word count stats on the overview page"
                                />
                                <SettingsToggle
                                    label="Show One Year Ago"
                                    settingKey="general.show_one_year_ago"
                                    desc="Show the One Year Ago button below the calendar"
                                />
                                <SettingsSeparator />
                                <SettingsButton
                                    label="Export Entries"
                                    desc="Download a copy of all your entries"
                                    actionLabel="Export"
                                    action={exportEntries}
                                />
                            </SettingsContent>
                        )}
                        {selected == "security" && (
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
                                    options={{ none: "None", codeword: "Codeword", passkey: "Passkey" }}
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
                        )}
                        {selected == "debug" && (
                            <SettingsContent>
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
                                    label="View Key Hash"
                                    desc="Show a hash of your encryption key, useful for verifying it matches across clients"
                                    actionLabel="View"
                                    action={showKeyHash}
                                />
                            </SettingsContent>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
