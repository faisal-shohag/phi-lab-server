import { PNG } from "pngjs";
import { calculateScore } from "../../utils/score-calculation";
import pixelmatchCustom from "../../helpers/pixelmatch";

export const compare = async (
  targetBase64: string,
  userBase64: string,
  length: number,
  maxScore: number,
  threshold = 0
) => {
  try {
    // const pixelmatch = (await import("pixelmatch")).default;
    // console.log(maxScore)
    const img1 = PNG.sync.read(Buffer.from(targetBase64, "base64"));
    const img2 = PNG.sync.read(Buffer.from(userBase64, "base64"));

    if (img1.width !== img2.width || img1.height !== img2.height) {
      return { error: "Image sizes mismatch" };
    }

    const diff = new PNG({ width: img1.width, height: img1.height });

    const mismatched = pixelmatchCustom(
      img1.data,
      img2.data,
      diff.data,
      img1.width,
      img1.height,
      { threshold }
    );

    const total = img1.width * img1.height;
    const accuracy = ((total - mismatched) / total) * 100;
    // if accuracy is 99.99 round it to 100%
    // if (accuracy >= 99.99) {
    //   accuracy = 100;
    // }
    const score: number = calculateScore(maxScore, accuracy, length);
    // console.log(total, accuracy, score)
    return {
      accuracy: Number(accuracy.toFixed(2)),
      mismatched,
      score,
      total,
      diffBase64: PNG.sync.write(diff).toString("base64"),
    };
  } catch (e: any) {
    // console.log(e.message);
    return { error: e.message };
  }
};


