import { AccountScreen } from "../../../types/settings";
import SettingsContent from "../../ui/SettingsContent";
import SettingsCard from "../../ui/SettingsCard";
import { faFile, faQrcode } from "@fortawesome/free-solid-svg-icons";
import { uploadKey } from "../../util/key";

export default function AccountImportKey(props: {
    setAccountScreen: React.Dispatch<React.SetStateAction<AccountScreen>>;
}) {
    async function attemptUploadKey() {
        const res = await uploadKey();
        if (res) props.setAccountScreen(AccountScreen.MANAGEMENT);
    }

    return (
        <SettingsContent>
            <div className="settings-card-container">
                <SettingsCard
                    icon={faFile}
                    title="Import From File"
                    desc="Import your encryption key by exporting it on a logged-in device, and securely transferring it"
                    hint="Settings ▸ Account ▸ Download Key"
                    onClick={() => attemptUploadKey()}
                />
                <SettingsCard
                    icon={faQrcode}
                    title="Scan QR Code"
                    desc="Import your encryption key by scanning a QR Code generated on a logged-in device"
                    hint="Settings ▸ Account ▸ Show QR Code"
                    onClick={() => {}}
                />
            </div>
        </SettingsContent>
    );
}
