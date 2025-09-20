import "./ProfileIcon.css";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "../dropdown/Dropdown";
import DropdownItem from "../dropdown/DropdownItem";
import DropdownSeparator from "../dropdown/DropdownSeparator";
import DropdownText from "../dropdown/DropdownText";
import { useEffect, useRef, useState } from "react";
import { logout } from "../../util/auth";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { getUserName, useSettings } from "../../state/settings";
import { exportEntries } from "../../settings/entries";

export default function ProfileIcon() {
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
                                useSettings.getState().openSettings();
                                setProfileDropdownOpen(false);
                            }}
                        />
                        <DropdownItem label="Export Entries" onClick={exportEntries} />
                        <DropdownItem label="Log Out" onClick={() => logout(navigate)} />
                    </Dropdown>
                )}
            </AnimatePresence>
        </div>
    );
}
