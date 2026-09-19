import SettingsPopup from "../settings/SettingsPopup";
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
        </>
    );
}
