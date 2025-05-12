// calculate today's date by offsetting the current date by the timezone offset
export const adjustedTimestamp = Date.now() - new Date().getTimezoneOffset() * 60 * 1000;
// additionally count "today" until 4am the next day
export const dayAdjustedTime = new Date(adjustedTimestamp - 4 * 60 * 60 * 1000);
export const today = dayAdjustedTime.toISOString().substring(0, 10);
