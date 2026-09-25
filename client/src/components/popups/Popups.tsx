import SettingsPopup from "./SettingsPopup";
import PrivacyPopup from "./privacy-popup/PrivacyPopup";
import QRPopup from "./qr-popup/QRPopup";
import QRScanPopup from "./qr-scan-popup/QRScanPopup";
import UpdatePopup from "./update-popup/UpdatePopup";

export default function Popups() {
    return (
        <>
            <UpdatePopup />
            <SettingsPopup />
            <QRPopup />
            <QRScanPopup />
            <PrivacyPopup />
        </>
    );
}
