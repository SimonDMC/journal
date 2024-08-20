import Link from "next/link";
import "./SearchResult.css";

export type SearchResultType = {
    date: string;
    matches: SearchMatch[];
};

type SearchMatch = {
    match: string;
    startIndex: number;
    endIndex: number;
    fromStart: boolean;
    fromEnd: boolean;
};

export default function SearchResult(props: SearchResultType) {
    return (
        <Link className="result" href={`/${props.date}`}>
            <div className="date">{props.date}</div>
            {props.matches.map((result: SearchMatch) => (
                <div className="match" key={result.startIndex}>
                    {result.fromStart || <span className="ellipsis">...</span>}
                    {result.match.substring(0, result.startIndex)}
                    <span className="highlight">{result.match.substring(result.startIndex, result.endIndex)}</span>
                    {result.match.substring(result.endIndex)}
                    {result.fromEnd || <span className="ellipsis">...</span>}
                </div>
            ))}
        </Link>
    );
}
