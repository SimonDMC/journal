import "./Dropdown.css";

export default function DropdownItem(props: { label: string; description?: string; onClick: () => void }) {
    return (
        <div className="dropdown-item" title={props.description} onClick={() => props.onClick()}>
            {props.label}
        </div>
    );
}
