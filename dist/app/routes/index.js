"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const execution_route_1 = require("../api/execution/execution.route");
const auth_route_1 = require("../api/auth/auth.route");
const user_route_1 = require("../api/user/user.route");
const css_route_1 = require("../api/css-battle/css.route");
const leaderboard_route_1 = require("../api/css-battle-leaderboards/leaderboard.route");
const css_creation_route_1 = require("../api/css-battle-creation/css-creation.route");
const problem_route_1 = require("../api/problems/problem.route");
const js_series_route_1 = require("../api/js-series/js-series.route");
const upload_route_1 = require("../api/upload/upload.route");
const ai_route_1 = require("../api/gen-ai/ai.route");
const lab_route_1 = require("../api/lab/lab.route");
const checker_route_1 = require("../api/checker/checker.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/compiler",
        route: execution_route_1.executionRoute
    },
    {
        path: "/auth",
        route: auth_route_1.authRoutes
    },
    {
        path: "/user",
        route: user_route_1.userRoutes
    },
    {
        path: '/css',
        route: css_route_1.cssRoutes
    },
    {
        path: '/leaderboard',
        route: leaderboard_route_1.leaderboardRoutes,
    },
    {
        path: '/admin',
        route: css_creation_route_1.CssCreationRoute,
    },
    {
        path: '/js',
        route: problem_route_1.problemRoutes,
    },
    {
        path: '/js-series',
        route: js_series_route_1.jsSeriesRoutes
    },
    {
        path: '/upload',
        route: upload_route_1.uploadRoutes
    },
    {
        path: '/ai',
        route: ai_route_1.aiRoutes
    },
    {
        path: '/lab',
        route: lab_route_1.labRoute
    },
    {
        path: '/checker',
        route: checker_route_1.checkerRoute
    }
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
