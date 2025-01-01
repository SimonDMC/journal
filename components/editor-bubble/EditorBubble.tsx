import Select from "react-select";
import "./EditorBubble.css";
import { MutableRefObject, useState } from "react";

export default function EditorBubble(props: {
    saveEntry: Function;
    mood: MutableRefObject<Number>;
    location: MutableRefObject<Number>;
    year: string;
}) {
    const [, setForceRender] = useState(false);

    const moods = [
        { value: 1, label: "1 - Worst day ever" },
        { value: 2, label: "2 - Awful" },
        { value: 3, label: "3 - Bad" },
        { value: 4, label: "4 - Average" },
        { value: 5, label: "5 - Good" },
        { value: 6, label: "6 - Great" },
        { value: 7, label: "7 - Best day ever" },
    ];

    const locations = [
        { value: 1, label: "Mom's" },
        { value: 2, label: "Dad's" },
        { value: 3, label: "Cottage" },
        { value: 4, label: "Not home!" },
    ];

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
                    options={moods}
                    placeholder="Mood"
                    value={moods.find((mood) => mood.value === props.mood.current)}
                    menuPlacement="top"
                    isSearchable={false}
                    onChange={(option) => {
                        if (option) props.mood.current = option.value;
                        // this is ugly but i have to use useRef because useState didn't pass it to parent properly
                        setForceRender((prev) => !prev);
                    }}
                    classNames={selectStyles}
                />
                {
                    /* only show location if in 2024 */
                    props.year === "2024" && (
                        <Select
                            options={locations}
                            placeholder="Location"
                            value={locations.find((location) => location.value === props.location.current)}
                            menuPlacement="top"
                            isSearchable={false}
                            onChange={(option) => {
                                if (option) props.location.current = option.value;
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
