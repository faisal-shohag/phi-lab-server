import { Request, Response } from "express";
import { gitIssues } from "./const/git-issue-data";
import { foods } from "./const/food-data";

export const gitAllIssueController = (req: Request, res: Response) => {
  return res.status(200).json({
    status: "success",
    message: "Issues fetched successfully",
    data: gitIssues,
  });
};

export const getIssueByIdController = (req: Request, res: Response) => {
  const { id } = req.params;
  const issue = gitIssues.find((issue) => issue.id === Number(id));
  return res.status(200).json({
    status: "success",
    message: "Issue fetched successfully",
    data: issue,
  });
};

//search
//  searchTerm &&
//       !issue.title.toLowerCase().includes(searchTerm) &&
//       !issue.description.toLowerCase().includes(searchTerm)

//search issue
export const searchIssueController = (req: Request, res: Response) => {
  let searchTerm = req.query.q;
  searchTerm = searchTerm?.toString()?.toLowerCase();
  const issues = gitIssues.filter((issue) => {
    return (
      searchTerm &&
      (issue.title.toLowerCase().includes(searchTerm as string) ||
        issue.description.toLowerCase().includes(searchTerm as string))
    );
  });

  return res.status(200).json({
    status: "success",
    message: "Issues searched successfully",
    total: issues.length,
    data: issues,
  });
};


export const topFoodsController = (req: Request, res: Response) => {
   return res.status(200).json({
    status: "success",
    message: "Issues fetched successfully",
    data: foods.slice(0, 4),
  });
}

export const singleFoodController = (req: Request, res: Response) =>{
    const { id } = req.params;
    const food = foods.find((food) => food.id === id)
    return res.status(200).json({
      status: "success",
      message: "Food fetched successfully",
      data: food,
    })
}

//all foods
export const allFoodController = (req: Request, res: Response) =>{
    return res.status(200).json({
      status: "success",
      message: "Foods fetched successfully",
      data: foods,
    })
}

export const gitIssueController = {
  gitAllIssueController,
  getIssueByIdController,
  searchIssueController,
  

};

export const foodController = {
  topFoodsController,
  singleFoodController,
  allFoodController
}
