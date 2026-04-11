import { google } from "googleapis";

const decoded = Buffer.from(process.env.sheet_service_key as string, "base64").toString("utf8")
const key = JSON.parse(decoded)
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const getSheetsClient = async () => {
  const client:any = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: client,
  });
};