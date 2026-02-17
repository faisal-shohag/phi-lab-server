"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitIssueController = exports.getIssueByIdController = exports.gitAllIssueController = void 0;
const git_issue_data_1 = require("./const/git-issue-data");
const gitAllIssueController = (req, res) => {
    res.status(200).json(git_issue_data_1.gitIssues);
};
exports.gitAllIssueController = gitAllIssueController;
const getIssueByIdController = (req, res) => {
    const { id } = req.params;
    const issue = git_issue_data_1.gitIssues.find(issue => issue.id === Number(id));
    res.status(200).json(issue);
};
exports.getIssueByIdController = getIssueByIdController;
exports.gitIssueController = {
    gitAllIssueController: exports.gitAllIssueController,
    getIssueByIdController: exports.getIssueByIdController
};
