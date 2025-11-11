import express from "express";
import {
  getUserByUserId,
  getUser,
  updateUserProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchUsers,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Kullanici benzersiz ID'si
 *           example: 64a7b2f5c9e77a001f2d3c4b
 *         username:
 *           type: string
 *           description: Kullanici adi
 *           example: johndoe
 *         name:
 *           type: string
 *           description: Kullanici tam adi
 *           example: John Doe
 *       email:
 *         type: string
 *         format: email
 *         description: Kullanici email adresi
 *         example: efeozel@example.com
 *       profilePicture:
 *         type: string
 *         description: Kullanici profil resmi URL'si
 *         example: https://example.com/profiles/johndoe.jpg
 *       bio:
 *         type: string
 *         description: Kullanici biyografisi
 *         example: Merhaba, ben John Doe. Yazılım geliştiricisiyim.
 *         followersCount:
 *           type: integer
 *           description: Takipçi sayisi
 *           example: 100
 *         followingCount:
 *           type: integer
 *           description: Takip edilen sayisi
 *           example: 50
 *     UserUpdateInput:
 *       type: object
 *       description: Kullanici profil güncelleme verisi
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         bio:
 *           type: string
 *           example: Yazilim gelistirici ve blog yazari.
 *         email:
 *           type: string
 *           format: email
 *           example: efeozel@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: 12345678
 *         profilePicture:
 *           type: string
 *           format: uri
 *           example: https://example.com/profiles/janedoe.jpg
 *     UserBasicInfo:
 *       type: object
 *       description: Kullanici temel bilgileri
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a7b2f5c9e77a001f2d3c4b
 *         username:
 *           type: string
 *           example: johndoe
 *         name:
 *           type: string
 *           example: John Doe
 *         profilePicture:
 *           type: string
 *           format: uri
 *           example: https://example.com/profiles/johndoe.jpg
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: İşlem başarıyla tamamlandı.
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     userIdInPath:
 *       in: path
 *       name: userId
 *       required: true
 *       description: Kullanici ID'si
 *       schema:
 *         type: string
 *         description: Kullanici benzersiz ID'si
 *         example: 64a7b2f5c9e77a001f2d3c4b
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Kullanici islemleri
 */

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Giriş yapmış kullanıcının kendi profil bilgilerini getirir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı yanıt, kullanıcının profil bilgileri döner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get("/me", protectRoute, getUser);
/**
 * @swagger
 * /user/me:
 *   put:
 *     summary: Giriş yapmış kullanıcının kendi profil bilgilerini günceller
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: Başarılı yanıt, kullanıcının profil bilgileri döner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.put("/me", protectRoute, updateUserProfile);
/**
 * @swagger
 * /user/blocked-users:
 *   get:
 *     summary: Giriş yapmış kullanıcının engellediği kullanıcıları getirir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı yanıt, kullanıcının engellediği kullanıcıları döner
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserBasicInfo'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get("/blocked-users", protectRoute, getBlockedUsers);
/**
 * @swagger
 * /user/search:
 *   get:
 *     summary: Kullanıcıları arar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Arama sorgusu (kullanıcı adı veya isim)
 *         example: johndoe
 *     responses:
 *       200:
 *         description: Başarılı yanıt, arama sonuçlarını döner
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserBasicInfo'
 *       400:
 *         description: Geçersiz arama sorgusu (çok kısa veya çok uzun)
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */
router.get("/search", protectRoute, searchUsers);
/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     summary: Belirli bir kullanıcının profilini ID ile getirir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanici profili
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Geçersiz arama sorgusu (çok kısa veya çok uzun)
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       500:
 *         description: Sunucu hatası
 */
router.get("/:userId", protectRoute, getUserByUserId);

/**
 * @swagger
 * /user/follow/{userId}:
 *   post:
 *     summary: Belirli bir kullanıcıyı takip eder
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanici basariyla takip edildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Gecersiz istek Kullanici zaten takip ediliyor veya Takip edilemez
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post("/follow/:userId", protectRoute, followUser);
/**
 * @swagger
 * /user/unfollow/{userId}:
 *   post:
 *     summary: Belirli bir kullanıcıyı takipten çıkarır
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanici basariyla takipten cikarildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Gecersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post("/unfollow/:userId", protectRoute, unfollowUser);
/**
 * @swagger
 * /user/block/{userId}:
 *   post:
 *     summary: Belirli bir kullanıcıyı engeller
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanici basariyla engellendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Gecersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post("/block/:userId", protectRoute, blockUser);
/**
 * @swagger
 * /user/unblock/{userId}:
 *   post:
 *     summary: Belirli bir kullanıcıyı engellemeyi kaldırır
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanici basariyla engellemeyi kaldırdı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Gecersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim engellendi
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post("/unblock/:userId", protectRoute, unblockUser);

export default router;
