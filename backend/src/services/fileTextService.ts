import "multer";

const MAX_INLINE_FILE_SIZE = 20 * 1024 * 1024;

export interface FileData {
  base64: string;
  mimeType: string;
  fileName: string;
  isLarge: boolean;
}

export const extractFileData = async (file?: Express.Multer.File): Promise<FileData | undefined> => {
  if (!file) {
    return undefined;
  }

  const mimeType = file.mimetype === "application/pdf" ? "application/pdf" : "text/plain";
  const isLarge = file.size > MAX_INLINE_FILE_SIZE;

  if (!file.mimetype.startsWith("text/") && file.mimetype !== "application/pdf" && !file.originalname.endsWith(".txt")) {
    throw new Error("Only PDF and text files are supported");
  }

  const base64 = file.buffer.toString("base64");

  return {
    base64,
    mimeType,
    fileName: file.originalname,
    isLarge
  };
};
