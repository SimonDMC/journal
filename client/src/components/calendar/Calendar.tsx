import { useEffect, useState } from "react";
import "./Calendar.css";
import CalendarMonth from "./CalendarMonth";
import { flushSync } from "react-dom";

export default function Calendar(props: { entries: string[] }) {
    // Entirely copied from https://github.com/SimonDMC/bidirectional-scroll
    const [middleNum, setMiddleNum] = useState(0);

    // keeping the entire logic in a useEffect is "unreactful" but since it's entirely
    // implementation details that are irrelevant for any other component (apart from middleNum,
    // which is exposed) it makes sense for the sake of simplicity and eliminating the
    // performance overhead react hooks impose
    useEffect(() => {
        // how "hard" you have to swipe to glide to the next item
        const VELOCITY_THRESHOLD = 2.5;
        // speed of the glide animation
        const SNAP_SPEED = 0.15;

        const container = document.getElementById("calendar-wrapper")!;
        const item = document.getElementsByClassName("calendar-month")[0]!;
        const width = item.clientWidth;

        // initial scroll offset of the container -- twice the width since there's two
        // elements on each side of the middle one
        const BASE_OFFSET = width * 2;
        container.scrollLeft = BASE_OFFSET;

        // x position of current touch start, so we can calculate how much we've moved by
        let x = 0;
        // offset last frame, tracked since it cannot be recalculated on touchEnd
        let lastOffset = 0;
        // scroll offset already present before touching and moving the scroller, also used in
        // offset calculations
        let offset = 0;
        // middleNum, but tracked as a standard variable, since useEffect doesn't receive state
        // updates
        let internalMiddleNum = 0;
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

        function grabstart(grabX: number) {
            x = grabX;
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

        function grabmove(grabX: number) {
            // the velocity is the x-delta between the last two known touch positions
            velocity = lastOffset - (offset + grabX - x);
            lastOffset = offset + grabX - x;
            calculateOffset();
        }

        function grabend() {
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

        function animateSwipe() {
            // linear interpolation
            const glide = () => {
                lastOffset += (targetOffset - lastOffset) * SNAP_SPEED;

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
                    setMiddleNum(--internalMiddleNum);
                });
                offset -= width;
                lastOffset -= width;
                targetOffset -= width;
            } else if (lastOffset <= -width) {
                flushSync(() => {
                    setMiddleNum(++internalMiddleNum);
                });
                offset += width;
                lastOffset += width;
                targetOffset += width;
            }

            container.scrollLeft = BASE_OFFSET - lastOffset;
        }

        function scrollNext() {
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

        function scrollPrev() {
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
            grabstart(e.touches[0].clientX);
        }

        function touchmove(e: TouchEvent) {
            e.preventDefault();
            grabmove(e.touches[0].clientX);
        }

        function touchend(e: TouchEvent) {
            // ignore if it's not the last touch point
            if (e.touches.length > 0) return;
            grabend();
        }

        // touch listeners specifically have to be added via addEventListener, otherwise they're
        // not picked up on touchscreen laptops (???)
        container.addEventListener("touchstart", touchstart);
        container.addEventListener("touchmove", touchmove);
        container.addEventListener("touchend", touchend);

        /* document.getElementById("prev")!.onclick = scrollNext;
        document.getElementById("next")!.onclick = scrollPrev; */

        return () => {
            container.removeEventListener("touchstart", touchstart);
            container.removeEventListener("touchmove", touchmove);
            container.removeEventListener("touchend", touchend);
        };
    }, []);

    return (
        <div id="calendar-wrapper">
            <CalendarMonth monthIndex={middleNum - 2} entries={props.entries} />
            <CalendarMonth monthIndex={middleNum - 1} entries={props.entries} />
            <CalendarMonth monthIndex={middleNum} entries={props.entries} />
            <CalendarMonth monthIndex={middleNum + 1} entries={props.entries} />
            <CalendarMonth monthIndex={middleNum + 2} entries={props.entries} />
        </div>
    );
}
