import { PNG } from "pngjs";
import { calculateScore } from "../../utils/score-calculation";
import pixelmatchCustom from "../../helpers/pixelmatch";

export const compare = async (
  targetBase64: string,
  userBase64: string,
  length?: number,
  maxScore?: number,
  threshold = 0,
) => {
  try {
    // const pixelmatch = (await import("pixelmatch")).default;
    // console.log(maxScore)
    const img1 = PNG.sync.read(Buffer.from(targetBase64, "base64"));
    const img2 = PNG.sync.read(Buffer.from(userBase64, "base64"));

    // if (img1.width !== img2.width || img1.height !== img2.height) {
    //   return { error: "Image sizes mismatch" };
    // }

    const diff = new PNG({ width: img2.width, height: img2.height });

    const mismatched = pixelmatchCustom(
      img1.data,
      img2.data,
      diff.data,
      img2.width,
      img2.height,
      { threshold },
    );

    // const mismatched = comparePng(
    //   img1.data,
    //   img2.data,
    // )

    

    const total = img1.width * img1.height;
    const accuracy = ((total - mismatched) / total) * 100;
    // if accuracy is 99.99 round it to 100%
    // if (accuracy >= 99.99) {
    //   accuracy = 100;
    // }

    let score = 0;
    if (length && maxScore) {
      score = calculateScore(maxScore, accuracy, length);
    }
    // console.log(total, accuracy, score)
    return {
      accuracy: Number(accuracy.toFixed(2)),
      mismatched,
      score,
      total,
      diffBase64: PNG.sync.write(diff).toString("base64"),
      imageSizes: {
        ref: {
          height: img1.height,
          width: img1.width,
        },
        user: {
          height: img2.height,
          width: img2.width,
        },
      },
    };
  } catch (e: any) {
    // console.log(e.message);
    const img1 = PNG.sync.read(Buffer.from(targetBase64, "base64"));
    const img2 = PNG.sync.read(Buffer.from(userBase64, "base64"));
    return {
      error: e.message,
      imageSizes: {
        ref: {
          height: img1.height,
          width: img1.width,
        },
        user: {
          height: img2.height,
          width: img2.width,
        },
      },
    };
  }
};
