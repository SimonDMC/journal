import { CloseOpenPopupEvent, eventTarget, QRCodeScanOpenEvent } from "../../../util/events";
import "./QRScanPopup.css";
import "../Popups.css";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../../settings/util/state";
import { decryptQRCode } from "../../../settings/util/key";
import jsQR from "jsqr";

export default function QRScanPopup() {
    const [open, setOpen] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const cameraPreviewCanvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // initialize popup data and open whenever show qr code is pressed
        const qrScanOpenHandler = () => {
            setOpen(true);
        };
        eventTarget.addEventListener(QRCodeScanOpenEvent.eventId, qrScanOpenHandler);

        const closeOpenPopupHandler = () => setOpen(false);
        eventTarget.addEventListener(CloseOpenPopupEvent.eventId, closeOpenPopupHandler);

        const keydown = async (event: KeyboardEvent) => {
            if (!open) return;

            // dismiss popup using esc
            if (event.key === "Escape") dismissPopup();
        };

        let videoStream: MediaStream;
        if (open) {
            document.addEventListener("keydown", keydown, true);

            // mostly taken from https://cozmo.github.io/jsQR/
            const video = document.createElement("video");
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: "environment" } })
                .then(function (stream) {
                    videoStream = stream;
                    video.srcObject = stream;
                    video.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
                    video.play();
                    eventTarget.dispatchEvent(new CloseOpenPopupEvent());

                    eventTarget.dispatchEvent(new QRCodeScanOpenEvent());
                    requestAnimationFrame(tick);
                });

            async function tick() {
                setStreaming(true);
                if (!cameraPreviewCanvas.current) {
                    requestAnimationFrame(tick);
                    return;
                }
                const canvas = cameraPreviewCanvas.current.getContext("2d", {
                    willReadFrequently: true,
                })!;

                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    cameraPreviewCanvas.current.height = video.videoHeight;
                    cameraPreviewCanvas.current.width = video.videoWidth;
                    canvas.drawImage(
                        video,
                        0,
                        0,
                        cameraPreviewCanvas.current.width,
                        cameraPreviewCanvas.current.height,
                    );
                    const imageData = canvas.getImageData(
                        0,
                        0,
                        cameraPreviewCanvas.current.width,
                        cameraPreviewCanvas.current.height,
                    );
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (
                        code &&
                        // correct size
                        code.binaryData.length == 70 &&
                        // JRNL header matches
                        code.binaryData[0] == 0x4a &&
                        code.binaryData[1] == 0x52 &&
                        code.binaryData[2] == 0x4e &&
                        code.binaryData[3] == 0x4c
                    ) {
                        await decryptQRCode(new Uint8Array(code.binaryData));
                        dismissPopup();
                        return;
                    }
                }

                requestAnimationFrame(tick);
            }
        }

        // remove listeners on unmount
        return () => {
            eventTarget.removeEventListener(QRCodeScanOpenEvent.eventId, qrScanOpenHandler);
            eventTarget.removeEventListener(CloseOpenPopupEvent.eventId, closeOpenPopupHandler);

            document.removeEventListener("keydown", keydown, true);
            // stop video streams so we no longer use the camera
            videoStream?.getTracks().forEach((track) => {
                track.stop();
            });
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
                    className="popup-bg"
                    id="qr-scan-bg"
                    onClick={(e) => {
                        if ((e.target as HTMLElement).id == "qr-scan-bg") dismissPopup();
                    }}
                >
                    <div className="qr-scan-body">
                        {streaming ? (
                            <canvas id="qr-camera" ref={cameraPreviewCanvas}></canvas>
                        ) : (
                            <p>Allow camera access to scan the QR code.</p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
