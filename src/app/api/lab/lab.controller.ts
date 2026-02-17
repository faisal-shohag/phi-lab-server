import { Request, Response } from "express";
import { gitIssues } from "./const/git-issue-data";

export const gitAllIssueController = (req:Request, res: Response) => {
    res.status(200).json(gitIssues)
}

export const getIssueByIdController = (req:Request, res: Response) => {
    const { id } = req.params
    const issue = gitIssues.find(issue => issue.id === Number(id))
    res.status(200).json(issue)
}




export const gitIssueController = {
    gitAllIssueController,
    getIssueByIdController
}