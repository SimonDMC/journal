import "./ProfileIcon.css";
import { uploadKey, downloadKey, download, upload, wipeLocalDatabase, getUserName, changePassword, generateKey } from "../../util/profile";
import { forceReload } from "../../util/update";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "../dropdown/Dropdown";
import DropdownItem from "../dropdown/DropdownItem";
import DropdownSeparator from "../dropdown/DropdownSeparator";
import DropdownText from "../dropdown/DropdownText";
import { useEffect, useRef, useState } from "react";
import DropdownHeading from "../dropdown/DropdownHeading";
import { logout } from "../../util/auth";
import { type Settings, setCodeword, setupBioAuth, switch2fa } from "../../util/settings";
import { showKeyHash } from "../../util/encryption";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { syncDatabase } from "../../database/sync";
import { eventTarget, SettingsOpenEvent } from "../../util/events";

export default function ProfileIcon() {
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [settings, setSettings] = useState({} as Settings);
    const navigate = useNavigate();
    const username = useRef("User");

    useEffect(() => {
        username.current = getUserName();

        // close when clicking outside of dropdown
        const clickOutside = (e: MouseEvent) => {
            if (!document.getElementById("profile-dropdown")?.contains(e.target as HTMLElement)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener("click", clickOutside);

        return () => {
            document.removeEventListener("click", clickOutside);
        };
    }, []);

    return (
        <div className="top-right" id="profile-dropdown">
            <a onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                <FontAwesomeIcon icon={faUser} />
            </a>
            <AnimatePresence>
                {profileDropdownOpen && (
                    <Dropdown>
                        <DropdownText label={username.current} />
                        <DropdownSeparator />
                        <DropdownItem
                            label="Settings"
                            onClick={() => {
                                eventTarget.dispatchEvent(new SettingsOpenEvent());
                                setProfileDropdownOpen(false);
                            }}
                        />
                        <DropdownHeading label="Actions" />
                        <DropdownItem
                            label="Generate Key"
                            description="Generate a new key to encrypt and decrypt all of your entries with when communicating with the remote database"
                            onClick={generateKey}
                        />
                        <DropdownItem label="Upload Key" description="Upload a key from a KEY file" onClick={uploadKey} />
                        <DropdownItem
                            label="Download Key"
                            description="Export the locally saved key into a KEY file"
                            onClick={downloadKey}
                        />
                        <DropdownItem label="Export" description="Export all entries saved locally into a JSON file" onClick={download} />
                        <DropdownItem
                            label="Import"
                            description="Import entries from a JSON file - DELETES ALL CURRENTLY SAVED ENTRIES FROM THE DATABASE!"
                            onClick={upload}
                        />
                        <DropdownItem label="Change Password" onClick={changePassword} />
                        <DropdownSeparator />
                        <DropdownHeading label="2FA" />
                        <DropdownItem
                            label="Switch 2FA"
                            description="Switch between no 2fa, codeword and biometric auth"
                            onClick={() => switch2fa(settings, setSettings)}
                        />
                        {/* only render "set codeword" or "setup bioauth" if the corresponding settings are selected */}
                        {settings["2fa_method"] == 1 && (
                            <DropdownItem label="Set Codeword" onClick={() => setCodeword(settings, setSettings)} />
                        )}
                        {settings["2fa_method"] == 2 && (
                            <DropdownItem label="Setup Biometry" onClick={() => setupBioAuth(settings, setSettings)} />
                        )}
                        <DropdownSeparator />
                        <DropdownHeading label="Debug" />
                        <DropdownItem label="Force Reload" description="Delete local page cache and reload" onClick={forceReload} />
                        <DropdownItem label="Invoke Sync" description="Forcefully invoke database sync" onClick={syncDatabase} />
                        <DropdownItem
                            label="Show Key Hash"
                            description="Show a hash of your encryption key for debug purposes"
                            onClick={showKeyHash}
                        />
                        <DropdownItem
                            label="Wipe Local DB"
                            description="Delete all locally saved entries (resyncs with the database on page reload)"
                            onClick={wipeLocalDatabase}
                        />
                        <DropdownSeparator />
                        <DropdownItem label="Log Out" onClick={() => logout(navigate)} />
                    </Dropdown>
                )}
            </AnimatePresence>
        </div>
    );
}
