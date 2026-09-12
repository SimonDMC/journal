import { exportEntries } from "../util/entries";
import { checkForUpdateManually } from "../../util/update";
import SettingsButton from "../ui/SettingsButton";
import SettingsContent from "../ui/SettingsContent";
import SettingsSelect from "../ui/SettingsSelect";
import SettingsSeparator from "../ui/SettingsSeparator";
import SettingsToggle from "../ui/SettingsToggle";

export default function SettingsGeneralTab() {
    return (
        <SettingsContent>
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
            <SettingsSeparator />
            <SettingsButton
                label="Export Entries"
                desc="Download a copy of all your entries"
                actionLabel="Export"
                action={exportEntries}
            />
            <SettingsSeparator />
            <SettingsSelect
                label="Update Policy"
                settingKey="general.update_policy"
                desc="Choose whether Journal should check for updates, and whether they should install automatically or only upon confirmation."
                options={{
                    silent: "Silent",
                    automatic: "Automatic",
                    confirm: "Confirm",
                    manual: "Manual",
                }}
            />
            <SettingsButton
                label="Check for Updates"
                actionLabel="Check"
                action={checkForUpdateManually}
            />
            <SettingsToggle
                label="Suppress All Errors"
                settingKey="general.suppress_toasts"
                desc="Prevent error and warning toasts from appearing. Useful if you're intentionally running an outdated version and getting spammed with API errors."
            />
            <SettingsSeparator />
            <SettingsToggle label="Show Debug Tab" settingKey="general.show_debug" />
        </SettingsContent>
    );
}
