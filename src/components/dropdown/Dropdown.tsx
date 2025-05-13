import "./Dropdown.css";

export default function Dropdown(props: { open: boolean; children?: React.ReactNode }) {
    return <div className={(props.open ? "open" : "closed") + " dropdown"}>{props.children}</div>;
}
