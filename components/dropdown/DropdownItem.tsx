import "./Dropdown.css";

export default function Dropdown(props: { label: string; onClick: Function }) {
    return (
        <div className="dropdown-item" onClick={() => props.onClick()}>
            {props.label}
        </div>
    );
}
