import express from "express";
import { checkNotBlocked, checkNotFollowing, protectRoute } from "../middlewares/auth.middleware.js";
import {
  createPost,
  updatePost,
  getPostForFlow,
  getUserPosts,
  deletePost,
  likePost,
  dislikePost,
} from "../controllers/post.controller.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PostCreateInput:
 *       type: object
 *       description: Yeni bir post oluşturmak için gerekli veriler
 *       required:
 *         - header
 *       properties:
 *         header:
 *           type: string
 *           description: Post icerigi
 *           example: "Bu benim ilk postum!"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: Post ile ilgili resimlerin URL'leri
 *           example: ["http://example.com/image1.jpg", "http://example.com/image2.jpg"]
 *     PostUpdateInput:
 *       type: object
 *       description: Bir postu guncellemek icin gerekli veriler
 *       properties:
 *         header:
 *           type: string
 *           description: Guncellenmis post icerigi
 *           example: "Bu benim guncellenmis postum!"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: Guncellenmis post ile ilgili resimlerin URL'leri
 *           example: ["http://example.com/image1.jpg", "http://example.com/image2.jpg"]
 *     PostFeedItem:
 *       type: object
 *       description: Ana akışta ('/all') gösterilen, zenginleştirilmiş post modeli
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7b2f5c9e1f2a3b4c5d6e7"
 *         header:
 *           type: string
 *           example: "Bu benim ilk postum!"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         author:
 *           $ref: '#/components/schemas/UserBasicInfo'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-07-01T12:34:56.789Z"
 *         likeCount:
 *           type: integer
 *           description: Postun aldığı toplam beğeni sayısı
 *           example: 42
 *         commentCount:
 *           type: integer
 *           description: Postun aldığı toplam yorum sayısı
 *           example: 10
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     postIdInPath:
 *       in: path
 *       name: postId
 *       required: true
 *       schema:
 *         type: string
 *         description: Post'un benzersiz kimliği
 *         example: "64a7b2f5c9e1f2a3b4c5d6e7"
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post oluşturma, listeleme, beğenme ve silme işlemleri
 */

/**
 * @swagger
 * /post:
 *   post:
 *     summary: Yeni bir post olusturur
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostCreateInput'
 *     responses:
 *       201:
 *         description: Post basariyla olusturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostFeedItem'
 *       400:
 *         description: Gecersiz veri (header veya images eksik)
 *       401:
 *         description: Yetkisiz erisim
 *       500:
 *         description: Sunucu hatasi
 */
router.post("/", protectRoute, createPost);
/**
 * @swagger
 * /post/update/{postId}:
 *   put:
 *     summary: URL'den aldigi postun Idsini kullanarak ilgili postu gunceller
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/postIdInPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostUpdateInput'
 *     responses:
 *       201:
 *         description: Post basariyla guncellendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostFeedItem'
 *       400:
 *         description: Gecersiz veri (header veya images eksik)
 *       401:
 *         description: Yetkisiz erisim
 *       500:
 *         description: Sunucu hatasi
 */
router.put("/update/:postId", protectRoute, updatePost);
/**
 * @swagger
 * /post/all:
 *   get:
 *     summary: Ana akista kullanicinin takip ettigi kullanicilarin postlarini getirir
 *     tags: [Posts]
 *     description: |
 *       Giriş yapmış kullanıcının ana akışını (home feed) döndürür.
 *       Sadece kullanıcının kendisinin ve takip ettiği kişilerin postlarını içerir.
 *       Her post 'likeCount', 'commentCount', 'isLikedByCurrentUser' ve 'author' bilgileriyle zenginleştirilmiştir.
 *       (Bu, bizim 'getPostForFlow' için yazdığımız gelişmiş aggregate sorgusunun çıktısıdır)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ana akış postları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PostFeedItem'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get("/all", protectRoute, getPostForFlow); //Kullanicinin takip ettigi kullanicinin postlarini getirir Like ve Comment ile birlikte
/**
 * @swagger
 * /post/{userId}:
 *   get:
 *     summary: Belirli bir kullanıcının tüm postlarını getirir (Profil sayfası)
 *     tags: [Posts]
 *     description: |
 *       URL'den aldigi userId'ye sahip kullanicinin postlarini getirir
 *       Bu endpoint 'checkNotBlocked' ve 'checkNotFollowing' gibi ek kontrollere tabidir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdInPath'
 *     responses:
 *       200:
 *         description: Kullanicinin postlari basariyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PostFeedItem'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get("/:userId", protectRoute, checkNotBlocked, checkNotFollowing, getUserPosts);
/**
 * @swagger
 * /post/{postId}:
 *   delete:
 *     summary: Belirli bir postu siler
 *     tags: [Posts]
 *     description: |
 *       URL'den aldigi postId'ye sahip postu siler
 *       Bu endpoint 'checkNotBlocked' ve 'checkNotFollowing' gibi ek kontrollere tabidir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/postIdInPath'
 *     responses:
 *       200:
 *         description: Post başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Post Bulunamadi
 *       500:
 *         description: Sunucu hatası
 */
router.delete("/:postId", protectRoute, deletePost);

/**
 * @swagger
 * /post/like/{postId}:
 *   post:
 *     summary: Belirli bir postu beğenir
 *     tags: [Posts]
 *     description: |
 *       URL'den aldigi postId'ye sahip postu beğenir
 *       Bu endpoint 'checkNotBlocked' ve 'checkNotFollowing' gibi ek kontrollere tabidir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/postIdInPath'
 *     responses:
 *       200:
 *         description: Post başarıyla beğenildi
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Post Bulunamadi
 *       500:
 *         description: Sunucu hatası
 */
router.post("/like/:postId", protectRoute, likePost);
/**
 * @swagger
 * /post/dislike/{postId}:
 *   post:
 *     summary: Belirli bir postu beğenmekten vazgeçer
 *     tags: [Posts]
 *     description: |
 *       URL'den aldigi postId'ye sahip postu beğenmekten vazgeçer
 *       Bu endpoint 'checkNotBlocked' ve 'checkNotFollowing' gibi ek kontrollere tabidir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/postIdInPath'
 *     responses:
 *       200:
 *         description: Post başarıyla beğenmekten vazgeçildi
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Post Bulunamadi
 *       500:
 *         description: Sunucu hatası
 */
router.post("/dislike/:postId", protectRoute, dislikePost);
export default router;
