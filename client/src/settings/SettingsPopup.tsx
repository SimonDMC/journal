import "./Settings.css";
import { useEffect, useState } from "react";
import SettingsTab from "./ui/SettingsTab";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "./util/state";
import SettingsGeneralTab from "./tabs/SettingsGeneralTab";
import SettingsSecurityTab from "./tabs/SettingsSecurityTab";
import SettingsDebugTab from "./tabs/SettingsDebugTab";
import SettingsAccountTab from "./tabs/SettingsAccountTab";
import { eventTarget, CloseOpenPopupEvent } from "../util/events";

export default function SettingsPopup() {
    const [selected, setSelected] = useState("general");
    const settingsState = useSettings();

    useEffect(() => {
        const closeOpenPopupHandler = () => useSettings.getState().closeSettings();
        eventTarget.addEventListener(CloseOpenPopupEvent.eventId, closeOpenPopupHandler);

        // remove event listener on unmount
        return () =>
            eventTarget.removeEventListener(CloseOpenPopupEvent.eventId, closeOpenPopupHandler);
    });

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
                                id="account"
                                label="Account"
                                setSelected={setSelected}
                                selected={selected}
                            />
                            <SettingsTab
                                id="security"
                                label="Security"
                                setSelected={setSelected}
                                selected={selected}
                            />
                            {settingsState.getBoolean("general.show_debug") && (
                                <SettingsTab
                                    id="debug"
                                    label="Debug"
                                    setSelected={setSelected}
                                    selected={selected}
                                />
                            )}
                        </div>
                        {selected == "general" && <SettingsGeneralTab />}
                        {selected == "account" && <SettingsAccountTab />}
                        {selected == "security" && <SettingsSecurityTab />}
                        {selected == "debug" && <SettingsDebugTab />}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
