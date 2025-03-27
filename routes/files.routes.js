const express = require('express');
const router = express.Router();
const {
  getAllFiles,
  getFileById,
  uploadFileMetadata,
  deleteFile
} = require('../controllers/files.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File metadata handling (for uploads)
 */

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get all uploaded files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of file metadata
 */
router.get('/', verifyToken, getAllFiles);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file metadata by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File metadata
 */
router.get('/:id', verifyToken, getFileById);

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [file_url, file_type, tenant_id, uploaded_by]
 *             properties:
 *               file_url: { type: string, example: "https://your-bucket.s3.wasabisys.com/file.pdf" }
 *               file_type: { type: string, example: "certificate" }
 *               tenant_id: { type: string }
 *               linked_yarn_id: { type: string }
 *               uploaded_by: { type: string }
 *     responses:
 *       201:
 *         description: Metadata saved
 */
router.post('/', verifyToken, uploadFileMetadata);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Metadata deleted
 */
router.delete('/:id', verifyToken, deleteFile);

module.exports = router;