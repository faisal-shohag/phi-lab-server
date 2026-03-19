"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = require("./app/routes");
const global_error_handler_1 = require("./app/middlewares/global-error-handler");
const not_found_1 = __importDefault(require("./app/middlewares/not-found"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
// const corsOptions = {
//   origin: true,
//   credentials: true,
//   methods: ["GET","POST","PUT","DELETE","OPTIONS"],
//   allowedHeaders: ["Content-Type","Authorization"]
// }
// app.use(cors(corsOptions))
// app.options("*", cors(corsOptions))
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json());
app.use(express_1.default.json());
app.set("trust proxy", 1);
app.use(express_1.default.urlencoded({ extended: true }));
//["http://localhost:5173", "https://f-code.vercel.app", "https://fcode.online"]
app.use("/api/v1", routes_1.router);
app.get("/", (req, res) => {
    res.status(200).json({
        "🚀": "Welcome to Phi-Lab Server!"
    });
});
app.use(global_error_handler_1.globalErrorHandler);
app.use(not_found_1.default);
exports.default = app;
