import { useState } from "react";
import { getSetting, setSetting } from "../../settings/system";
import { InfoIcon } from "../icons/InfoIcon";
import "./Settings.css";

export default function SettingsToggle(props: { label: string; settingKey: string; default: boolean; desc: string }) {
    const [value, setValue] = useState(getSetting(props.settingKey) ?? props.default);

    return (
        <label className="settings-row">
            <div className="left">
                {props.label}
                <InfoIcon className="info-icon" />
            </div>
            <div className="right">
                <div className="toggle-wrap">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => {
                            setValue(e.target.checked);
                            setSetting(props.settingKey, e.target.checked);
                        }}
                    />
                    <div className="circle"></div>
                </div>
            </div>
        </label>
    );
}
