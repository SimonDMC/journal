"use client";

import "./styles.css";
import { db } from "@/database/db";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, LinearScale, CategoryScale, PointElement, LineElement, Tooltip, ChartOptions, defaults } from "chart.js";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { enforceAuth, RouteType } from "@/util/auth";

Chart.register(LinearScale, CategoryScale, PointElement, LineElement, Tooltip);

defaults.borderColor = "#222";
defaults.color = "#ccc";
defaults.font.size = 13;
defaults.font.family = "Inter";

const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

function SearchPlotContent() {
    const [results, setResults] = useState<{ [key: string]: number }>({});
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        enforceAuth(router, RouteType.Authed);

        if (!searchParams.get("q")) {
            router.push("/overview");
            return;
        }

        const heading = document.getElementById("heading") as HTMLElement;
        heading.innerText = `Usage of “${searchParams.get("q")}” over time`;

        async function getData() {
            const startDate = (await db.entries.toArray())[0].date;
            const endYear = new Date().getFullYear();
            const endMonth = new Date().getMonth() + 1;

            const query = searchParams.get("q");

            const results: { [key: string]: number } = {};

            if (!query) return;

            let year = parseInt(startDate.substring(0, 4));
            let month = parseInt(startDate.substring(5, 7));
            while (year < endYear || (year == endYear && month <= endMonth)) {
                const key = `${MONTH_NAMES[month - 1]} ${year}`;

                // loop through days in the month
                // we can just assume it's 31 and ignore invalid (missing) days
                for (let day = 0; day <= 31; day++) {
                    const entry = await db.entries.get(`${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`);
                    if (!entry) continue;

                    let found = false;
                    for (const queryFragment of query.split(" OR ")) {
                        if (entry.content.match(new RegExp(queryFragment, "gi"))) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) continue;
                    if (results[key]) results[key] += 1;
                    else results[key] = 1;
                }

                if (!results[key]) results[key] = 0;

                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
            }

            setResults(results);

            console.log(results);
        }

        getData();

        const keydown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                router.back();
                event.preventDefault();
            }
        };
        document.addEventListener("keydown", keydown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
        };
    }, []);

    const options: ChartOptions<"line"> = {
        scales: {
            y: {
                title: {
                    display: true,
                    align: "center",
                    text: "Entries containing query",
                },
                min: 0,
                // prefer 30 scale but go to 31 if necessary
                max: Math.max(...Object.values(results)) < 31 ? 30 : 31,
            },
        },
        layout: {
            padding: 20,
        },
        plugins: {
            legend: {
                display: false,
            },
        },
    };

    const data = {
        labels: Object.keys(results),
        datasets: [
            {
                data: Object.values(results),
                label: "# of entries containing query",
                borderColor: "#36A2EB",
            },
        ],
    };

    return (
        <main className="plot">
            <div className="wrap">
                <p id="heading"></p>
                <div className="height-fix">
                    <Line options={options} data={data} />
                </div>
            </div>
            <Link href="/overview" className="back-arrow">
                <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
        </main>
    );
}

export default function SearchPlot() {
    return (
        <Suspense>
            <SearchPlotContent />
        </Suspense>
    );
}
