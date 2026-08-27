import "./EditorBubble.css";
import Select, { type SelectInstance } from "react-select";
import { useEffect, useState, type RefObject } from "react";
import { moods } from "../../util/extras";
import { today } from "../../util/time";
import { useSettings } from "../../state/settings";

interface Option {
    readonly value: number;
}

export default function EditorBubble(props: {
    saveEntry: () => Promise<void>;
    saveLocally: () => Promise<void>;
    mood: number | null;
    setMood: React.Dispatch<React.SetStateAction<number | null>>;
    date: string;
    ref: RefObject<SelectInstance | null>;
    wordCount: number;
}) {
    const selectStyles = {
        container: () => "select-container",
        control: () => "select-control",
        valueContainer: () => "select-value-container",
        indicatorSeparator: () => "select-indicator-separator",
        indicatorsContainer: () => "select-indicators-container",
        menu: () => "select-menu",
        menuList: () => "select-menu-list",
        option: ({ isSelected }: { isSelected: boolean }) =>
            isSelected ? "select-option selected" : "select-option",
    };

    const [shouldSave, setShouldSave] = useState(false);
    const showMood = useSettings((s) => s.getBoolean("general.show_mood"));
    const { saveLocally } = props;

    // autosave whenever mood is updated (if it's today)
    useEffect(() => {
        if (shouldSave) {
            console.log("SAVING");

            saveLocally();
            setShouldSave(false);
        }
    }, [props.mood, shouldSave, saveLocally]);

    return (
        <div className="bubble">
            <p id="word-count">Word Count: {props.wordCount}</p>
            <div className="selections">
                {showMood && (
                    <Select
                        instanceId="mood"
                        options={moods}
                        placeholder="Mood"
                        value={moods.find((mood) => mood.value === props.mood)}
                        menuPlacement="top"
                        isSearchable={false}
                        onChange={(option) => {
                            if (option) props.setMood((option as Option).value);
                            if (props.date == today) setShouldSave(true);
                        }}
                        classNames={selectStyles}
                        ref={props.ref}
                        openMenuOnFocus={true}
                    />
                )}
            </div>
            <button type="button" onClick={() => props.saveEntry()} id="save-button">
                Save
            </button>
        </div>
    );
}
