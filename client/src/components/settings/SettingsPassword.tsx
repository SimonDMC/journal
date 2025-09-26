import { useState } from "react";
import { InfoIcon } from "../icons/InfoIcon";
import "./Settings.css";

export default function SettingsPassword(props: {
    label: string;
    desc?: string;
    mainPlaceholder: string;
    confirmPlaceholder: string;
    actionLabel: string;
    action: (password: string) => void;
    actionFail: () => void;
}) {
    const [mainInput, setMainInput] = useState("");
    const [confirmInput, setConfirmInput] = useState("");

    function applyAction() {
        if (mainInput == confirmInput && mainInput !== "") {
            props.action(mainInput);
            setMainInput("");
            setConfirmInput("");
        } else props.actionFail();
    }

    return (
        <div className="settings-row settings-password-row">
            <div className="left">
                {props.label}
                {props.desc && (
                    <InfoIcon className="info-icon">
                        <div className="settings-tooltip">{props.desc}</div>
                    </InfoIcon>
                )}
            </div>
            <div className="right">
                <input
                    type="password"
                    placeholder={props.mainPlaceholder}
                    className="settings-password"
                    value={mainInput}
                    onChange={(e) => setMainInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key == "Enter") ((e.target as HTMLElement).nextSibling as HTMLElement).focus();
                    }}
                />
                <input
                    type="password"
                    placeholder={props.confirmPlaceholder}
                    className="settings-password"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key == "Enter") applyAction();
                    }}
                />
                <button className="settings-button" onClick={applyAction}>
                    {props.actionLabel}
                </button>
            </div>
        </div>
    );
}
