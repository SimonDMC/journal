import "./Calendar.css";

export default function Calendar(props: { month: string; previousMonth: Function; nextMonth: Function; entries: any }) {
    const currentMonth = new Date(props.month).getMonth();
    const currentYear = new Date(props.month).getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // calculate the day-of-week offset of the first day of the month
    let firstOffset = new Date(currentYear, currentMonth, 1).getDay() - 1;
    if (firstOffset === -1) {
        firstOffset = 6;
    }

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("default", { month: "long" });

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

                {Array.from(Array(daysInMonth).keys()).map((_, i) => {
                    const currentDay = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${(i + 1)
                        .toString()
                        .padStart(2, "0")}`;

                    // calculate today's date by offsetting the current date by the timezone offset
                    let adjustedTimestamp = Date.now() - new Date().getTimezoneOffset() * 60 * 1000;
                    // additionally count "today" until 4am the next day
                    const today = new Date(adjustedTimestamp - 4 * 60 * 60 * 1000).toISOString().substring(0, 10);

                    const hasEntry = props.entries.includes(currentDay);
                    const isToday = today === currentDay;
                    const entriesNotEmpty = Object.keys(props.entries).length > 0;

                    let dayClass = "";
                    if (hasEntry && isToday) {
                        dayClass = "today-has-entry";
                    } else if (hasEntry) {
                        dayClass = "has-entry";
                    } else if (isToday && entriesNotEmpty) {
                        dayClass = "today";
                    }

                    return (
                        <a className={`day ${dayClass}`} key={i} href={`/${currentDay}`}>
                            {i + 1}
                        </a>
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
