const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require('path');
const crypto = require('crypto');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Service to handle AWS S3 operations
 */
const s3Service = {
    /**
     * Upload an image to S3
     * @param {Object} file - The file object from multer
     * @returns {Promise<string>} - The public URL of the uploaded image
     */
    uploadImage: async (file) => {
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
            const folderPath = process.env.S3_PROFILE_IMAGE_FOLDER || 'profile-images';
            const key = `${folderPath}/${fileName}`;

            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            await s3Client.send(new PutObjectCommand(params));

            // Construct the public URL
            // Format: https://bucket-name.s3.region.amazonaws.com/key
            return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new Error('Failed to upload image ');
        }
    },

    /**
     * Delete an image from S3
     * @param {string} imageUrl - The full URL of the image
     */
    deleteImage: async (imageUrl) => {
        try {
            if (!imageUrl) return;

            // Extract the key from the URL
            const urlParts = imageUrl.split('.amazonaws.com/');
            if (urlParts.length < 2) return;
            
            const key = urlParts[1];

            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
            };

            await s3Client.send(new DeleteObjectCommand(params));
        } catch (error) {
            console.error('S3 Delete Error:', error);
            // We don't necessarily want to throw here as it might be a cleanup after a failure
        }
    }
};

module.exports = s3Service;
