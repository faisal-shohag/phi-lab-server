import {google} from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: "src\\app\\config\\spreadsheet.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const getSheetsClient = async () => {
  const client:any = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: client,
  });
};
