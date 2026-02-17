"use strict";
/**
 * Dhaka Time Utilities (GMT+6)
 * -----------------------------------------------------
 * All date operations adjusted to GMT+6.
 * Safe for streaks, OTPs, analytics, and Prisma timestamps.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dhakaParts = exports.isDhakaYesterday = exports.isDhakaToday = exports.dhakaSameDay = exports.dhakaToYMD = exports.dhakaDateToYMD = exports.addMinutesDhaka = exports.dhakaDateAddDays = exports.startOfDhakaDay = exports.nowDhaka = void 0;
/** Returns Date() shifted to GMT+6 */
const nowDhaka = () => {
    const nowUTC = Date.now();
    const offsetMs = 6 * 60 * 60 * 1000;
    return new Date(nowUTC + offsetMs);
};
exports.nowDhaka = nowDhaka;
/** Returns the start of Dhaka day (00:00:00) */
const startOfDhakaDay = (date = (0, exports.nowDhaka)()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.startOfDhakaDay = startOfDhakaDay;
/** Adds days to a Dhaka date */
const dhakaDateAddDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return (0, exports.startOfDhakaDay)(d);
};
exports.dhakaDateAddDays = dhakaDateAddDays;
const addMinutesDhaka = (minutes) => {
    const nowUTC = Date.now();
    const offsetMs = 6 * 60 * 60 * 1000;
    return new Date(nowUTC + offsetMs + minutes * 60 * 1000);
};
exports.addMinutesDhaka = addMinutesDhaka;
const dhakaDateToYMD = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10); // safe because it's already at 00:00 local
};
exports.dhakaDateToYMD = dhakaDateToYMD;
/** Convert a Dhaka date → YYYY-MM-DD */
const dhakaToYMD = (date) => {
    const d = (0, exports.startOfDhakaDay)(date);
    // Instead of ISO (UTC-based), extract real Dhaka components
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
exports.dhakaToYMD = dhakaToYMD;
/** Returns true if two Dhaka dates represent the same Dhaka day */
const dhakaSameDay = (a, b) => {
    return (0, exports.dhakaToYMD)(a) === (0, exports.dhakaToYMD)(b);
};
exports.dhakaSameDay = dhakaSameDay;
/** Returns true if a date is today in Dhaka */
const isDhakaToday = (date) => {
    return (0, exports.dhakaSameDay)(date, (0, exports.nowDhaka)());
};
exports.isDhakaToday = isDhakaToday;
/** Returns true if a date is yesterday in Dhaka */
const isDhakaYesterday = (date) => {
    const yesterday = (0, exports.dhakaDateAddDays)((0, exports.startOfDhakaDay)(), -1);
    return (0, exports.dhakaSameDay)(date, yesterday);
};
exports.isDhakaYesterday = isDhakaYesterday;
/** Returns an object with Dhaka date parts */
const dhakaParts = (date) => {
    const d = new Date(date);
    return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: d.getSeconds()
    };
};
exports.dhakaParts = dhakaParts;
