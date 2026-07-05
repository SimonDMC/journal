import "../styles/search.css";
import { useEffect, useState } from "react";
import SearchResult, {
    type SearchResults,
    type SearchResultType,
} from "../components/search-result/SearchResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { db } from "../database/db";
import { useLiveQuery } from "dexie-react-hooks";
import { enforceAuth, RouteType } from "../util/auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import BackArrow from "../components/back-arrow/BackArrow";

export type JournalEntry = {
    date: string;
    content: string;
    mood?: number;
    location?: number;
    word_count: number;
};

// kind of a stupid name but whatever
type SearchSearchParams = {
    query?: string;
};

export const Route = createFileRoute("/search")({
    component: Search,
    validateSearch: (search: Record<string, unknown>): SearchSearchParams => {
        // validate and parse the search params into a typed state
        return {
            query: search.query as string,
        };
    },
});

function Search() {
    const [results, setResults] = useState<SearchResults>({ results: [], length: 0 });
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const navigate = useNavigate();
    const initialParams = Route.useSearch();

    const SEARCH_MIN_PADDING = window.innerWidth < 600 ? 15 : 30;
    const SEARCH_MAX_PADDING = 70;

    const entries = useLiveQuery(() => db.entries.toArray())?.map((entry) => {
        if (entry.content == null) return entry;
        // strip html
        const div = document.createElement("div");
        div.innerHTML = entry.content;
        // normalize special characters
        entry.content = normalizeText(div.innerText);
        return entry;
    });

    useEffect(() => {
        enforceAuth(navigate, RouteType.Authed);

        // load search state from query params + cache, if navigated back from a previous search
        if (initialParams.query) {
            setSearchQuery(initialParams.query);
            const cache = sessionStorage.getItem("journal-search-cache");
            if (cache) setResults(JSON.parse(cache));
        }

        const keydown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                navigate({ to: "/overview" });
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

    // normalizes special characters while both parsing and inputting for looser search
    function normalizeText(text: string) {
        return (
            text
                // accented characters
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                // "s and 's
                .replaceAll("“", '"')
                .replaceAll("”", '"')
                .replaceAll("‘", "'")
                .replaceAll("’", "'")
                // dashes
                .replaceAll("–", "-")
                .replaceAll("—", "-")
        );
    }

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

    async function searchNavigate(event: React.KeyboardEvent<HTMLInputElement>) {
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
                const activeResult = document.querySelector(
                    ".result.active :nth-child(2)",
                ) as HTMLElement;
                if (activeResult) activeResult.click();
            }
        }
    }

    function onInput(event: React.FormEvent<HTMLInputElement>) {
        search((event.target as HTMLInputElement).value);
    }

    async function search(query: string) {
        // time how long search takes
        const startTime = Date.now();

        setSearchQuery(query);
        // save in query params for back navigation
        navigate({
            to: "/search",
            search: {
                query,
            },
            replace: true,
        });

        // normalize query
        query = normalizeText(query);

        for (const queryFragment of query.split(" OR ")) {
            if (queryFragment.length < 3) {
                setResults({ results: [], length: 0 });
                return;
            }
        }

        const results: SearchResultType[] = [];
        for (const entry of entries ?? []) {
            if (entry.content === null) continue;

            const matches: RegExpExecArray[] = [];
            for (const queryFragment of query.split(" OR ")) {
                matches.push(
                    ...entry.content.matchAll(
                        new RegExp(queryFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
                    ),
                );
            }

            const searchResult = { date: entry.date, matches: [] } as SearchResultType;

            let i = 0;
            for (const match of matches) {
                if (match.index === undefined) continue;
                // cut context
                let fromStart = false;
                let fromEnd = false;
                let startIndex = match.index - SEARCH_MIN_PADDING;
                let endIndex = match.index + SEARCH_MAX_PADDING;
                // if the snippet is near the beginning of the entry, adjust start and end points
                if (startIndex <= 0) {
                    endIndex -= startIndex - 2;
                    startIndex = 0;
                    fromStart = true;
                }
                // if we're close to the end, switch to end-only display
                if (match.index + SEARCH_MIN_PADDING > entry.content.length) {
                    startIndex -= endIndex - entry.content.length + 2;
                    // edge case where the whole entry is shorter than the context window
                    if (startIndex < 0) {
                        startIndex = 0;
                        fromStart = true;
                    }
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

                // only show max 5 instances within an entry, perf optimization
                const instances = searchResult.matches.length;
                if (instances > 5) {
                    searchResult.matches.splice(4, instances - 5);
                }
            }
            if (searchResult.matches.length > 0) {
                results.push(searchResult);
            }
        }

        // sort results by date
        results.sort((a, b) => (a.date < b.date ? 1 : -1));

        // only keep first 40 and last 10 results if there are more (perf optimization)
        // the philosophy behind this decision is as follows: i'm too lazy to add "show more" for
        // now and if you're looking for something not too specific you likely care about the last
        // time you mentioned it or the very first time
        const length = results.length;
        if (length > 50) {
            results.splice(40, length - 50);
        }

        setResults({ results, length });

        // snap back to first result if it's out of bounds
        if (length <= activeIndex) {
            setActiveIndex(0);
        }

        // save in sessionstorage for back navigation
        sessionStorage.setItem("journal-search-cache", JSON.stringify({ results, length }));

        // log search time for perf auditing
        console.log(`Search for '${query}' took ${Date.now() - startTime} ms`);
    }

    return (
        <main className="search margin-bypass">
            <div className="search-wrap">
                <input
                    id="search-field"
                    placeholder="Search..."
                    onInput={onInput}
                    autoFocus
                    onKeyDown={searchNavigate}
                    value={searchQuery}
                />
                <Link to="/search-plot" search={{ query: searchQuery }} id="plot-button">
                    <FontAwesomeIcon icon={faChartLine} />
                </Link>
                <p id="result-count">
                    {searchQuery.length < 3
                        ? ""
                        : `${results.length} result${results.length === 1 ? "" : "s"}`}
                </p>
                <div className="results">
                    {results.results.map((result, index) => (
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
            <BackArrow />
        </main>
    );
}
