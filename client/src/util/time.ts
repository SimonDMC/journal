export const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

// calculate today's date by offsetting the current date by the timezone offset
export const adjustedTimestamp = Date.now() - new Date().getTimezoneOffset() * 60 * 1000;
// additionally count "today" until 4am the next day
export const dayAdjustedTime = new Date(adjustedTimestamp - 4 * 60 * 60 * 1000);
export const today = dayAdjustedTime.toISOString().substring(0, 10);

// format date as Dayofweek, Month Day, Year
export function formatDate(dateString: string) {
    const parts = dateString.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);

    return formattedDate;
}

export function formatTimestampShort(timestamp: number) {
    return new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
