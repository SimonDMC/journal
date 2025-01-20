import Link from "next/link";
import "./SearchResult.css";
import parse from "html-react-parser";

export type SearchResultType = {
    date: string;
    matches: SearchMatch[];
    active?: boolean;
    id?: number;
    setActiveIndex?: Function;
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
            .replaceAll("\uFFFD", "")
            // wrap emoji in span to allow monospace styling
            .replaceAll(/(\p{Emoji_Presentation})/gu, "<span class='emoji'>$1</span>")
    );
}

export default function SearchResult(props: SearchResultType) {
    return (
        <Link
            className={`result ${props.active && "active"}`}
            href={`/entry?date=${props.date}`}
            onMouseOver={() => props.setActiveIndex!(props.id)}
        >
            <div className="date">{props.date}</div>
            {props.matches.map((result: SearchMatch) => (
                <Link className="match" key={result.index} href={`/entry?date=${props.date}&q=${result.query}&i=${result.index}`}>
                    {result.fromStart || <span className="ellipsis">...</span>}
                    {fixupText(result.match.substring(0, result.startIndex))}
                    <span className="highlight">{fixupText(result.match.substring(result.startIndex, result.endIndex))}</span>
                    {fixupText(result.match.substring(result.endIndex))}
                    {result.fromEnd || <span className="ellipsis">...</span>}
                </Link>
            ))}
        </Link>
    );
}
