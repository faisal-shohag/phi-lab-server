"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.labRoute = void 0;
const express_1 = __importDefault(require("express"));
const lab_controller_1 = require("./lab.controller");
const router = express_1.default.Router();
router.get('/issues', lab_controller_1.gitIssueController.gitAllIssueController);
router.get('/issue/:id', lab_controller_1.gitIssueController.getIssueByIdController);
router.get('/issues/search', lab_controller_1.gitIssueController.searchIssueController);
exports.default = router;
exports.labRoute = router;
