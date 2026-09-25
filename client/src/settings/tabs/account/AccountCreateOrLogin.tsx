import { AccountScreen } from "../../../types/settings";
import SettingsContent from "../../ui/SettingsContent";
import SettingsCard from "../../ui/SettingsCard";
import { faArrowRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";

export default function AccountCreateOrLogin(props: {
    setAccountScreen: React.Dispatch<React.SetStateAction<AccountScreen>>;
}) {
    return (
        <SettingsContent>
            <div className="settings-card-container">
                <SettingsCard
                    icon={faUserPlus}
                    title="Create Account"
                    desc="Create a new account to sync your entries between devices"
                    onClick={() => props.setAccountScreen(AccountScreen.CREATE)}
                />
                <SettingsCard
                    icon={faArrowRightToBracket}
                    title="Log In"
                    desc="Log into an existing account from a new device"
                    onClick={() => props.setAccountScreen(AccountScreen.LOGIN)}
                />
            </div>
        </SettingsContent>
    );
}
