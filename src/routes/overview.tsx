import "../styles/overview.css";
import { useEffect, useState } from "react";
import Calendar from "../components/calendar/Calendar";
import ProfileIcon from "../components/profile-icon/ProfileIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { syncDatabase } from "../database/sync";
import { checkForUpdate } from "../util/update";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../database/db";
import { enforceAuth, RouteType } from "../util/auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { dayAdjustedTime, today } from "../util/time";
import { updatePopupOpen } from "../components/update-popup/UpdatePopup";
import { runMigrations } from "../util/migrations";

export const Route = createFileRoute("/overview")({
    component: Overview,
});

function Overview() {
    const navigate = useNavigate();
    const [oneYearAgo, setOneYearAgo] = useState("");

    const entriesFull = useLiveQuery(() => db.entries.toArray()) ?? [];
    const entries = entriesFull.map((entry) => entry.date);
    const wordCount = entriesFull.reduce((acc, cur) => (acc += cur.word_count), 0);

    useEffect(() => {
        enforceAuth(navigate, RouteType.Authed);
        checkForUpdate();
        // run potential migrations only after fully syncing database
        syncDatabase().then(() => runMigrations());

        // check key status
        if (!localStorage.getItem("key")) {
            document.getElementById("keyless-bar")?.classList.remove("hidden");
            document.querySelector(".stats")?.classList.add("hidden");
        }

        const month = sessionStorage.getItem("month");
        if (month) setMonth(parseInt(month));

        // keybinds
        const keydown = (e: KeyboardEvent) => {
            // don't let user navigate if the update popup is open
            if (updatePopupOpen) return;

            // calendar navigation
            if (e.key === "ArrowLeft") {
                const previous = document.querySelector(".top-bar button:first-child") as HTMLButtonElement;
                previous.click();
            } else if (e.key === "ArrowRight") {
                const next = document.querySelector(".top-bar button:last-child") as HTMLButtonElement;
                next.click();
            }

            // today
            if (e.key === "Enter" || e.key === "t" || e.key === " ") {
                const today = document.getElementById("today") as HTMLAnchorElement;
                today.click();
            }

            // one year ago
            if (e.key === "y") {
                const lastYear = document.getElementById("lastYear") as HTMLAnchorElement;
                lastYear.click();
            }

            // search
            if (e.key === "s" || e.key === "f" || e.key === "/") {
                const search = document.getElementById("search") as HTMLAnchorElement;
                search.click();
                // ensure the search keybind doesn't get typed into search query box
                e.preventDefault();
            }
        };
        document.addEventListener("keydown", keydown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
        };
    }, []);

    useEffect(() => {
        if (entries.length > 0) {
            const lastYear = new Date(dayAdjustedTime);
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            const lastYearString = lastYear.toISOString().substring(0, 10);
            setOneYearAgo(lastYearString);
            const lastYearLink = document.getElementById("lastYear") as HTMLAnchorElement;
            if (!entries.find((entry) => entry === lastYearString)) {
                lastYearLink.classList.add("inactive");
            }
        }
    }, [entries]);

    // js date supports stuff like (2023, -7, 20) or (2023, 54, 20) so no need to worry about going out of bounds
    const [month, setMonth] = useState(dayAdjustedTime.getMonth() + 1);

    function previousMonth() {
        setMonth(month - 1);
        sessionStorage.setItem("month", (month - 1).toString());
    }

    function nextMonth() {
        setMonth(month + 1);
        sessionStorage.setItem("month", (month + 1).toString());
    }

    // https://stackoverflow.com/a/2901298
    const commaFormat = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <main>
            <div id="keyless-bar" className="hidden">
                Warning: Missing Key
            </div>
            <div id="offline" className="invis">
                Offline Mode
            </div>
            <Calendar
                month={new Date(new Date(dayAdjustedTime).getFullYear(), month, 1).toISOString().substring(0, 10)}
                previousMonth={previousMonth}
                nextMonth={nextMonth}
                entries={entries}
            />
            <Link to="/entry" search={{ date: today }} id="today" className="nav-link">
                Today
            </Link>
            <Link to="/entry" search={{ date: oneYearAgo }} id="lastYear" className="nav-link">
                One Year Ago
            </Link>
            <ProfileIcon />
            <div className="stats">
                <p className="entryCount">Entry Count: {commaFormat(entries.length)}</p>
                <p className="wordCount">Total Words: {commaFormat(wordCount)}</p>
            </div>
            <div className="bottom-right">
                <Link to="/search" id="search">
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Link>
            </div>
        </main>
    );
}
