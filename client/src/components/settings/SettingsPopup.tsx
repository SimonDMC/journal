import { eventTarget, SettingsOpenEvent } from "../../util/events";
import "./Settings.css";
import { useEffect, useState } from "react";
import SettingsTab from "./SettingsTab";
import SettingsToggle from "./SettingsToggle";
import { AnimatePresence, motion } from "framer-motion";

export default function SettingsPopup() {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState("general");

    useEffect(() => {
        const settingsOpenHandler = () => {
            setOpen(true);
        };
        eventTarget.addEventListener(SettingsOpenEvent.eventId, settingsOpenHandler);

        // remove listeners on unmount
        return () => {
            eventTarget.removeEventListener(SettingsOpenEvent.eventId, settingsOpenHandler);
        };
    }, [open]);

    function closePopup(event: React.MouseEvent) {
        if (event.target !== event.currentTarget) return;
        setOpen(false);
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="settings-bg"
                    onClick={closePopup}
                >
                    <div className="settings-body">
                        <div className="settings-tabs">
                            <SettingsTab id="general" label="General" setSelected={setSelected} selected={selected} />
                            <SettingsTab id="security" label="Security" setSelected={setSelected} selected={selected} />
                            <SettingsTab id="debug" label="Debug" setSelected={setSelected} selected={selected} />
                        </div>
                        {selected == "general" && (
                            <div className="settings-content">
                                <SettingsToggle
                                    label="Show Mood"
                                    settingKey="general.show_mood"
                                    default={true}
                                    desc="Show the mood dropdown while writing entries"
                                />
                                <SettingsToggle
                                    label="Show Stats"
                                    settingKey="general.show_stats"
                                    default={true}
                                    desc="Show the entry count and total word count stats on the overview page"
                                />
                                <SettingsToggle
                                    label="Show One Year Ago"
                                    settingKey="general.show_one_year_ago"
                                    default={true}
                                    desc="Show the One Year Ago button below the calendar"
                                />
                            </div>
                        )}
                        {selected == "security" && (
                            <div className="settings-content">
                                <div>Yo!</div>
                            </div>
                        )}
                        {selected == "debug" && (
                            <div className="settings-content">
                                <div>Yo!!</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
