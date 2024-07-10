"use client";

import "./styles.css";
import { useCallback, useEffect, useRef, useState } from "react";
import SearchResult, { SearchResultType } from "@/components/SearchResult";
import { API_URL, KEY_GENERATOR } from "@/util/config";

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
    const [isLoading, setIsLoading] = useState(true);
    const [dataLoadingPromise, setDataLoadingPromise] = useState<Promise<void> | null>(null);

    const fetchAndDecryptEntries = useCallback(async () => {
        // check for token in local storage
        if (!localStorage.getItem("logged-in")) {
            window.location.href = "/login";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/download`);
            const json = await response.json();

            const storedKey = localStorage.getItem("key");
            if (!storedKey) {
                alert("No key found.");
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
                    entry.content = new TextDecoder().decode(decrypted);
                } catch (err) {
                    console.error(err);
                    failed = true;
                }
            }

            if (failed) {
                alert("Failed to decrypt some entries.");
            }

            setEntries(json.results);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            localStorage.removeItem("logged-in");
            window.location.href = "/login";
        }
    }, []);

    // wrapped to only run on the client
    useEffect(() => {
        const loadingPromise = fetchAndDecryptEntries();
        setDataLoadingPromise(loadingPromise);

        const keyDown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                window.location.href = "/overview";
                event.preventDefault();
            }
        };
        document.addEventListener("keydown", keyDown);
    }, [fetchAndDecryptEntries]);

    const search = async () => {
        const searchField = document.getElementById("search-field") as HTMLInputElement;
        const searchValue = searchField.value;
        const resultCount = document.getElementById("result-count") as HTMLParagraphElement;

        if (searchValue.length < 3) {
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
            const matches = entry.content.matchAll(new RegExp(searchValue, "gi"));
            const searchResult = { date: entry.date, matches: [] } as SearchResultType;
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
                    endIndex: match.index + searchValue.length - startIndex,
                    fromStart,
                    fromEnd,
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
    };

    return (
        <main>
            <div className="search-wrap">
                <input id="search-field" placeholder="Search..." onInput={search} autoFocus />
                <div id="search-icon">
                    <i className="fas fa-search"></i>
                </div>
                <p id="result-count"></p>
                <div className="results">
                    {results.map((result) => (
                        <SearchResult key={result.date} date={result.date} matches={result.matches} />
                    ))}
                </div>
            </div>
            <a href="/overview" className="back">
                ←
            </a>
        </main>
    );
}
