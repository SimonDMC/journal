import { useEffect, useState } from "react";
import "./UpdatePopup.css";
import { updateDownload } from "../../util/update";

export default function UpdatePopup() {
    const [open, setOpen] = useState(false);
    const [oldVersion, setOldVersion] = useState("");
    const [newVersion, setNewVersion] = useState("");
    const [changelog, setChangelog] = useState([""]);

    useEffect(() => {
        const handler = (e: Event) => {
            const { version, changelogs } = (e as CustomEvent).detail;
            setOpen(true);
            setOldVersion(localStorage.getItem("journal-version") ?? "0.0.0");
            setNewVersion(version);
            setChangelog(changelogs);
        };
        updateDownload.addEventListener("done", handler);

        return () => {
            updateDownload.removeEventListener("done", handler);
        };
    }, []);

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
                <ul>
                    {changelog.map((line, i) => (
                        <li key={i}>{line}</li>
                    ))}
                </ul>
                <div className="progress-txt"></div>
                <div className="progress-bar"></div>
                <button className="yes" onClick={applyUpdate}>
                    Apply
                </button>
            </div>
        </div>
    );
}
