"use client";

import "./styles.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import SearchResult, { SearchResultType } from "@/components/SearchResult";
import { API_URL, KEY_GENERATOR } from "@/util/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Slide, toast } from "react-toastify";

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

            const storedKey = localStorage.getItem("key");
            if (!storedKey) {
                toast.error("No key has been imported.", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
                return;
            }

            // decrypt entries
            const buffer = new Uint8Array(JSON.parse(storedKey));
            const key = await window.crypto.subtle.importKey("raw", buffer, KEY_GENERATOR, false, ["decrypt"]);

            let failed = false;
            for (const entry of json.results) {
                const data = new Uint8Array([...atob(entry.content)].map((c) => c.charCodeAt(0)));
                const iv = data.slice(0, 16);
                const encrypted = data.slice(16);
                try {
                    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
                    const decoded = new TextDecoder().decode(decrypted);
                    // strip html
                    const div = document.createElement("div");
                    div.innerHTML = decoded;
                    // strip emojis
                    entry.content = div.innerText.replace(/\p{Emoji}/gu, "");
                } catch (err) {
                    console.error(err);
                    failed = true;
                }
            }

            if (failed) {
                toast.warn("Failed to decrypt some entries.", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
            }

            setEntries(json.results);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            localStorage.removeItem("logged-in");
            router.push("/login");
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
                <input id="search-field" placeholder="Search..." onInput={search} autoFocus />
                <div id="search-icon">
                    <i className="fas fa-search"></i>
                </div>
                <p id="result-count"></p>
                <div className="results">
                    {results.map((result) => (
                        <SearchResult key={result.date} date={result.date} query={searchQuery} matches={result.matches} />
                    ))}
                </div>
            </div>
            <Link href="/overview" className="back">
                <i className="fa-solid fa-arrow-left"></i>
            </Link>
        </main>
    );
}
