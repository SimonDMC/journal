import React from "react";
import "./QuoteImage.css";
import html2canvas from "html2canvas";

function closeImage(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.id == "quoteImageBg") target.classList.remove("visible");
}

const html2canvasOptions = {
    backgroundColor: "#000",
};

function downloadImage() {
    html2canvas(document.getElementById("quoteImage")!, html2canvasOptions).then((canvas) => {
        document.body.appendChild(canvas);
        const link = document.createElement("a");
        document.body.appendChild(link);
        link.download = "journal-quote.png";
        link.href = document.querySelector("canvas")!.toDataURL();
        link.click();
        document.body.removeChild(canvas);
        document.body.focus();
    });
}

function copyImage() {
    html2canvas(document.getElementById("quoteImage")!, html2canvasOptions).then((canvas) => {
        canvas.toBlob(function (blob) {
            const item = new ClipboardItem({ "image/png": blob! });
            navigator.clipboard.write([item]);

            const copyImageIcon = document.getElementById("copyImageIcon");
            const copiedImageIcon = document.getElementById("copiedImageIcon");

            copyImageIcon?.classList.add("hidden");
            copiedImageIcon?.classList.remove("hidden");

            setTimeout(() => {
                copiedImageIcon?.classList.add("hidden");
                copyImageIcon?.classList.remove("hidden");
            }, 2000);
        });
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
                    <button onClick={copyImage}>
                        <svg id="copyImageIcon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"
                            />
                        </svg>
                        <svg
                            id="copiedImageIcon"
                            className="hidden"
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="m9.55 15.15l8.475-8.475q.3-.3.7-.3t.7.3t.3.713t-.3.712l-9.175 9.2q-.3.3-.7.3t-.7-.3L4.55 13q-.3-.3-.288-.712t.313-.713t.713-.3t.712.3z"
                            />
                        </svg>
                    </button>
                </div>
                <div className="quoteImageBorder">
                    <div id="quoteImage">
                        <div className="quoteStartContainer">
                            <svg className="quoteStart" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                <path
                                    fill="currentColor"
                                    d="M6.5 10c-.223 0-.437.034-.65.065c.069-.232.14-.468.254-.68c.114-.308.292-.575.469-.844c.148-.291.409-.488.601-.737c.201-.242.475-.403.692-.604c.213-.21.492-.315.714-.463c.232-.133.434-.28.65-.35l.539-.222l.474-.197l-.485-1.938l-.597.144c-.191.048-.424.104-.689.171c-.271.05-.56.187-.882.312c-.318.142-.686.238-1.028.466c-.344.218-.741.4-1.091.692c-.339.301-.748.562-1.05.945c-.33.358-.656.734-.909 1.162c-.293.408-.492.856-.702 1.299c-.19.443-.343.896-.468 1.336c-.237.882-.343 1.72-.384 2.437c-.034.718-.014 1.315.028 1.747c.015.204.043.402.063.539l.025.168l.026-.006A4.5 4.5 0 1 0 6.5 10m11 0c-.223 0-.437.034-.65.065c.069-.232.14-.468.254-.68c.114-.308.292-.575.469-.844c.148-.291.409-.488.601-.737c.201-.242.475-.403.692-.604c.213-.21.492-.315.714-.463c.232-.133.434-.28.65-.35l.539-.222l.474-.197l-.485-1.938l-.597.144c-.191.048-.424.104-.689.171c-.271.05-.56.187-.882.312c-.317.143-.686.238-1.028.467c-.344.218-.741.4-1.091.692c-.339.301-.748.562-1.05.944c-.33.358-.656.734-.909 1.162c-.293.408-.492.856-.702 1.299c-.19.443-.343.896-.468 1.336c-.237.882-.343 1.72-.384 2.437c-.034.718-.014 1.315.028 1.747c.015.204.043.402.063.539l.025.168l.026-.006A4.5 4.5 0 1 0 17.5 10"
                                />
                            </svg>
                        </div>
                        <div id="quoteText"></div>
                        <div className="quoteFooter">
                            <div id="quoteCredit"></div>
                            <div id="quoteDate">March 20, 2025</div>
                        </div>
                        <div className="quoteEndContainer">
                            <svg className="quoteEnd" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                <path
                                    fill="currentColor"
                                    d="m21.95 8.721l-.025-.168l-.026.006A4.5 4.5 0 1 0 17.5 14c.223 0 .437-.034.65-.065c-.069.232-.14.468-.254.68c-.114.308-.292.575-.469.844c-.148.291-.409.488-.601.737c-.201.242-.475.403-.692.604c-.213.21-.492.315-.714.463c-.232.133-.434.28-.65.35l-.539.222l-.474.197l.484 1.939l.597-.144c.191-.048.424-.104.689-.171c.271-.05.56-.187.882-.312c.317-.143.686-.238 1.028-.467c.344-.218.741-.4 1.091-.692c.339-.301.748-.562 1.05-.944c.33-.358.656-.734.909-1.162c.293-.408.492-.856.702-1.299c.19-.443.343-.896.468-1.336c.237-.882.343-1.72.384-2.437c.034-.718.014-1.315-.028-1.747a7 7 0 0 0-.063-.539m-11 0l-.025-.168l-.026.006A4.5 4.5 0 1 0 6.5 14c.223 0 .437-.034.65-.065c-.069.232-.14.468-.254.68c-.114.308-.292.575-.469.844c-.148.291-.409.488-.601.737c-.201.242-.475.403-.692.604c-.213.21-.492.315-.714.463c-.232.133-.434.28-.65.35l-.539.222c-.301.123-.473.195-.473.195l.484 1.939l.597-.144c.191-.048.424-.104.689-.171c.271-.05.56-.187.882-.312c.317-.143.686-.238 1.028-.467c.344-.218.741-.4 1.091-.692c.339-.301.748-.562 1.05-.944c.33-.358.656-.734.909-1.162c.293-.408.492-.856.702-1.299c.19-.443.343-.896.468-1.336c.237-.882.343-1.72.384-2.437c.034-.718.014-1.315-.028-1.747a8 8 0 0 0-.064-.537"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
