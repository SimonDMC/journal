import { useState } from "react";
import { InfoIcon } from "../icons/InfoIcon";
import "./Settings.css";

export default function SettingsInput(props: {
    label: string;
    desc?: string;
    placeholder: string;
    actionLabel: string;
    action: (input: string) => void;
}) {
    const [mainInput, setMainInput] = useState("");

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
                    placeholder={props.placeholder}
                    className="settings-input"
                    value={mainInput}
                    onChange={(e) => setMainInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key == "Enter")
                            ((e.target as HTMLElement).nextSibling as HTMLElement).focus();
                    }}
                />
                <button className="settings-button" onClick={() => props.action(mainInput)}>
                    {props.actionLabel}
                </button>
            </div>
        </div>
    );
}
