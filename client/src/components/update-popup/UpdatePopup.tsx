import { eventTarget, UpdateReadyEvent } from "../../util/events";
import { getCurrentVersion } from "../../util/update";
import "./UpdatePopup.css";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function UpdatePopup() {
    const [open, setOpen] = useState(false);
    const [oldVersion, setOldVersion] = useState("");
    const [newVersion, setNewVersion] = useState("");
    const [changelog, setChangelog] = useState([""]);

    useEffect(() => {
        // initialize popup data and open whenever update is available
        const updateReadyHandler = (e: Event) => {
            const { version, changelogs, updateMode } = (e as UpdateReadyEvent).detail;

            setOldVersion(getCurrentVersion() ?? "0.0.0");
            setNewVersion(version);
            setChangelog(changelogs);

            if (["silent", "automatic"].includes(updateMode)) {
                // update automatically, and set flag for info toast after reload
                if (updateMode === "automatic") {
                    sessionStorage.setItem("journal-updated-automatically", "true");
                }
                applyUpdate();
                return;
            }

            setOpen(true);
        };
        eventTarget.addEventListener(UpdateReadyEvent.eventId, updateReadyHandler);

        const keydown = async (event: KeyboardEvent) => {
            console.log(open);

            if (!open) return;

            event.stopImmediatePropagation();
            // apply update using enter
            if (event.key === "Enter") {
                applyUpdate();
            }
            // dismiss update using esc
            if (event.key === "Escape") {
                dismissUpdate();
            }
        };

        if (open) {
            document.addEventListener("keydown", keydown, true);
        }

        // remove listeners on unmount
        return () => {
            eventTarget.removeEventListener(UpdateReadyEvent.eventId, updateReadyHandler);
            document.removeEventListener("keydown", keydown, true);
        };
    }, [open]);

    async function dismissUpdate() {
        setOpen(false);
        sessionStorage.setItem("journal-update-undesired", "true");
    }

    async function applyUpdate() {
        // mark as unsynced, so that migrations immediately trigger
        sessionStorage.removeItem("journal-synced");
        localStorage.setItem("journal-version", newVersion);
        // wipe old cache
        const caches = await window.caches.keys();
        for (const cache of caches) {
            if (cache != `journal-cache-${newVersion}`) window.caches.delete(cache);
        }
        window.location.reload();
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    id="up-bg"
                >
                    <div className="up-body">
                        <h1>New update!</h1>
                        <div className="version">
                            <span className="monospace">v{oldVersion}</span>
                            -&gt;
                            <span className="monospace">v{newVersion}</span>
                        </div>
                        <span className="changelog">Changelog:</span>
                        <div className="changelog-wrap">
                            <ul>
                                {changelog.map((line, i) => (
                                    <li key={i}>{line}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="progress-txt"></div>
                        <div className="progress-bar"></div>
                        <div className="button-row">
                            <button onClick={dismissUpdate}>Dismiss</button>
                            <button onClick={applyUpdate}>Apply</button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
