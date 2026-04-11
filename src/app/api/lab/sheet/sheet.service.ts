import { getSheetsClient } from "../../../config/google";
import { SheetValues } from "../../../interfaces/error.types";

const SPREADSHEET_ID = "1a9FGJDDE-PFMSxai6U1Ms0YX_nnEch0kGDEJaVEwTVU";

// ➕ Append Row
export const appendRow = async (range: string, values: SheetValues[]) => {
  const sheets = await getSheetsClient();

  return sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
};

// 📖 Get Rows
export const getRows = async (range: string) => {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  return res.data.values || [];
};

// ✏️ Update Row
export const updateRow = async (range: string, values: SheetValues[]) => {
  const sheets = await getSheetsClient();

  return sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
};


export const sheetsService  ={
    appendRow,
    getRows,
    updateRow
}