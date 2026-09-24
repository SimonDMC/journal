import clsx from "clsx";
import { InfoIcon } from "../../components/icons/InfoIcon";
import "../Settings.css";

export default function SettingsButton(props: {
    label: string;
    desc?: string;
    actionLabel: string;
    danger?: boolean;
    action: () => void;
}) {
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
                <button
                    className={clsx("settings-button", props.danger && "danger")}
                    onClick={props.action}
                >
                    {props.actionLabel}
                </button>
            </div>
        </div>
    );
}
