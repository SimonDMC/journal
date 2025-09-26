import "./QuoteImage.css";
import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import parse from "html-react-parser";
import { DownloadIcon } from "../icons/DownloadIcon";
import { CopyIcon } from "../icons/CopyIcon";
import { CheckmarkIcon } from "../icons/CheckmarkIcon";
import { QuoteStartIcon } from "../icons/QuoteStartIcon";
import { QuoteEndIcon } from "../icons/QuoteEndIcon";
import { eventTarget, QuoteImageOpenEvent } from "../../util/events";
import { getRouteApi } from "@tanstack/react-router";
import { MONTH_NAMES } from "../../util/time";
import { AnimatePresence, motion } from "framer-motion";
import { getUserName } from "../../state/settings";

type QuoteImageParams = {
    content?: string;
    username?: string;
    date?: string;
};

const entryRoute = getRouteApi("/entry");

export default function QuoteImage(params: { open: boolean; setOpen: (open: boolean) => void }) {
    const [copying, setCopying] = useState(false);
    const [quoteData, setQuoteData] = useState({} as QuoteImageParams);
    const { date } = entryRoute.useSearch();

    useEffect(() => {
        const quoteImageOpenHandler = (e: Event) => {
            const { content } = (e as QuoteImageOpenEvent).detail;

            const year = parseInt(date!.substring(0, 4));
            const month = parseInt(date!.substring(5, 7));
            const day = parseInt(date!.substring(8, 10));

            setQuoteData({
                content,
                username: getUserName(),
                date: `${MONTH_NAMES[month - 1]} ${day}, ${year}`,
            });
        };
        eventTarget.addEventListener(QuoteImageOpenEvent.eventId, quoteImageOpenHandler);

        // remove listener on unmount
        return () => {
            eventTarget.removeEventListener(QuoteImageOpenEvent.eventId, quoteImageOpenHandler);
        };
    }, []);

    function closeImage(event: React.MouseEvent) {
        if (event.target !== event.currentTarget) return;
        params.setOpen(false);
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

                setCopying(true);
                setTimeout(() => setCopying(false), 2000);
            });
        });
    }

    return (
        <AnimatePresence>
            {params.open && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    id="quoteImageBg"
                    onClick={closeImage}
                >
                    <div className="quoteImageFrame">
                        <div className="quoteButtons">
                            <button onClick={downloadImage}>
                                <DownloadIcon />
                            </button>
                            <button onClick={copyImage}>{copying ? <CheckmarkIcon /> : <CopyIcon />}</button>
                        </div>
                        <div className="quoteImageBorder">
                            <div id="quoteImage">
                                <div className="quoteStartContainer">
                                    <QuoteStartIcon className="quoteStart" />
                                </div>
                                <div id="quoteText">{parse(quoteData.content ?? "")}</div>
                                <div className="quoteFooter">
                                    <div id="quoteCredit">– {quoteData.username}</div>
                                    <div id="quoteDate">{quoteData.date}</div>
                                </div>
                                <div className="quoteEndContainer">
                                    <QuoteEndIcon className="quoteEnd" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
