import "./Settings.css";

export default function SettingsTab(props: { id: string; label: string; setSelected: (id: string) => void; selected: string }) {
    return (
        <div className={`settings-tab ${props.selected == props.id ? "selected" : ""}`} onClick={() => props.setSelected(props.id)}>
            {props.label}
        </div>
    );
}
