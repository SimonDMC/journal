import type { ComponentProps } from "react";
import "../Settings.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export default function SettingsWarn({ children, ...props }: ComponentProps<"div">) {
    return (
        <div className="settings-warn" {...props}>
            <div className="left">
                <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <div className="right">{children}</div>
        </div>
    );
}
