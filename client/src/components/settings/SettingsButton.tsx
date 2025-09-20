import { InfoIcon } from "../icons/InfoIcon";
import "./Settings.css";

export default function SettingsButton(props: { label: string; desc?: string; actionLabel: string; action: () => void }) {
    return (
        <label className="settings-row">
            <div className="left">
                {props.label}
                {props.desc && (
                    <InfoIcon className="info-icon">
                        <div className="settings-tooltip">{props.desc}</div>
                    </InfoIcon>
                )}
            </div>
            <div className="right">
                <button className="settings-button" onClick={props.action}>
                    {props.actionLabel}
                </button>
            </div>
        </label>
    );
}
