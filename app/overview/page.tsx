"use client";

import "./styles.css";
import { useEffect, useRef, useState } from "react";
import Calendar, { dayAdjustedTime, today } from "@/components/calendar/Calendar";
import { API_URL } from "../../util/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/dropdown/Dropdown";
import DropdownItem from "@/components/dropdown/DropdownItem";
import DropdownSeparator from "@/components/dropdown/DropdownSeparator";
import DropdownText from "@/components/dropdown/DropdownText";
import { downloadKey, uploadKey, download } from "@/util/profile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";
import { Slide, toast } from "react-toastify";

export default function Home() {
    const [entries, setEntries] = useState([]);
    const [wordCount, setWordCount] = useState(0);
    const [oneYearAgo, setOneYearAgo] = useState("");
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const entriesLoaded = useRef(false);
    const router = useRouter();
    const username = useRef("User");

    // wrapped to only run on the client
    useEffect(() => {
        // check login status
        if (!localStorage.getItem("logged-in")) {
            router.push("/login");
        } else if (!sessionStorage.getItem("codeword")) {
            router.push("/codeword");
        }

        // check for update
        fetch("/build-meta.json")
            .then((res) => res.json())
            .then((json) => {
                const buildTimestamp = json.buildTimestamp;

                // clear cache and reload if there's a newer build available
                const cachedAt = localStorage.getItem("cached-at");
                if (cachedAt && parseInt(cachedAt) < buildTimestamp) {
                    window.caches.delete("journal-cache");
                    localStorage.setItem("cached-at", Date.now().toString());

                    toast.success("New build available, reloading in 5 seconds!", {
                        position: "top-right",
                        theme: "dark",
                        transition: Slide,
                    });
                    setTimeout(() => {
                        window.location.reload();
                    }, 5000);
                }
            });

        username.current = localStorage.getItem("username") ?? "User";

        // check key status
        if (!localStorage.getItem("key")) {
            document.getElementById("keyless-bar")?.classList.remove("hidden");
            document.querySelector(".stats")?.classList.add("hidden");
            document.querySelector(".controls")?.classList.add("hidden");
        }

        const month = sessionStorage.getItem("month");
        if (month) setMonth(parseInt(month));

        // load entries from database
        fetch(`${API_URL}/overview?codeword=${sessionStorage.getItem("codeword")}`)
            .then((res) => res.json())
            .then((data) => {
                setEntries(data.entries);
                setWordCount(data.totalWords);
                document.getElementById("calendar")?.classList.remove("loading");
            })
            .catch((err) => {
                console.error(err);
                localStorage.removeItem("logged-in");
                router.push("/login");
            });

        // keybinds
        const keydown = (e: KeyboardEvent) => {
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
            }
        };
        document.addEventListener("keydown", keydown);

        // profile dropdown
        const clickOutside = (e: MouseEvent) => {
            if (!document.getElementById("profile-dropdown")?.contains(e.target as HTMLElement)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener("click", clickOutside);

        // remove listeners on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
            document.removeEventListener("click", clickOutside);
        };
    }, []);

    useEffect(() => {
        if (entriesLoaded.current) {
            const lastYear = new Date(dayAdjustedTime);
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            const lastYearString = lastYear.toISOString().substring(0, 10);
            setOneYearAgo(lastYearString);
            const lastYearLink = document.getElementById("lastYear") as HTMLAnchorElement;
            if (entries.find((entry) => entry === lastYearString)) {
                lastYearLink.classList.remove("inactive");
            }
        } else {
            entriesLoaded.current = true;
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

    async function logout() {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
        });
        localStorage.removeItem("logged-in");
        sessionStorage.removeItem("codeword");
        router.push("/login");
    }

    return (
        <main>
            <div id="keyless-bar" className="hidden">
                Warning: Missing Key
            </div>
            <Calendar
                month={new Date(new Date().getFullYear(), month, 1).toISOString().substring(0, 10)}
                previousMonth={previousMonth}
                nextMonth={nextMonth}
                entries={entries}
            />
            <Link href={`/${today}`} id="today" className="nav-link">
                Today
            </Link>
            <Link href={`/${oneYearAgo}`} id="lastYear" className="nav-link inactive">
                One Year Ago
            </Link>
            <div className="top-right" id="profile-dropdown">
                <a onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                    <FontAwesomeIcon icon={faUser} />
                </a>
                <Dropdown open={profileDropdownOpen}>
                    <DropdownText label={username.current} />
                    <DropdownSeparator />
                    <DropdownItem label="Upload Key" onClick={uploadKey} />
                    <DropdownItem label="Download Key" onClick={downloadKey} />
                    <DropdownItem label="Export" onClick={download} />
                    <DropdownSeparator />
                    <DropdownItem label="Log Out" onClick={logout} />
                </Dropdown>
            </div>
            <div className="stats">
                <p className="entryCount">Entry Count: {commaFormat(entries.length)}</p>
                <p className="wordCount">Total Words: {commaFormat(wordCount)}</p>
            </div>
            <div className="controls">
                <Link href="/search" id="search">
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Link>
            </div>
        </main>
    );
}
