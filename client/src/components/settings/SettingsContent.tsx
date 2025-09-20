import "./Settings.css";

export default function SettingsContent(props: { children?: React.ReactNode }) {
    function setScrollProperty(e: React.UIEvent) {
        // mark how scrolled the container is into a style property for tooltips to use for positioning
        const target = e.target as HTMLElement;
        target.style.setProperty("--scroll", `${target.scrollTop}px`);
    }

    return (
        <div className="settings-content" onScroll={setScrollProperty}>
            {props.children}
        </div>
    );
}
