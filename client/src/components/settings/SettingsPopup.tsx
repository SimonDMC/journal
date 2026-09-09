import "./Settings.css";
import { useState } from "react";
import SettingsTab from "./ui/SettingsTab";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../state/settings";
import SettingsGeneralTab from "./tabs/SettingsGeneralTab";
import SettingsSecurityTab from "./tabs/SettingsSecurityTab";
import SettingsDebugTab from "./tabs/SettingsDebugTab";

export default function SettingsPopup() {
    const [selected, setSelected] = useState("general");
    const settingsState = useSettings();

    function closePopup(event: React.MouseEvent) {
        if (event.target !== event.currentTarget) return;
        useSettings.getState().closeSettings();
    }

    return (
        <AnimatePresence>
            {settingsState.settingsOpen && (
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
                            <SettingsTab
                                id="general"
                                label="General"
                                setSelected={setSelected}
                                selected={selected}
                            />
                            <SettingsTab
                                id="security"
                                label="Security"
                                setSelected={setSelected}
                                selected={selected}
                            />
                            <SettingsTab
                                id="debug"
                                label="Debug"
                                setSelected={setSelected}
                                selected={selected}
                            />
                        </div>
                        {selected == "general" && <SettingsGeneralTab />}
                        {selected == "security" && <SettingsSecurityTab />}
                        {selected == "debug" && <SettingsDebugTab />}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
