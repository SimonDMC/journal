import "./Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@tanstack/react-router";
import { today } from "../../util/time";

export default function Calendar(props: { month: string; previousMonth: () => void; nextMonth: () => void; entries: string[] }) {
    const currentMonth = new Date(props.month).getMonth();
    const currentYear = new Date(props.month).getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // calculate the day-of-week offset of the first day of the month
    let firstOffset = new Date(currentYear, currentMonth, 1).getDay() - 1;
    if (firstOffset === -1) {
        firstOffset = 6;
    }

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("default", { month: "long" });

    let touchStartX: number;
    let touchEndX: number;

    const touchStart = (event: React.TouchEvent) => {
        touchStartX = event.changedTouches[0].screenX;
    };

    const touchEnd = (event: React.TouchEvent) => {
        touchEndX = event.changedTouches[0].screenX;
        if (Math.abs(touchEndX - touchStartX) < 20) return;
        if (touchEndX > touchStartX) {
            props.previousMonth();
        }
        if (touchStartX > touchEndX) {
            props.nextMonth();
        }
    };

    return (
        <div id="calendar" className="calendar" onTouchStart={touchStart} onTouchEnd={touchEnd}>
            <div className="top-bar">
                <div className="inner">
                    <button onClick={() => props.previousMonth()}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <span>
                        {monthName} {currentYear}
                    </span>
                    <button onClick={() => props.nextMonth()}>
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>
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

                    const hasEntry = props.entries.includes(currentDay);
                    const isToday = today === currentDay;

                    const classes: string[] = [];
                    if (hasEntry) {
                        classes.push("has-entry");
                    }
                    if (isToday) {
                        classes.push("today");
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
