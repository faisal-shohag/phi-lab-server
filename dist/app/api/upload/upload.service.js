"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadServices = exports.deleteImageFromCloudinary = exports.getImagesByFolder = exports.uploadProfileImageToCloudinary = exports.uploadImageToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const stream_1 = require("stream");
const cloudinary_build_url_1 = require("cloudinary-build-url");
const uploadImageToCloudinary = (_a) => __awaiter(void 0, [_a], void 0, function* ({ file, folder, }) {
    try {
        let uploadFile = file;
        // If file is a base64 data URL, convert it to a stream
        if (typeof file === 'string' && file.startsWith('data:image')) {
            const base64Data = file.split(',')[1]; // Extract base64 part after comma
            if (!base64Data) {
                throw new Error('Could not decode base64');
            }
            const buffer = Buffer.from(base64Data, 'base64');
            uploadFile = stream_1.Readable.from(buffer);
        }
        // Use upload_stream for stream/buffer uploads
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                folder,
                resource_type: 'image',
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload failed:', error);
                    reject(new Error('Image upload failed'));
                }
                else {
                    // console.log('Cloudinary upload result:', result);
                    resolve(Object.assign({}, result));
                }
            });
            // If uploadFile is a stream, pipe it; otherwise assume it's a file path
            if (typeof uploadFile === 'string') {
                // It's a file path - use the regular upload method
                cloudinary_1.default.uploader.upload(uploadFile, {
                    folder,
                    resource_type: 'image',
                }, (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload failed:', error);
                        reject(new Error('Image upload failed'));
                    }
                    else {
                        // console.log('Cloudinary upload result:', result);
                        resolve(Object.assign({}, result));
                    }
                });
            }
            else {
                // It's a stream - pipe it
                uploadFile.pipe(uploadStream);
            }
        });
    }
    catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new Error('Image upload failed');
    }
});
exports.uploadImageToCloudinary = uploadImageToCloudinary;
const uploadProfileImageToCloudinary = (_a) => __awaiter(void 0, [_a], void 0, function* ({ file, folder, previousImageURL, }) {
    try {
        let uploadFile = file;
        if (previousImageURL) {
            const public_id = (0, cloudinary_build_url_1.extractPublicId)(previousImageURL);
            yield cloudinary_1.default.uploader.destroy(public_id);
        }
        // If file is a base64 data URL, convert it to a stream
        if (typeof file === 'string' && file.startsWith('data:image')) {
            const base64Data = file.split(',')[1]; // Extract base64 part after comma
            if (!base64Data) {
                throw new Error('Could not decode base64');
            }
            const buffer = Buffer.from(base64Data, 'base64');
            uploadFile = stream_1.Readable.from(buffer);
        }
        // Use upload_stream for stream/buffer uploads
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                folder,
                resource_type: 'image',
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload failed:', error);
                    reject(new Error('Image upload failed'));
                }
                else {
                    // console.log('Cloudinary upload result:', result);
                    resolve(Object.assign({}, result));
                }
            });
            // If uploadFile is a stream, pipe it; otherwise assume it's a file path
            if (typeof uploadFile === 'string') {
                // It's a file path - use the regular upload method
                cloudinary_1.default.uploader.upload(uploadFile, {
                    folder,
                    resource_type: 'image',
                }, (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload failed:', error);
                        reject(new Error('Image upload failed'));
                    }
                    else {
                        // console.log('Cloudinary upload result:', result);
                        resolve(Object.assign({}, result));
                    }
                });
            }
            else {
                // It's a stream - pipe it
                uploadFile.pipe(uploadStream);
            }
        });
    }
    catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new Error('Image upload failed');
    }
});
exports.uploadProfileImageToCloudinary = uploadProfileImageToCloudinary;
const getImagesByFolder = (folder_1, ...args_1) => __awaiter(void 0, [folder_1, ...args_1], void 0, function* (folder, maxResults = 20) {
    try {
        const result = yield cloudinary_1.default.search
            .expression(`folder:${folder}`)
            .sort_by("created_at", "desc")
            .max_results(maxResults)
            .execute();
        return result.resources.map((img) => ({
            publicId: img.public_id,
            url: img.secure_url,
            width: img.width,
            height: img.height,
            format: img.format,
            createdAt: img.created_at,
        }));
    }
    catch (error) {
        console.error("Fetching images failed:", error);
        throw new Error("Failed to fetch images");
    }
});
exports.getImagesByFolder = getImagesByFolder;
const deleteImageFromCloudinary = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.default.uploader.destroy(publicId);
        if (result.result !== "ok") {
            throw new Error("Image not found or already deleted");
        }
        return true;
    }
    catch (error) {
        console.error("Cloudinary delete failed:", error);
        throw new Error("Failed to delete image");
    }
});
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
exports.UploadServices = {
    uploadImageToCloudinary: exports.uploadImageToCloudinary,
    getImagesByFolder: exports.getImagesByFolder,
    deleteImageFromCloudinary: exports.deleteImageFromCloudinary,
    uploadProfileImageToCloudinary: exports.uploadProfileImageToCloudinary
};
