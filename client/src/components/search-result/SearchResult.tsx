import { Link } from "@tanstack/react-router";
import "./SearchResult.css";
import parse from "html-react-parser";

export type SearchResults = {
    results: SearchResultType[];
    // since results are capped, the real length has to be stored separately
    length: number;
};

export type SearchResultType = {
    date: string;
    matches: SearchMatch[];
};

export type SearchResultProps = SearchResultType & {
    active: boolean;
    id: number;
    setActiveIndex: (_: number) => void;
};

type SearchMatch = {
    match: string;
    startIndex: number;
    endIndex: number;
    fromStart: boolean;
    fromEnd: boolean;
    index: number;
    query: string;
};

function fixupText(text: string) {
    return parse(
        text
            // remove potential half-emojis
            .toWellFormed()
            .replaceAll("\uFFFD", ""),
    );
}

export default function SearchResult(props: SearchResultProps) {
    return (
        <div
            className={`result ${props.active && "active"}`}
            onMouseOver={() => props.setActiveIndex!(props.id)}
        >
            <div className="date">{props.date}</div>
            {props.matches.map((result: SearchMatch) => (
                <Link
                    to="/entry"
                    search={{ date: props.date, query: result.query, index: result.index }}
                    className={`match ${result.fromEnd && "reverse"}`}
                    key={result.index}
                >
                    {!result.fromStart && !result.fromEnd && <span className="ellipsis">...</span>}
                    <span className="context">
                        {fixupText(result.match.substring(0, result.startIndex))}
                    </span>
                    <span className="highlight">
                        {fixupText(result.match.substring(result.startIndex, result.endIndex))}
                    </span>
                    <span className="context">
                        {fixupText(result.match.substring(result.endIndex))}
                    </span>
                    {/* left-to-right mark ensures trailing punctuation gets placed on the correct 
                    side, even if text is rtl for styling (ellipsis) purposes */}
                    &lrm;
                </Link>
            ))}
        </div>
    );
}
