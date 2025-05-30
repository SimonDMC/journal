import "./EditorBubble.css";
import Select, { type SelectInstance } from "react-select";
import { type MutableRefObject, useState } from "react";
import { moods, locations } from "../../util/parameters";

interface Option {
    readonly value: number;
}

export default function EditorBubble(props: {
    saveEntry: () => Promise<void>;
    saveLocally: () => Promise<void>;
    mood: MutableRefObject<number | null>;
    location: MutableRefObject<number | null>;
    year: string;
    ref: MutableRefObject<SelectInstance | null>;
}) {
    const [, setForceRender] = useState(false);

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

    return (
        <div className="bubble">
            <p id="word-count">Word Count: 0</p>
            <div className="selections">
                <Select
                    instanceId="mood"
                    options={moods}
                    placeholder="Mood"
                    value={moods.find((mood) => mood.value === props.mood.current)}
                    menuPlacement="top"
                    isSearchable={false}
                    onChange={(option: unknown) => {
                        if (option) props.mood.current = (option as Option).value;
                        props.saveLocally();
                        // this is ugly but i have to use useRef because useState didn't pass it to parent properly
                        setForceRender((prev) => !prev);
                    }}
                    classNames={selectStyles}
                    ref={props.ref}
                    openMenuOnFocus={true}
                />
                {
                    /* only show location if in 2024 */
                    props.year === "2024" && (
                        <Select
                            instanceId="location"
                            options={locations}
                            placeholder="Location"
                            value={locations.find((location) => location.value === props.location.current)}
                            menuPlacement="top"
                            isSearchable={false}
                            onChange={(option) => {
                                if (option) props.location.current = option.value;
                                props.saveLocally();
                                setForceRender((prev) => !prev);
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
