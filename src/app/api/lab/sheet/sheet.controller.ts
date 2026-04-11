import { Request, Response } from "express";
import { sheetsService } from "./sheet.service";


// POST
export const addData = async (req: Request, res: Response) => {
  try {
    const { values } = req.body;

    const response = await sheetsService.appendRow("Sheet1!A:Z", values);

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET
export const getData = async (_req: Request, res: Response) => {
  try {
    const data = await sheetsService.getRows("Sheet1!A:Z");

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT
export const updateData = async (req: Request, res: Response) => {
  try {
    const { range, values } = req.body;

    const response = await sheetsService.updateRow(range, values);

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sheetsController = {
    addData,
    getData,
    updateData
}