"use client";

import "./styles.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import SearchResult, { SearchResultType } from "@/components/search-result/SearchResult";
import { API_URL } from "@/util/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Slide, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import { decryptEntry } from "@/util/encryption";

export type JournalEntry = {
    date: string;
    content: string;
    mood?: number;
    location?: number;
    word_count: number;
};

export default function Home() {
    const [results, setResults] = useState<SearchResultType[]>([]);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [dataLoadingPromise, setDataLoadingPromise] = useState<Promise<void> | null>(null);
    const router = useRouter();

    const fetchAndDecryptEntries = useCallback(async () => {
        // check login status
        if (!localStorage.getItem("logged-in")) {
            router.push("/login");
        } else if (!sessionStorage.getItem("codeword")) {
            router.push("/codeword");
        }

        try {
            const response = await fetch(`${API_URL}/download?codeword=${sessionStorage.getItem("codeword")}`);
            const json = await response.json();

            // decrypt entries
            const decryptPromises = [];
            let error = false;

            for (const entry of json.results) {
                decryptPromises.push(
                    new Promise<void>(async (resolve, reject) => {
                        const decoded = await decryptEntry(entry.content);
                        if (!decoded) {
                            error = true;
                            console.log("Failed decrypting:", entry.content, entry.date);
                        } else {
                            // strip html
                            const div = document.createElement("div");
                            div.innerHTML = decoded;
                            // strip emojis
                            entry.content = div.innerText.replace(/\p{Emoji}/gu, "");
                        }

                        resolve();
                    })
                );
            }

            await Promise.all(decryptPromises);

            if (error) {
                toast.warn("Failed to decrypt some entries.", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
            }

            setEntries(json.results);
            setIsLoading(false);
        } catch (error) {
            console.log("Decryption failed:", error);
        }
    }, []);

    // wrapped to only run on the client
    useEffect(() => {
        const loadingPromise = fetchAndDecryptEntries();
        setDataLoadingPromise(loadingPromise);

        const keyDown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                router.push("/overview");
                event.preventDefault();
            }
        };
        document.addEventListener("keydown", keyDown);
    }, [fetchAndDecryptEntries]);

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

    function navigate(event: React.KeyboardEvent<HTMLInputElement>) {
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
            (document.querySelector(".result.active") as HTMLElement).click();
        }
    }

    // https://www.joshwcomeau.com/snippets/javascript/debounce/
    const debounce = (callback: (...args: any[]) => void, wait: number): ((...args: any[]) => void) => {
        let timeoutId: number | null = null;

        return (...args: any[]) => {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(() => {
                callback(...args);
            }, wait);
        };
    };

    const search = useMemo(
        () =>
            debounce(async () => {
                const searchField = document.getElementById("search-field") as HTMLInputElement;
                const searchQuery = searchField.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                setSearchQuery(searchQuery);
                const resultCount = document.getElementById("result-count") as HTMLParagraphElement;

                if (searchQuery.length < 3) {
                    setResults([]);
                    resultCount.textContent = "";
                    return;
                }

                if (isLoading && dataLoadingPromise) {
                    await dataLoadingPromise;
                }

                // extra context for mobile
                let extraContext = 0;
                if (window.innerWidth < 600) {
                    extraContext = 8;
                }

                const results: SearchResultType[] = [];
                for (const entry of entries) {
                    const matches = entry.content.matchAll(new RegExp(searchQuery, "gi"));
                    const searchResult = { date: entry.date, query: searchQuery, matches: [] } as SearchResultType;

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
                        });
                    }
                    if (searchResult.matches.length > 0) {
                        results.push(searchResult);
                    }
                }

                // sort results by date
                results.sort((a, b) => (a.date < b.date ? 1 : -1));

                setResults(results);
                resultCount.textContent = `${results.length} result${results.length === 1 ? "" : "s"}`;
            }, 150),
        [entries]
    );

    return (
        <main className="search">
            <div className="search-wrap">
                <input id="search-field" placeholder="Search..." onInput={search} autoFocus onKeyDown={navigate} />
                <div id="search-icon">
                    <FontAwesomeIcon icon={faSearch} />
                </div>
                <p id="result-count"></p>
                <div className="results">
                    {results.map((result, index) => (
                        <SearchResult
                            key={result.date}
                            date={result.date}
                            query={searchQuery}
                            matches={result.matches}
                            active={index == activeIndex}
                            id={index}
                            setActiveIndex={setActiveIndex}
                        />
                    ))}
                </div>
            </div>
            <Link href="/overview" className="back">
                <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
        </main>
    );
}
