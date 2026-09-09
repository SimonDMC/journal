import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ComponentProps } from "react";

type Props = { icon: IconProp; title: string; desc: string } & ComponentProps<"div">;

export default function SettingsCard({ icon, title, desc, ...props }: Props) {
    return (
        <div className="settings-card" {...props}>
            <div className="settings-card-icon">
                <FontAwesomeIcon icon={icon} />
            </div>
            <div className="settings-card-title">{title}</div>
            <div className="settings-card-desc">{desc}</div>
        </div>
    );
}
