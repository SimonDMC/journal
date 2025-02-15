import "./ProfileIcon.css";
import { uploadKey, downloadKey, download, upload, wipeLocalDatabase, getOptions, getUserName, changePassword } from "@/util/profile";
import { forceReload } from "@/util/update";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "../dropdown/Dropdown";
import DropdownItem from "../dropdown/DropdownItem";
import DropdownSeparator from "../dropdown/DropdownSeparator";
import DropdownText from "../dropdown/DropdownText";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DropdownHeading from "../dropdown/DropdownHeading";
import { logout } from "@/util/auth";
import { Options, setCodeword, setupBioAuth, switch2fa } from "@/util/options";

export default function ProfileIcon() {
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [options, setOptions] = useState({} as Options);
    const router = useRouter();
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

        setOptions(getOptions());

        return () => {
            document.removeEventListener("click", clickOutside);
        };
    }, []);

    return (
        <div className="top-right" id="profile-dropdown">
            <a onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                <FontAwesomeIcon icon={faUser} />
            </a>
            <Dropdown open={profileDropdownOpen}>
                <DropdownText label={username.current} />
                <DropdownSeparator />
                <DropdownHeading label="Actions" />
                <DropdownItem
                    label="Upload Key"
                    description="Upload a local key to encrypt and decrypt entries with; used when communicating with the remote database"
                    onClick={uploadKey}
                />
                <DropdownItem label="Download Key" description="Export the locally saved key into a KEY file" onClick={downloadKey} />
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
                    onClick={() => switch2fa(options, setOptions)}
                />
                {/* only render "set codeword" or "setup bioauth" if the corresponding settings are selected */}
                {options["2fa_method"] == 1 && <DropdownItem label="Set Codeword" onClick={() => setCodeword(options, setOptions)} />}
                {options["2fa_method"] == 2 && <DropdownItem label="Setup Biometry" onClick={() => setupBioAuth(options, setOptions)} />}
                <DropdownSeparator />
                <DropdownHeading label="Debug" />
                <DropdownItem label="Force Reload" description="Delete local page cache and reload" onClick={forceReload} />
                <DropdownItem
                    label="Wipe Local DB"
                    description="Delete all locally saved entries (resyncs with the database on page reload)"
                    onClick={wipeLocalDatabase}
                />
                <DropdownSeparator />
                <DropdownItem label="Log Out" onClick={() => logout(router)} />
            </Dropdown>
        </div>
    );
}
