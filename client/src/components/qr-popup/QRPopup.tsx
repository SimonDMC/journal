import { CloseOpenPopupEvent, eventTarget, QRCodeOpenEvent } from "../../util/events";
import "./QRPopup.css";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../settings/util/state";

export default function QRPopup() {
    const [open, setOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");

    useEffect(() => {
        // initialize popup data and open whenever show qr code is pressed
        const updateReadyHandler = (e: Event) => {
            const { url } = (e as QRCodeOpenEvent).detail;
            setQrCodeUrl(url);
            setOpen(true);
        };
        eventTarget.addEventListener(QRCodeOpenEvent.eventId, updateReadyHandler);

        const closeOpenPopupHandler = () => setOpen(false);
        eventTarget.addEventListener(CloseOpenPopupEvent.eventId, closeOpenPopupHandler);

        const keydown = async (event: KeyboardEvent) => {
            if (!open) return;

            // dismiss popup using esc
            if (event.key === "Escape") dismissPopup();
        };

        if (open) {
            document.addEventListener("keydown", keydown, true);
        }

        // remove listeners on unmount
        return () => {
            eventTarget.removeEventListener(QRCodeOpenEvent.eventId, updateReadyHandler);
            eventTarget.removeEventListener(CloseOpenPopupEvent.eventId, closeOpenPopupHandler);

            document.removeEventListener("keydown", keydown, true);
        };
    }, [open]);

    function dismissPopup() {
        setOpen(false);
        useSettings.getState().openSettings();
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    id="qr-bg"
                    onClick={() => dismissPopup()}
                >
                    <div className="qr-body">
                        <img src={qrCodeUrl} alt="Encryption Key QR Code" />
                        <p>
                            Login on another device, then scan this QR code when prompted to import
                            your encryption key.
                        </p>
                        <p className="danger">Do not share this QR code with anyone.</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
