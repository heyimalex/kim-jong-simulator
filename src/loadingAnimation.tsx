import * as React from "react";

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 1800;
const CHARS = Array.from("북한은 최고의 한국이다");
const CHAR_DELAY = 500;
const FONT_SIZE = 50;
const CHAR_WIDTH = 80;
const SPACE_WIDTH = 80;
const FULL_WIDTH = SPACE_WIDTH * 2 + CHAR_WIDTH * 10;
const START_DY = Math.floor((CANVAS_HEIGHT - CHAR_WIDTH) / 2);
const START_DX = Math.floor((CANVAS_WIDTH - FULL_WIDTH) / 2);

// Starts a little loading animation. You can start this up in
// useLayoutEffect; it returns a callback that will stop the animation.
export function loadingAnimation(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${FONT_SIZE}px sans-serif`;
    ctx.textAlign = "center";
    let initialTime = 0;
    let lastPaint = 0;
    let rafId = 0;
    const draw = (ts: number) => {
        if (initialTime === 0) {
            initialTime = ts;
        }

        //ctx.fillStyle = "blue";
        ctx.clearRect(START_DX, START_DY, FULL_WIDTH, CHAR_WIDTH + 100);

        // Get the currently highlighted index via relative time. There are 10
        // characters we cycle through, hence % 10.
        const index = Math.floor((ts - initialTime) / CHAR_DELAY) % 10;
        const dripMultiplier =
            Math.floor((ts - initialTime) % CHAR_DELAY) / 500;

        let dx = START_DX;
        let charIndex = 0;
        CHARS.forEach(char => {
            if (char === " ") {
                dx += SPACE_WIDTH;
                return;
            }
            if (charIndex === index) {
                ctx.fillStyle = "#fd665d";
                ctx.fillRect(
                    dx,
                    START_DY,
                    CHAR_WIDTH,
                    CHAR_WIDTH + 100 * dripMultiplier
                );
                ctx.fillStyle = "white";
            } else {
                ctx.fillStyle = "#fd665d";
            }
            ctx.fillText(
                char,
                dx + CHAR_WIDTH / 2,
                START_DY + CHAR_WIDTH * 0.8
            );

            charIndex += 1;
            dx += CHAR_WIDTH;
        });
        lastPaint = ts;
        rafId = window.requestAnimationFrame(draw);
    };
    rafId = window.requestAnimationFrame(draw);
    return () => {
        window.cancelAnimationFrame(rafId);
    };
}
