import { useEffect, useState } from "react";
import "./Calendar.css";
import CalendarMonth from "./CalendarMonth";
import { flushSync } from "react-dom";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { adjustTime, dayAdjustedTime, getDaysOfMonth, getMonthOffset, moveLeft, moveRight, today } from "../../util/time";
import { useNavigate } from "@tanstack/react-router";

export default function Calendar(props: { entries: string[] }) {
    // Entirely copied from https://github.com/SimonDMC/bidirectional-scroll
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState(today);
    const navigate = useNavigate();

    // keeping the entire logic in a useEffect is "unreactful" but since it's entirely
    // implementation details that are irrelevant for any other component (apart from monthOffset
    // and selectedDay, which are exposed) it makes sense for the sake of simplicity and eliminating
    // the performance overhead react hooks impose
    useEffect(() => {
        // how "hard" you have to swipe to glide to the next item
        const VELOCITY_THRESHOLD = 2.5;
        // speed of the glide animation
        const SNAP_SPEED = 0.015;

        const container = document.getElementById("calendar-wrapper")!;
        const item = document.getElementsByClassName("calendar-month")[0] as HTMLElement;
        let width = item.clientWidth;

        // initial scroll offset of the container -- twice the width since there's two
        // elements on each side of the middle one
        let BASE_OFFSET = width * 2;
        container.scrollLeft = BASE_OFFSET;

        // x position of current touch start, so we can calculate how much we've moved by
        let x = 0;
        // offset last frame, tracked since it cannot be recalculated on touchEnd
        let lastOffset = 0;
        // scroll offset already present before touching and moving the scroller, also used in
        // offset calculations
        let offset = 0;
        // useState variables, which don't receive state updates because of useEffect
        let internalMonthOffset = 0;
        let internalSelectedDay = today;
        // velocity with which the last swipe was released
        let velocity = 0;
        // currently ongoing animation frame id, used to cancel when another swipe is initiated
        // during the glide
        let animationFrameId: number | null = null;
        // whether the container was grabbed before finishing the last animation, and if so,
        // in which direction; tracked since elements haven't been moved over yet, and as such,
        // swiping in the opposite direction would cause it to move over by two
        let grabIndex = 0;
        // the scroll offset we are animating to
        let targetOffset = 0;

        // figure out approximate delta time over 300ms of measurement
        let deltaTime = 1000 / 60;
        let frames = 0;
        let measureFrameId = 0;
        function measureDelta() {
            frames++;
            measureFrameId = requestAnimationFrame(measureDelta);
        }
        measureFrameId = requestAnimationFrame(measureDelta);
        setTimeout(() => {
            cancelAnimationFrame(measureFrameId);
            deltaTime = 300 / frames;
        }, 300);

        // select the month and day that we had selected before
        const retrievedMonthIndex = sessionStorage.getItem("journal-month");
        if (retrievedMonthIndex) {
            setMonthOffset(parseInt(retrievedMonthIndex));
            internalMonthOffset = parseInt(retrievedMonthIndex);
        }
        const retrievedSelectedDay = sessionStorage.getItem("journal-cursor");
        if (retrievedSelectedDay) {
            setSelectedDay(retrievedSelectedDay);
            internalSelectedDay = retrievedSelectedDay;
        }

        function animateSwipe() {
            // linear interpolation
            const glide = () => {
                lastOffset += (targetOffset - lastOffset) * SNAP_SPEED * deltaTime;

                // snap and stop when <0.5px away
                if (Math.abs(targetOffset - lastOffset) < 0.5) {
                    lastOffset = targetOffset;
                    calculateOffset();
                    offset = lastOffset;
                    animationFrameId = null;
                    return;
                }

                calculateOffset();
                offset = lastOffset;
                animationFrameId = requestAnimationFrame(glide);
            };

            glide();
        }

        function calculateOffset() {
            // if we crossed over the full width of the element in either direction, invisibly
            // reset scroll position and shift over the elements
            if (lastOffset >= width) {
                flushSync(() => {
                    setMonthOffset(--internalMonthOffset);
                    sessionStorage.setItem("journal-month", internalMonthOffset.toString());
                });
                offset -= width;
                lastOffset -= width;
                targetOffset -= width;
            } else if (lastOffset <= -width) {
                flushSync(() => {
                    setMonthOffset(++internalMonthOffset);
                    sessionStorage.setItem("journal-month", internalMonthOffset.toString());
                });
                offset += width;
                lastOffset += width;
                targetOffset += width;
            }

            container.scrollLeft = BASE_OFFSET - lastOffset;
        }

        function scrollPrev() {
            // if arrow is clicked while a swipe animation is already happening, cancel it
            // and start a new one
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                targetOffset += width;
            } else {
                targetOffset = width;
            }
            animateSwipe();
        }

        function scrollNext() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                targetOffset -= width;
            } else {
                targetOffset = -width;
            }
            animateSwipe();
        }

        container.onwheel = (e: WheelEvent) => {
            e.preventDefault();
        };

        function touchstart(e: TouchEvent) {
            // ignore if it's not the first touch point
            if (e.touches.length > 1) return;
            x = e.touches[0].clientX;
            // cancel gliding if we grab before animation finishes
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            // detect grabbing swiper before glide is finished (before elements shift over)
            // if we don't do this, swiping in one direction and then swiping back causes it to
            // skip over an element, as we still have the old one selected
            if (lastOffset > width / 2) {
                grabIndex = -1;
            } else if (lastOffset < -width / 2) {
                grabIndex = 1;
            } else {
                grabIndex = 0;
            }
        }

        function touchmove(e: TouchEvent) {
            e.preventDefault();
            // the velocity is the x-delta between the last two known touch positions
            velocity = lastOffset - (offset + e.touches[0].clientX - x);
            lastOffset = offset + e.touches[0].clientX - x;
            calculateOffset();
        }

        function touchend(e: TouchEvent) {
            // ignore if it's not the last touch point
            if (e.touches.length > 0) return;
            // ignore if we didn't move at all
            if (lastOffset == 0) return;
            offset = lastOffset;

            targetOffset = 0;
            // if we're over the edge or swiped with enough velocity (and not in the middle
            // of the opposite swipe), clear the gap
            const isFlickBack = velocity < -VELOCITY_THRESHOLD;
            const isFlickForward = velocity > VELOCITY_THRESHOLD;

            const isDraggedBack = lastOffset > width / 2 && !isFlickForward;
            const isDraggedForward = lastOffset < -width / 2 && !isFlickBack;

            const canGoBack = grabIndex !== 1;
            const canGoForward = grabIndex !== -1;

            if ((isFlickBack || isDraggedBack) && canGoBack) {
                targetOffset = width;
            } else if ((isFlickForward || isDraggedForward) && canGoForward) {
                targetOffset = -width;
            }

            animateSwipe();
        }

        function resize() {
            // snap to middle when window is resized
            width = item.clientWidth;
            BASE_OFFSET = width * 2;
            container.scrollLeft = BASE_OFFSET;
        }

        // keep track of which day we're *trying* to get to via big jumps; e.g. if navigating from
        // march 31 to feb, we have to select 28/29 but remember that if we then jump to jan, we
        // go to jan 31
        let intendedDay = parseInt(internalSelectedDay.substring(8, 10));
        function keydown(e: KeyboardEvent) {
            if (e.key == "Enter") {
                navigate({ to: "/entry", search: { date: internalSelectedDay } });
                return;
            }

            // navigate calendar
            const year = parseInt(internalSelectedDay.substring(0, 4));
            const month = parseInt(internalSelectedDay.substring(5, 7));

            let newDate;
            if (e.key == "ArrowLeft") {
                if (e.ctrlKey) {
                    newDate = adjustTime(new Date(year - 1, month - 1, Math.min(intendedDay, getDaysOfMonth(year - 1, month - 1))));
                } else if (e.shiftKey) {
                    newDate = adjustTime(new Date(year, month - 2, Math.min(intendedDay, getDaysOfMonth(year, month - 2))));
                } else {
                    newDate = moveLeft(internalSelectedDay);
                    intendedDay = newDate.getUTCDate();
                }
            } else if (e.key == "ArrowRight") {
                if (e.ctrlKey) {
                    newDate = adjustTime(new Date(year + 1, month - 1, Math.min(intendedDay, getDaysOfMonth(year + 1, month - 1))));
                } else if (e.shiftKey) {
                    newDate = adjustTime(new Date(year, month, Math.min(intendedDay, getDaysOfMonth(year, month))));
                } else {
                    newDate = moveRight(internalSelectedDay);
                    intendedDay = newDate.getUTCDate();
                }
            } else if (e.key == "ArrowUp") {
                newDate = new Date(new Date(internalSelectedDay).getTime() - 7 * 24 * 60 * 60 * 1000);
                intendedDay = newDate.getUTCDate();
            } else if (e.key == "ArrowDown") {
                newDate = new Date(new Date(internalSelectedDay).getTime() + 7 * 24 * 60 * 60 * 1000);
                intendedDay = newDate.getUTCDate();
            } else return;

            internalSelectedDay = newDate.toISOString().substring(0, 10);
            setSelectedDay(internalSelectedDay);
            sessionStorage.setItem("journal-cursor", internalSelectedDay);

            const newMonthIndex = newDate.getUTCFullYear() * 12 + newDate.getUTCMonth();
            const shownMonthIndex = dayAdjustedTime.getUTCFullYear() * 12 + dayAdjustedTime.getUTCMonth() + internalMonthOffset;
            const monthDelta = newMonthIndex - shownMonthIndex;

            if (monthDelta != 0) {
                targetOffset = width * -monthDelta;
                animateSwipe();
            }
        }

        // touch listeners specifically have to be added via addEventListener, otherwise they're
        // not picked up on touchscreen laptops (???)
        container.addEventListener("touchstart", touchstart);
        container.addEventListener("touchmove", touchmove);
        container.addEventListener("touchend", touchend);
        container.addEventListener("touchcancel", touchend);
        window.addEventListener("resize", resize);
        document.addEventListener("keydown", keydown);

        document.getElementById("calendar-prev")!.onclick = scrollPrev;
        document.getElementById("calendar-next")!.onclick = scrollNext;

        return () => {
            container.removeEventListener("touchstart", touchstart);
            container.removeEventListener("touchmove", touchmove);
            container.removeEventListener("touchend", touchend);
            container.removeEventListener("touchcancel", touchend);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <div className="calendar">
            <div className="calendar-overlay">
                <div className="top-bar">
                    <div className="inner">
                        <button className="arrow" id="calendar-prev">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <button className="arrow" id="calendar-next">
                            <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                    </div>
                </div>
                <div className="week-days">
                    <div className="inner">
                        <span>M</span>
                        <span>T</span>
                        <span>W</span>
                        <span>T</span>
                        <span>F</span>
                        <span>S</span>
                        <span>S</span>
                    </div>
                </div>
            </div>
            <div id="calendar-wrapper">
                <CalendarMonth monthIndex={monthOffset - 2} entries={props.entries} selectedDay={selectedDay} />
                <CalendarMonth monthIndex={monthOffset - 1} entries={props.entries} selectedDay={selectedDay} />
                <CalendarMonth monthIndex={monthOffset} entries={props.entries} selectedDay={selectedDay} />
                <CalendarMonth monthIndex={monthOffset + 1} entries={props.entries} selectedDay={selectedDay} />
                <CalendarMonth monthIndex={monthOffset + 2} entries={props.entries} selectedDay={selectedDay} />
            </div>
        </div>
    );
}
