export function calculateWords(content: string | null): number {
    if (content === null) return 0;

    // strip html tags and normalize spaces for word count calculation
    // also don't count "empty" words so e.g. ` word ` gets calc'd as
    // one word instead of three
    return content
        .replaceAll("&nbsp;", " ")
        .replaceAll("</p><p>", " ")
        .replaceAll(/<.*?>/g, "")
        .split(/\s+/)
        .filter((word) => word !== "").length;
}
