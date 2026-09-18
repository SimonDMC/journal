import "../Settings.css";
import { useState } from "react";
import SettingsContent from "../ui/SettingsContent";
import { AccountScreen } from "../../types/settings";
import AccountManagement from "./account/AccountManagement";
import AccountCreateOrLogin from "./account/AccountCreateOrLogin";
import AccountCreate from "./account/AccountCreate";
import AccountLogin from "./account/AccountLogin";
import { isLoggedIn } from "../util/account";
import AccountImportKey from "./account/AccountImportKey";

export default function SettingsGeneralTab() {
    const [accountScreen, setAccountScreen] = useState(
        isLoggedIn()
            ? AccountScreen.MANAGEMENT
            : localStorage.getItem("journal-username")
              ? AccountScreen.IMPORT_KEY
              : AccountScreen.CREATE_OR_LOGIN,
    );

    if (accountScreen == AccountScreen.CREATE_OR_LOGIN) {
        return <AccountCreateOrLogin setAccountScreen={setAccountScreen} />;
    }

    if (accountScreen == AccountScreen.CREATE) {
        return <AccountCreate setAccountScreen={setAccountScreen} />;
    }

    if (accountScreen == AccountScreen.LOGIN) {
        return <AccountLogin setAccountScreen={setAccountScreen} />;
    }

    if (accountScreen == AccountScreen.IMPORT_KEY) {
        return <AccountImportKey setAccountScreen={setAccountScreen} />;
    }

    if (accountScreen == AccountScreen.MANAGEMENT) {
        return <AccountManagement setAccountScreen={setAccountScreen} />;
    }

    return <SettingsContent>{accountScreen}</SettingsContent>;
}
