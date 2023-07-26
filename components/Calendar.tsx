import "./Calendar.css";
import { useState } from "react";

export default function Calendar(props: { month: string; previousMonth: Function; nextMonth: Function; entries: any }) {
    const currentMonth = new Date(props.month).getMonth();
    const currentYear = new Date(props.month).getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let firstOffset = new Date(currentYear, currentMonth, 1).getDay() - 1;
    if (firstOffset === -1) {
        firstOffset = 6;
    }

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("default", { month: "long" });
    console.log(Object.keys(props.entries));

    return (
        <div className="calendar">
            <div className="top-bar">
                <div className="inner">
                    <button onClick={() => props.previousMonth()}>←</button>
                    {monthName} {currentYear}
                    <button onClick={() => props.nextMonth()}>→</button>
                </div>
            </div>
            <div className="week-days">
                <div className="inner">
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                    <span>S</span>
                </div>
            </div>
            <div className="days">
                {Array.from(Array(firstOffset).keys()).map((_, i) => (
                    <div className="offset" key={i}></div>
                ))}

                {Array.from(Array(daysInMonth).keys()).map((_, i) => (
                    <a
                        className={`day ${
                            // if the day is today and has an entry, add the "today-has-entry" class
                            // if the day is today and doesn't have an entry, add the "today" class (only if entries isn't empty, otherwise it will be red between page load and the entries loading)
                            // if the day is not today and has an entry, add the "has-entry" class
                            // if the day is not today and doesn't have an entry, add no class
                            props.entries[
                                `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${(i + 1).toString().padStart(2, "0")}`
                            ]
                                ? new Date().toISOString().substring(0, 10) ===
                                  `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${(i + 1).toString().padStart(2, "0")}`
                                    ? "today-has-entry"
                                    : "has-entry"
                                : new Date().toISOString().substring(0, 10) ===
                                      `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${(i + 1)
                                          .toString()
                                          .padStart(2, "0")}` && Object.keys(props.entries).length > 0
                                ? "today"
                                : ""
                        }`}
                        key={i}
                        href={`/${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${(i + 1).toString().padStart(2, "0")}`}
                    >
                        {i + 1}
                    </a>
                ))}
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
