import { useSettings } from "../../state/settings";
import { InfoIcon } from "../icons/InfoIcon";
import "./Settings.css";

export default function SettingsToggle(props: { label: string; settingKey: string; desc?: string }) {
    const value = useSettings((s) => s.getBoolean(props.settingKey));

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
                <div className="toggle-wrap">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => {
                            useSettings.getState().setSetting(props.settingKey, e.target.checked);
                        }}
                    />
                    <div className="circle"></div>
                </div>
            </div>
        </label>
    );
}
