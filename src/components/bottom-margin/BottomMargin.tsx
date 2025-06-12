import "./BottomMargin.css";

export default function BottomMargin(props: { visible: boolean }) {
    return <div className={`bottom-margin ${props.visible ? "visible" : ""}`}></div>;
}
