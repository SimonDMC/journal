// chatgpt wrote this function
export function highlightNthOccurrence(container: Node, searchText: string, n: number) {
    if (window.getSelection()?.toString().toLowerCase() == searchText.toLowerCase()) return;

    let occurrences = 0;
    const lowerSearchText = searchText.toLowerCase();

    function findAndHighlight(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const lowerText = text!.toLowerCase();
            let index = 0;

            while ((index = lowerText.indexOf(lowerSearchText, index)) !== -1) {
                occurrences++;
                if (occurrences === n) {
                    const range = document.createRange();

                    range.setStart(node, index);
                    range.setEnd(node, index + searchText.length);

                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);

                    const top = getCaretPixelTop(container.parentElement!) ?? 0;
                    const contentRect = (container as HTMLElement).getBoundingClientRect();
                    if (top > contentRect.bottom) {
                        (container as HTMLElement).scrollTo(0, top);
                    }

                    return true; // stop once nth occurrence is found
                }
                index += searchText.length;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let child of node.childNodes) {
                if (findAndHighlight(child)) {
                    return true; // bubble up if found
                }
            }
        }
        return false;
    }

    findAndHighlight(container);
}

// based on https://stackoverflow.com/a/23526970/19271522
function getCaretPixelTop(node: HTMLElement, offsetY: number = 0): number | null {
    if (!node) return null;

    let nodeTop = node.offsetTop;

    if (window.getSelection) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0).cloneRange();

            try {
                // adjust the range to avoid empty selection issues
                range.setStart(range.startContainer, range.startOffset - 1);
            } catch (e) {
                // ignore if start offset is out of range
            }

            const rect = range.getBoundingClientRect();

            if (range.endOffset === 0 || range.toString() === "") {
                // handle case where selection is at the beginning of a line or empty
                if (range.startContainer === node) {
                    if (range.endOffset === 0) {
                        // empty contenteditable
                        return nodeTop;
                    } else {
                        // firefox fix for empty selection
                        const range2 = range.cloneRange();
                        range2.setStart(range2.startContainer, 0);
                        const rect2 = range2.getBoundingClientRect();
                        return rect2.top + rect2.height + offsetY - nodeTop;
                    }
                } else {
                    return (range.startContainer as HTMLElement).offsetTop;
                }
            } else {
                return rect.top + offsetY - nodeTop;
            }
        }
    }

    return null; // fallback if selection isn't available
}
