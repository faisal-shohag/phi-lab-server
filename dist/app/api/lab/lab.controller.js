"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foodController = exports.gitIssueController = exports.topFoodsController = exports.searchIssueController = exports.getIssueByIdController = exports.gitAllIssueController = void 0;
const git_issue_data_1 = require("./const/git-issue-data");
const food_data_1 = require("./const/food-data");
const gitAllIssueController = (req, res) => {
    return res.status(200).json({
        status: "success",
        message: "Issues fetched successfully",
        data: git_issue_data_1.gitIssues,
    });
};
exports.gitAllIssueController = gitAllIssueController;
const getIssueByIdController = (req, res) => {
    const { id } = req.params;
    const issue = git_issue_data_1.gitIssues.find((issue) => issue.id === Number(id));
    return res.status(200).json({
        status: "success",
        message: "Issue fetched successfully",
        data: issue,
    });
};
exports.getIssueByIdController = getIssueByIdController;
//search
//  searchTerm &&
//       !issue.title.toLowerCase().includes(searchTerm) &&
//       !issue.description.toLowerCase().includes(searchTerm)
//search issue
const searchIssueController = (req, res) => {
    var _a;
    let searchTerm = req.query.q;
    searchTerm = (_a = searchTerm === null || searchTerm === void 0 ? void 0 : searchTerm.toString()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const issues = git_issue_data_1.gitIssues.filter((issue) => {
        return (searchTerm &&
            (issue.title.toLowerCase().includes(searchTerm) ||
                issue.description.toLowerCase().includes(searchTerm)));
    });
    return res.status(200).json({
        status: "success",
        message: "Issues searched successfully",
        total: issues.length,
        data: issues,
    });
};
exports.searchIssueController = searchIssueController;
const topFoodsController = (req, res) => {
    return res.status(200).json({
        status: "success",
        message: "Issues fetched successfully",
        data: food_data_1.topFoods,
    });
};
exports.topFoodsController = topFoodsController;
exports.gitIssueController = {
    gitAllIssueController: exports.gitAllIssueController,
    getIssueByIdController: exports.getIssueByIdController,
    searchIssueController: exports.searchIssueController,
};
exports.foodController = {
    topFoodsController: exports.topFoodsController
};
