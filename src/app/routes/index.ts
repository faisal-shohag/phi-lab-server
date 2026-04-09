import { Router } from "express"
import { executionRoute } from "../api/execution/execution.route"
import { authRoutes } from "../api/auth/auth.route"
import { userRoutes } from "../api/user/user.route"
import { cssRoutes } from "../api/css-battle/css.route"
import { leaderboardRoutes } from "../api/css-battle-leaderboards/leaderboard.route"
import { CssCreationRoute } from "../api/css-battle-creation/css-creation.route"
import { problemRoutes } from "../api/problems/problem.route"
import { jsSeriesRoutes } from "../api/js-series/js-series.route"
import { uploadRoutes } from "../api/upload/upload.route"
import { aiRoutes } from "../api/gen-ai/ai.route"
import { labRoute } from "../api/lab/lab.route"
import { checkerRoute } from "../api/checker/checker.route"

export const router = Router()

const moduleRoutes = [
    {
        path: "/compiler",
        route: executionRoute
    },
    {
        path: "/auth",
        route: authRoutes
    },
    {
        path: "/user",
        route: userRoutes
    },
    {
        path: '/css',
        route: cssRoutes
    },
    {
        path: '/leaderboard',
        route: leaderboardRoutes,
    },
    {
        path: '/admin',
        route: CssCreationRoute,
    },
    {
        path: '/js',
        route: problemRoutes,
    },
    {
        path: '/js-series',
        route: jsSeriesRoutes
    },
    {
        path: '/upload',
        route: uploadRoutes
    },
    {
        path: '/ai',
        route: aiRoutes
    },
    {
        path: '/lab',
        route: labRoute
    },
    {
        path: '/checker',
        route: checkerRoute
    }
    
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})