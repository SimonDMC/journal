import { getUserName } from "../util/profile";

function getSettings() {
    return JSON.parse(localStorage.getItem(`journal-options-${getUserName()}`) ?? "{}");
}

export function getSetting(key: string) {
    return getSettings()[key];
}

export function setSetting(key: string, value: unknown) {
    console.log(`setting ${key} to ${value}`);

    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem(`journal-options-${getUserName()}`, JSON.stringify(settings));
}
