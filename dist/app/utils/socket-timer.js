"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTimer = void 0;
const startTimer = (durationSeconds, onTick, onEnd) => {
    let timeLeft = durationSeconds;
    onTick(timeLeft); // Initial tick
    const interval = setInterval(() => {
        timeLeft -= 1;
        onTick(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(interval);
            onEnd();
        }
    }, 1000);
    return interval;
};
exports.startTimer = startTimer;
