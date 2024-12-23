import "./Dropdown.css";

export default function Dropdown(props: { open: boolean; children?: any }) {
    return <div className={(props.open ? "open" : "closed") + " dropdown"}>{props.children}</div>;
}
