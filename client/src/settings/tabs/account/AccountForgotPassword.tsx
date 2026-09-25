import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { AccountScreen } from "../../../types/settings";
import SettingsContent from "../../ui/SettingsContent";
import { forgotPassword } from "../../util/password";

export default function AccountForgotPassword(props: {
    setAccountScreen: React.Dispatch<React.SetStateAction<AccountScreen>>;
}) {
    const [email, setEmail] = useState("");

    async function attemptForgot() {
        if (!email) return;

        const success = await forgotPassword(email);
        if (success) props.setAccountScreen(AccountScreen.LOGIN);
    }

    return (
        <SettingsContent>
            <button
                className="settings-back-button"
                onClick={() => props.setAccountScreen(AccountScreen.CREATE_OR_LOGIN)}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div className="settings-multi-input-container long-inputs">
                <div className="settings-multi-input-row">
                    <div className="left">Email</div>
                    <div className="right">
                        <input
                            className="settings-multi-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") attemptForgot();
                            }}
                        />
                    </div>
                </div>
                <div className="settings-multi-input-row">
                    <div></div>
                    <button className="settings-button" onClick={() => attemptForgot()}>
                        Send Link
                    </button>
                </div>
            </div>
        </SettingsContent>
    );
}
