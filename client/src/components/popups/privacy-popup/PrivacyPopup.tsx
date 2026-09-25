import { CloseOpenPopupEvent, eventTarget, OpenPrivacyPopupEvent } from "../../../util/events";
import "./PrivacyPopup.css";
import "../Popups.css";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../../settings/util/state";

export default function PrivacyPopup() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // open whenever view privacy policy is pressed
        const privacyOpenHandler = () => {
            setOpen(true);
        };
        eventTarget.addEventListener(OpenPrivacyPopupEvent.eventId, privacyOpenHandler);

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
            eventTarget.removeEventListener(OpenPrivacyPopupEvent.eventId, privacyOpenHandler);
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
                    className="popup-bg"
                    id="privacy-bg"
                    onClick={(e) => {
                        if ((e.target as HTMLElement).id == "privacy-bg") dismissPopup();
                    }}
                >
                    <div className="privacy-body">
                        <h1>Journal Privacy Policy</h1>
                        <p className="center">Last revision: September 24, 2026.</p>
                        <h2>I. What is collected</h2>
                        <p>
                            If you use Journal without an account, no data is ever sent to a server.
                            Everything you write and configure stays purely in your browser.
                        </p>
                        <p>
                            Should you choose to create and use an account, identifying data about
                            the account, and metadata about the entries are stored on Journal's
                            servers, hosted and processed by Cloudflare. This includes: account
                            username, account email, account creation date, an encrypted account
                            password, a cryptographic hash of your encryption key, and dates of
                            written entries.
                        </p>
                        <p>
                            While using an account, entries are sent to and from and synced with
                            Journal's servers. This process is <b>end-to-end encrypted</b>, meaning
                            the content of your entries or any extra filled-in information (e.g.
                            mood), cannot be read by anyone who has access to the server and the
                            database.
                        </p>
                        <p>
                            Specific IP addresses may be stored on Cloudflare's servers for a period
                            of 60 seconds for the purpose of rate-limiting the account creation
                            endpoint. Any identifying metadata or browser fingerprints aren't being
                            collected. Cloudflare processes all requests and creates aggregated
                            anonymized reports, but none of them are linked to you.
                        </p>
                        <p>
                            Journal is <a href="https://github.com/SimonDMC/journal">open source</a>
                            , so you can audit exactly what is stored and how.
                        </p>
                        <h2>II. Your rights</h2>
                        <p>
                            If you want to delete everything stored about you on Journal's servers,
                            you may use the Delete Account feature under Settings &gt; Account &gt;
                            Delete Account. This process automatically deletes your account and all
                            entries associated with it.
                        </p>
                        <p>
                            In case you lost access to an account which belongs to you, and wish to
                            delete your account, send an email to compliance@simondmc.com with
                            sufficient proof that you are the account owner. Sending an email from
                            the address associated with that account is an example of sufficient
                            proof.
                        </p>
                        <p>
                            You can download a copy of your entries by using the Export Entries
                            feature under Settings &gt; General &gt; Export Entries. If that is
                            insufficient, send an email to compliance@simondmc.com with a formal
                            request to receive a copy of your data.
                        </p>
                        <p>
                            For any other concerns relating to data processing and storage not
                            listed above, send an email to compliance@simondmc.com.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
