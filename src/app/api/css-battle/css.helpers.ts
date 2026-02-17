import axios from "axios";

export async function loadPNGfromURL(url:string) {
  const response = await axios.get(url+'?orig=true', {
    responseType: "arraybuffer",
  });

  const imageBuffer = response.data;
  return Buffer.from(imageBuffer).toString("base64");

}


