import { useEffect, useState } from "react";
import "./UpdatePopup.css";
import { updateDownload } from "../../util/update";

export let updatePopupOpen = false;

export default function UpdatePopup() {
    const [open, setOpen] = useState(false);
    const [oldVersion, setOldVersion] = useState("");
    const [newVersion, setNewVersion] = useState("");
    const [changelog, setChangelog] = useState([""]);

    useEffect(() => {
        // expose open state, so that Enter keypress gets disabled elsewhere
        updatePopupOpen = open;

        // initialize popup data and open whenever update is available
        const handler = (e: Event) => {
            const { version, changelogs } = (e as CustomEvent).detail;
            setOpen(true);
            setOldVersion(localStorage.getItem("journal-version") ?? "0.0.0");
            setNewVersion(version);
            setChangelog(changelogs);
        };
        updateDownload.addEventListener("done", handler);

        const keydown = async (event: KeyboardEvent) => {
            // apply update using enter
            if (event.key === "Enter" && open) {
                applyUpdate();
            }
        };
        document.addEventListener("keydown", keydown);

        // remove listeners on unmount
        return () => {
            updateDownload.removeEventListener("done", handler);
            document.removeEventListener("keydown", keydown);
        };
    }, [open]);

    async function applyUpdate() {
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
                    <span className="monospace">{oldVersion}</span>
                    -&gt;
                    <span className="monospace">{newVersion}</span>
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
