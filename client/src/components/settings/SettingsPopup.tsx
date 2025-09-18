import "./Settings.css";
import { useState } from "react";
import SettingsTab from "./SettingsTab";
import SettingsToggle from "./SettingsToggle";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../state/settings";

export default function SettingsPopup() {
    const [selected, setSelected] = useState("general");
    const settingsOpen = useSettings((s) => s.settingsOpen);

    function closePopup(event: React.MouseEvent) {
        if (event.target !== event.currentTarget) return;
        useSettings.getState().closeSettings();
    }

    return (
        <AnimatePresence>
            {settingsOpen && (
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
                                    desc="Show mood selection while writing entries"
                                />
                                <SettingsToggle
                                    label="Show Stats"
                                    settingKey="general.show_stats"
                                    desc="Show entry count and total word count stats on the overview page"
                                />
                                <SettingsToggle
                                    label="Show One Year Ago"
                                    settingKey="general.show_one_year_ago"
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
