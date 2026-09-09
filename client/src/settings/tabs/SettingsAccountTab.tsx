import "../Settings.css";
import { useState } from "react";
import SettingsContent from "../ui/SettingsContent";
import { isLoggedIn } from "../../util/account";
import { faArrowRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import SettingsCard from "../ui/SettingsCard";

enum AccountScreen {
    CREATE_OR_LOGIN,
    CREATE,
    LOGIN,
    IMPORT_KEY,
    MANAGEMENT,
}

export default function SettingsGeneralTab() {
    const [accountScreen, setAccountScreen] = useState(
        isLoggedIn() && false ? AccountScreen.MANAGEMENT : AccountScreen.CREATE_OR_LOGIN,
    );

    if (accountScreen == AccountScreen.CREATE_OR_LOGIN) {
        return (
            <SettingsContent>
                <div className="settings-card-container">
                    <SettingsCard
                        icon={faUserPlus}
                        title="Create Account"
                        desc="Create a new account to sync entries between devices"
                        onClick={() => setAccountScreen(AccountScreen.CREATE)}
                    />
                    <SettingsCard
                        icon={faArrowRightToBracket}
                        title="Log In"
                        desc="Log into an existing account from a new device"
                        onClick={() => setAccountScreen(AccountScreen.LOGIN)}
                    />
                </div>
            </SettingsContent>
        );
    }

    return <SettingsContent>{accountScreen}</SettingsContent>;
}
