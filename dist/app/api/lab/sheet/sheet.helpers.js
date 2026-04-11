"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSON = void 0;
const toJSON = (rows) => {
    const [header, ...data] = rows;
    return data.map((row) => header.reduce((acc, key, i) => {
        acc[key] = row[i];
        return acc;
    }, {}));
};
exports.toJSON = toJSON;
