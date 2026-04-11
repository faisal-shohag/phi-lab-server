import {google} from 'googleapis'
import { envVars } from './env';

const auth = new google.auth.GoogleAuth({
  keyFile: envVars.NODE_ENV === "development" ? "src\\app\\config\\spreadsheet.json" : "spreadsheet.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const getSheetsClient = async () => {
  const client:any = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: client,
  });
};
