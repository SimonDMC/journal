import { useSettings } from "../../state/settings";
import { InfoIcon } from "../icons/InfoIcon";
import "./Settings.css";

export default function SettingsSelect(props: { label: string; settingKey: string; desc?: string; options: { [value: string]: string } }) {
    const value = useSettings((s) => s.getString(props.settingKey));

    return (
        <div className="settings-row">
            <div className="left">
                {props.label}
                {props.desc && (
                    <InfoIcon className="info-icon">
                        <div className="settings-tooltip">{props.desc}</div>
                    </InfoIcon>
                )}
            </div>
            <div className="right">
                <select
                    className="settings-select"
                    value={value}
                    onChange={(e) => {
                        useSettings.getState().setSetting(props.settingKey, e.target.value);
                    }}
                >
                    {Object.keys(props.options).map((selectValue) => {
                        return (
                            <option key={selectValue} value={selectValue}>
                                {props.options[selectValue]}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>
    );
}
