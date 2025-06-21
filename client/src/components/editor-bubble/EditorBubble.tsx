import "./EditorBubble.css";
import Select, { type SelectInstance } from "react-select";
import { useEffect, useState, type MutableRefObject } from "react";
import { moods, locations } from "../../util/parameters";
import { today } from "../../util/time";

interface Option {
    readonly value: number;
}

export default function EditorBubble(props: {
    saveEntry: () => Promise<void>;
    saveLocally: () => Promise<void>;
    mood: number | null;
    setMood: React.Dispatch<React.SetStateAction<number | null>>;
    location: number | null;
    setLocation: React.Dispatch<React.SetStateAction<number | null>>;
    date: string;
    ref: MutableRefObject<SelectInstance | null>;
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
        option: ({ isSelected }: { isSelected: boolean }) => (isSelected ? "select-option selected" : "select-option"),
    };

    const [shouldSave, setShouldSave] = useState(false);
    const { saveLocally } = props;

    // autosave whenever mood or location is updated (if it's today)
    useEffect(() => {
        if (shouldSave) {
            saveLocally();
            setShouldSave(false);
        }
    }, [props.mood, props.location, shouldSave, saveLocally]);

    return (
        <div className="bubble">
            <p id="word-count">Word Count: {props.wordCount}</p>
            <div className="selections">
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
                {
                    /* only show location if in 2024 */
                    props.date.substring(0, 4) === "2024" && (
                        <Select
                            instanceId="location"
                            options={locations}
                            placeholder="Location"
                            value={locations.find((location) => location.value === props.location)}
                            menuPlacement="top"
                            isSearchable={false}
                            onChange={(option) => {
                                if (option) props.setLocation(option.value);
                                if (props.date == today) setShouldSave(true);
                            }}
                            classNames={selectStyles}
                        />
                    )
                }
            </div>
            <button type="button" onClick={() => props.saveEntry()} id="save-button">
                Save
            </button>
        </div>
    );
}
