import { eventTarget, UpdateReadyEvent } from "../../util/events";
import "./UpdatePopup.css";
import { useEffect, useState } from "react";

export default function UpdatePopup() {
    const [open, setOpen] = useState(false);
    const [oldVersion, setOldVersion] = useState("");
    const [newVersion, setNewVersion] = useState("");
    const [changelog, setChangelog] = useState([""]);

    useEffect(() => {
        // initialize popup data and open whenever update is available
        const updateReadyHandler = (e: Event) => {
            const { version, changelogs } = (e as UpdateReadyEvent).detail;
            setOpen(true);
            setOldVersion(localStorage.getItem("journal-version") ?? "0.0.0");
            setNewVersion(version);
            setChangelog(changelogs);
        };
        eventTarget.addEventListener(UpdateReadyEvent.eventId, updateReadyHandler);

        const keydown = async (event: KeyboardEvent) => {
            event.stopImmediatePropagation();
            // apply update using enter
            if (event.key === "Enter" && open) {
                applyUpdate();
            }
        };

        if (open) document.addEventListener("keydown", keydown, true);

        // remove listeners on unmount
        return () => {
            eventTarget.removeEventListener(UpdateReadyEvent.eventId, updateReadyHandler);
            document.removeEventListener("keydown", keydown);
        };
    }, [open]);

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

    if (!open) return null;

    return (
        <div className="up-bg">
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
                <button className="yes" onClick={applyUpdate}>
                    Apply
                </button>
            </div>
        </div>
    );
}
