import React from "react";
import "./QuoteImage.css";
import html2canvas from "html2canvas";

function closeImage(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.id == "quoteImageBg") target.classList.remove("visible");
}

function downloadImage() {
    html2canvas(document.getElementById("quoteImage")!).then((canvas) => {
        document.body.appendChild(canvas);
        var link = document.createElement("a");
        document.body.appendChild(link);
        link.download = "journal-quote.png";
        link.href = document.querySelector("canvas")!.toDataURL();
        link.click();
        document.body.removeChild(canvas);
        document.body.focus();
    });
}

export default function QuoteImage() {
    return (
        <div id="quoteImageBg" onClick={(e) => closeImage(e)}>
            <div className="quoteImageFrame">
                <div className="quoteButtons">
                    <button onClick={downloadImage}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M12 15.575q-.2 0-.375-.062T11.3 15.3l-3.6-3.6q-.3-.3-.288-.7t.288-.7q.3-.3.713-.312t.712.287L11 12.15V5q0-.425.288-.712T12 4t.713.288T13 5v7.15l1.875-1.875q.3-.3.713-.288t.712.313q.275.3.288.7t-.288.7l-3.6 3.6q-.15.15-.325.213t-.375.062M6 20q-.825 0-1.412-.587T4 18v-2q0-.425.288-.712T5 15t.713.288T6 16v2h12v-2q0-.425.288-.712T19 15t.713.288T20 16v2q0 .825-.587 1.413T18 20z"
                            />
                        </svg>
                    </button>
                    <button>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"
                            />
                        </svg>
                    </button>
                </div>
                <div className="quoteImageBorder">
                    <div id="quoteImage">
                        <div className="quoteStart">“</div>
                        <div id="quoteText">TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</div>
                        <div className="quoteEnd">”</div>
                        <div className="quoteFooter">
                            <div id="quoteCredit"></div>
                            <div id="quoteDate">March 20, 2025</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
