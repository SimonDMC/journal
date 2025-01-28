"use client";

import "./styles.css";
import { useEffect, useState } from "react";
import SearchResult, { SearchResultType } from "@/components/search-result/SearchResult";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { db } from "@/database/db";
import { useLiveQuery } from "dexie-react-hooks";
import { enforceAuth, RouteType } from "@/util/auth";

export type JournalEntry = {
    date: string;
    content: string;
    mood?: number;
    location?: number;
    word_count: number;
};

export default function Home() {
    const [results, setResults] = useState<SearchResultType[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const router = useRouter();

    const entries = useLiveQuery(() => db.entries.toArray())?.map((entry) => {
        // strip html
        const div = document.createElement("div");
        div.innerHTML = entry.content;
        entry.content = div.innerText;
        // replace "s
        entry.content = entry.content.replaceAll("“", '"').replaceAll("”", '"');
        return entry;
    });

    useEffect(() => {
        enforceAuth(router, RouteType.Authed);

        const keydown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                router.push("/overview");
                event.preventDefault();
            }

            // focus input on /
            if (event.key === "/" && document.activeElement?.id != "search-field") {
                document.getElementById("search-field")?.focus();
                event.preventDefault();
            }
        };
        document.addEventListener("keydown", keydown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
        };
    }, []);

    function scrollActiveResultIntoView() {
        const result = document.querySelector(".result.active")!;
        const resultBoundingBox = result.getBoundingClientRect();
        const boundingBox = document.querySelector(".results")!.getBoundingClientRect();

        if (resultBoundingBox.bottom > boundingBox.bottom) {
            result.scrollIntoView(false);
        } else if (resultBoundingBox.top < boundingBox.top) {
            result.scrollIntoView(true);
        }
    }

    function wrapIndex(index: number) {
        if (index < 0) index += results.length;
        if (index >= results.length) index -= results.length;
        return index;
    }

    async function navigate(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key == "ArrowUp") {
            setActiveIndex(wrapIndex(activeIndex - 1));
            event.preventDefault();
            requestAnimationFrame(() => scrollActiveResultIntoView());
        }

        if (event.key == "ArrowDown") {
            setActiveIndex(wrapIndex(activeIndex + 1));
            event.preventDefault();
            requestAnimationFrame(() => scrollActiveResultIntoView());
        }

        if (event.key == "Enter") {
            if (event.ctrlKey) {
                document.getElementById("plot-button")?.click();
            } else {
                const activeResult = document.querySelector(".result.active") as HTMLElement;
                if (activeResult) activeResult.click();
            }
        }
    }

    async function search() {
        const searchField = document.getElementById("search-field") as HTMLInputElement;
        const searchQuery = searchField.value;
        setSearchQuery(searchQuery);
        const resultCount = document.getElementById("result-count") as HTMLParagraphElement;

        for (const queryFragment of searchQuery.split(" OR ")) {
            if (queryFragment.length < 3) {
                setResults([]);
                resultCount.textContent = "";
                return;
            }
        }

        // extra context for mobile
        let extraContext = 0;
        if (window.innerWidth < 600) {
            extraContext = 8;
        }

        const results: SearchResultType[] = [];
        for (const entry of entries ?? []) {
            const matches: RegExpExecArray[] = [];
            for (const queryFragment of searchQuery.split(" OR ")) {
                matches.push(...entry.content.matchAll(new RegExp(queryFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")));
            }

            const searchResult = { date: entry.date, matches: [] } as SearchResultType;

            let i = 0;
            for (const match of matches) {
                if (match.index === undefined) continue;
                // cut context
                let fromStart = false;
                let fromEnd = false;
                let startIndex = match.index - 20 - extraContext;
                let endIndex = match.index + 25 + extraContext;
                // if there's extra space on either side, adjust
                if (startIndex < 0) {
                    endIndex -= startIndex - 2;
                    startIndex = 0;
                    fromStart = true;
                }
                if (endIndex > entry.content.length) {
                    startIndex -= endIndex - entry.content.length + 2;
                    // edge case where the whole entry is shorter than the context window
                    startIndex = Math.max(0, startIndex);
                    endIndex = entry.content.length;
                    fromEnd = true;
                }

                searchResult.matches.push({
                    match: entry.content.substring(startIndex, endIndex),
                    startIndex: match.index - startIndex,
                    endIndex: match.index + match[0].length - startIndex,
                    fromStart,
                    fromEnd,
                    index: ++i,
                    query: match[0],
                });
            }
            if (searchResult.matches.length > 0) {
                results.push(searchResult);
            }
        }

        // sort results by date
        results.sort((a, b) => (a.date < b.date ? 1 : -1));

        resultCount.textContent = `${results.length} result${results.length === 1 ? "" : "s"}`;

        // only keep first 40 and last 10 results if there are more
        if (results.length > 50) {
            results.splice(40, results.length - 50);
        }

        setResults(results);
    }

    return (
        <main className="search">
            <div className="search-wrap">
                <input id="search-field" placeholder="Search..." onInput={search} autoFocus onKeyDown={navigate} />
                <a id="plot-button" href={`/search-plot?q=${searchQuery}`}>
                    <FontAwesomeIcon icon={faChartLine} />
                </a>
                <p id="result-count"></p>
                <div className="results">
                    {results.map((result, index) => (
                        <SearchResult
                            key={result.date}
                            date={result.date}
                            matches={result.matches}
                            active={index == activeIndex}
                            id={index}
                            setActiveIndex={setActiveIndex}
                        />
                    ))}
                </div>
            </div>
            <Link href="/overview" className="back-arrow">
                <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
        </main>
    );
}
