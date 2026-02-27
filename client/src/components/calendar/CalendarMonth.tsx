import { dayAdjustedTime, today } from "../../util/time";
import { Link } from "@tanstack/react-router";

// monthIndex represents the month offset from today. e.g. if it's 2026-02, +3 would represent
// 2026-05, -1 would represent 2026-01.
export default function CalendarMonth(props: { monthIndex: number; entries: string[]; selectedDay: string }) {
    const todayMonth = dayAdjustedTime.getMonth();
    const todayYear = dayAdjustedTime.getFullYear();
    const rawMonth = todayMonth + props.monthIndex;
    // this works, because e.g. `new Date(2026, -3, 1)` is Oct 01 2025
    const startingDate = new Date(todayYear, rawMonth, 1);

    const actualMonth = startingDate.getMonth();
    const actualYear = startingDate.getFullYear();
    // get the amount of days from the last day of that month ("0th" day of next month)
    const daysInMonth = new Date(actualYear, actualMonth + 1, 0).getDate();

    // calculate the day-of-week offset of the first day of the month
    let firstOffset = startingDate.getDay() - 1;
    if (firstOffset === -1) {
        firstOffset = 6;
    }

    const monthName = startingDate.toLocaleString("default", { month: "long" });

    return (
        <div className="calendar-month">
            <div className="top-bar">
                <div className="month-wrapper">
                    <span className="month">
                        {monthName} {actualYear}
                    </span>
                </div>
            </div>
            <div className="days">
                {Array.from(Array(firstOffset).keys()).map((_, i) => (
                    <div className="offset" key={i}></div>
                ))}

                {Array.from(Array(daysInMonth).keys()).map((_, i) => {
                    const currentDay = `${actualYear}-${(actualMonth + 1).toString().padStart(2, "0")}-${(i + 1)
                        .toString()
                        .padStart(2, "0")}`;

                    const hasEntry = props.entries.includes(currentDay);
                    const isToday = today === currentDay;
                    const isSelected = props.selectedDay === currentDay;

                    const classes: string[] = [];
                    if (hasEntry) {
                        classes.push("has-entry");
                    }
                    if (isToday) {
                        classes.push("today");
                    }
                    if (isSelected) {
                        classes.push("selected");
                    }

                    return (
                        <Link to="/entry" search={{ date: currentDay }} className={`day ${classes.join(" ")}`} key={i}>
                            {i + 1}
                        </Link>
                    );
                })}

                {Array.from(Array(42 - daysInMonth - firstOffset).keys()).map((_, i) => (
                    <span
                        className={`offset ${
                            firstOffset + daysInMonth + i < Math.ceil((firstOffset + daysInMonth) / 7) * 7 ? "row-1" : ""
                        }`}
                        key={i}
                    ></span>
                ))}
            </div>
        </div>
    );
}
