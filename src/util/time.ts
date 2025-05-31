// calculate today's date by offsetting the current date by the timezone offset
export const adjustedTimestamp = Date.now() - new Date().getTimezoneOffset() * 60 * 1000;
// additionally count "today" until 4am the next day
export const dayAdjustedTime = new Date(adjustedTimestamp - 4 * 60 * 60 * 1000);
export const today = dayAdjustedTime.toISOString().substring(0, 10);

// format date as Dayofweek, Month Day, Year
export function formatDate(dateString: string) {
    const parts = dateString.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    const options = {
        weekday: "long" as "long" | undefined,
        year: "numeric" as "numeric" | undefined,
        month: "long" as "long" | undefined,
        day: "numeric" as "numeric" | undefined,
    };
    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date);

    return formattedDate;
}
