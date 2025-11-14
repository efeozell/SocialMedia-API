import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createStory, getAllStories, getUserStories, deleteStoryById } from "../controllers/story.controller.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StoryCreateInput:
 *       type: object
 *       description: Yeni bir story oluşturmak için gerekli veriler
 *       required:
 *         - image
 *       properties:
 *         image:
 *           type: string
 *           format: uri
 *           description: Story resmi, videosu URLS'i
 *           example: "http://example.com/story-image.jpg"
 *         text:
 *           type: string
 *           description: Story metni
 *           example: "Bu benim ilk story'im!"
 *     StoryResponse:
 *       type: object
 *       description: Oluşturulan story'nin detayları
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7b2f5c9e1f2a3b4c5d6e7"
 *           author:
 *             $ref: '#/components/schemas/UserBasicInfo'
 *         image:
 *           type: string
 *           format: uri
 *           example: "http://example.com/story-image.jpg"
 *         content:
 *           type: string
 *           example: "Gunun ani!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Story oluşturulma tarihi
 *           example: "2024-07-01T12:34:56.789Z"
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     storyIdInPath:
 *       in: path
 *       name: storyId
 *       required: true
 *       schema:
 *         type: string
 *         description: Story'nin benzersiz kimligi
 *         example: "64a7b2f5c9e1f2a3b4c5d6e7"
 */

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Story işlemleri
 */

/**
 * @swagger
 * /story/create:
 *   post:
 *     summary: Yeni bir story (hikaye) olusturur
 *     tags: [Stories]
 *     description: Kullanicinin yeni bir story olusturmasini saglar.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryCreateInput'
 *     responses:
 *       201:
 *         description: Story basariyla olusturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *       403:
 *         description: Yetkisiz erişim
 */

/**
 * @swagger
 * /story/all:
 *   get:
 *     summary: Takip edilen kullanicilarin ve kendimizin storylerini getirir
 *     tags: [Stories]
 *     description: Kullanicinin takip ettigi kullanicilarin ve kendisinin storysini getirir
 *     responses:
 *       200:
 *         description: Storyler basariyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/StoryResponse'
 *       404:
 *         description: Story bulunamadi
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatasi
 */

/**
 * @swagger
 * /story/user/{userId}:
 *   get:
 *     summary: Belirli bir kullanicinin storylerini getirir (24 saat icinde olanlari)
 *     tags: [Stories]
 *     description: Bir kullanicinin profil sayfasinda gosterilecek, son 24 saat icinde olusturulmus aktif hikayeleri listeler
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanicinin storyleri basariyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoryResponse'
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       404:
 *        description: Kullanıcı veya story bulunamadı
 */

/**
 * @swagger
 * /story/delete/{storyId}:
 *   delete:
 *     summary: Belirli bir kullanicinin story'sini siler
 *     tags: [Stories]
 *     description: Bir kullanicinin kendi story'sini silmesini saglar
 *     parameters:
 *       - $ref: '#/components/parameters/storyIdInPath'
 *     responses:
 *       200:
 *         description: Kullanicinin story'si basariyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoryResponse'
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       404:
 *        description: Kullanıcı veya story bulunamadı
 */
router.post("/create", protectRoute, createStory);

router.get("/all", protectRoute, getAllStories);

router.get("/user/:userId", protectRoute, getUserStories);

router.delete("/delete/:storyId", protectRoute, deleteStoryById);

export default router;
