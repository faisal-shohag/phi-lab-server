import { v2 as cloudinary } from "cloudinary";
import { envVars } from "./env";

cloudinary.config({
  cloud_name: envVars.CLOUDINARY_NAME,
  api_key: envVars.CLOUDINARY_KEY,
  api_secret: envVars.CLOUDINARY_SECRET as string,
});

export default cloudinary;
