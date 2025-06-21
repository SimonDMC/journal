import "./BottomMargin.css";

export default function BottomMargin(props: { visible: boolean }) {
    return props.visible ? <div className={"bottom-margin"}></div> : null;
}
