import Link from "next/link";
import "./SearchResult.css";

export type SearchResultType = {
    date: string;
    query: string;
    matches: SearchMatch[];
};

type SearchMatch = {
    match: string;
    startIndex: number;
    endIndex: number;
    fromStart: boolean;
    fromEnd: boolean;
    index: number;
};

export default function SearchResult(props: SearchResultType) {
    return (
        <Link className="result" href={`/${props.date}?q=${props.query}`}>
            <div className="date">{props.date}</div>
            {props.matches.map((result: SearchMatch) => (
                <Link className="match" key={result.index} href={`/${props.date}?q=${props.query}&i=${result.index}`}>
                    {result.fromStart || <span className="ellipsis">...</span>}
                    {result.match.substring(0, result.startIndex)}
                    <span className="highlight">{result.match.substring(result.startIndex, result.endIndex)}</span>
                    {result.match.substring(result.endIndex)}
                    {result.fromEnd || <span className="ellipsis">...</span>}
                </Link>
            ))}
        </Link>
    );
}
