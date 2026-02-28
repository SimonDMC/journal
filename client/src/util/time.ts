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

// converts a date created from (year, month, day) constructor to a (`year-month-day`) one
export function adjustTime(date: Date) {
    return new Date(date.getTime() - new Date(date.getTime()).getTimezoneOffset() * 60 * 1000);
}

// get days of month of year
export function getDaysOfMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

// returns the index of the week in the current month, visualized as the row in the calendar
function getWeekIndex(date: Date) {
    // zero-indexed, since we'll consider day 7 from the first monday as the next monday
    let dayOfWeekOfFirstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
    // correct for sunday being 0; if i ever wanna add an option to make weeks start with sunday all
    // it would take is removing this check and removing the -1 above
    if (dayOfWeekOfFirstOfMonth == -1) dayOfWeekOfFirstOfMonth = 6;
    const daysSinceMondayWeekOne = dayOfWeekOfFirstOfMonth + (date.getUTCDate() - 1);
    const weeksElapsed = Math.floor(daysSinceMondayWeekOne / 7);

    return weeksElapsed;
}

// get nth day of nth week of a specific month -- if that comes out to below 1 or over the amount
// of days in that month, clamp
function getDayNOfWeekN(year: number, month: number, week: number, day: number) {
    let dayOfWeekOfFirstOfMonth = new Date(year, month, 1).getDay() - 1;
    if (dayOfWeekOfFirstOfMonth == -1) dayOfWeekOfFirstOfMonth = 6;
    // the +1 is there because we start on day of the month 1, not day 0
    const desiredDayOfMonth = 1 + day - dayOfWeekOfFirstOfMonth + week * 7;

    if (desiredDayOfMonth < 1) return adjustTime(new Date(year, month, 1));
    const daysInThisMonth = getDaysOfMonth(year, month);
    if (desiredDayOfMonth > daysInThisMonth) return adjustTime(new Date(year, month + 1, 0));
    return adjustTime(new Date(year, month, desiredDayOfMonth));
}

export function moveLeft(dateString: string) {
    const date = new Date(dateString);

    // if we're on a monday, or on the first of the month, move to sunday of the same week of the previous month
    if (date.getUTCDay() == 1 || date.getUTCDate() == 1) {
        const weekIndex = getWeekIndex(date);
        return getDayNOfWeekN(date.getUTCFullYear(), date.getUTCMonth() - 1, weekIndex, 6);
    } else {
        return new Date(date.getTime() - 24 * 60 * 60 * 1000);
    }
}

export function moveRight(dateString: string) {
    const date = new Date(dateString);

    const daysInThisMonth = getDaysOfMonth(date.getFullYear(), date.getMonth());
    // if we're on a sunday, or on the last of the month, move to monday of the same week of the next month
    if (date.getUTCDay() == 0 || date.getUTCDate() == daysInThisMonth) {
        const weekIndex = getWeekIndex(date);
        return getDayNOfWeekN(date.getUTCFullYear(), date.getUTCMonth() + 1, weekIndex, 0);
    } else {
        return new Date(date.getTime() + 24 * 60 * 60 * 1000);
    }
}

export function getMonthOffset(from: string, to: string) {
    const yearFrom = parseInt(from.substring(0, 4));
    const yearTo = parseInt(to.substring(0, 4));
    const monthFrom = parseInt(from.substring(5, 7));
    const monthTo = parseInt(to.substring(5, 7));

    return monthTo - monthFrom + (yearTo - yearFrom) * 12;
}
