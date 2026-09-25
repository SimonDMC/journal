export default function SettingsStatus(props: { text: string; success: boolean }) {
    return (
        <div className="settings-row">
            <div />
            <div className="settings-text small">
                {props.text}{" "}
                {props.success ? (
                    <span className="check">✓</span>
                ) : (
                    <span className="cross">&times;</span>
                )}
            </div>
        </div>
    );
}
