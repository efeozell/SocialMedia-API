import express from "express";
import {
  createComment,
  createReplyComment,
  updateComment,
  updateReplyComment,
  getCommentsForPost,
  deleteComment,
  likeComment,
  dislikeComment,
} from "../controllers/comment.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CommentInput:
 *       type: object
 *       description: Comment input data
 *       required:
 *         - postId
 *         - text
 *       properties:
 *         postId:
 *           type: string
 *           description: Yorumun ait olduğu post'un ID'si
 *           example: "60d21b4667d0d8992e610c85"
 *         text:
 *           type: string
 *           description: Yorumun içeriği
 *           maxLength: 256
 *           example: "Bu harika bir paylaşım!"
 *     CommentReplyInput:
 *       type: object
 *       description: Bir yoruma yanıt (reply) eklemek için kullanılır
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           description: Yanıt yorumun içeriği
 *           maxLength: 256
 *           example: "Bu bir yanıt yorumdur."
 *     CommentUpdateInput:
 *       type: object
 *       description: Comment update data
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           description: Güncellenmiş yorum içeriği
 *           maxLength: 256
 *           example: "Güncellenmiş yorum içeriği"
 *     Comment:
 *       type: object
 *       description: Yorum nesnesi
 *       properties:
 *         _id:
 *           type: string
 *           description: Yorumun ID'si
 *           example: "60d21b4667d0d8992e610c85"
 *         post:
 *           type: string
 *           description: Yorumun ait olduğu post'un ID'si
 *           example: "60d21b4667d0d8992e610c85"
 *         author:
 *           $ref: '#/components/schemas/UserBasicInfo'
 *         content:
 *           type: string
 *           description: Yorum içeriği
 *           example: "Harika bir paylaşım!"
 *         parentComment:
 *           type: string
 *           description: Eğer yorum bir yanıt ise, yanıtlanan yorumun ID'si
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Yorumun oluşturulma tarihi
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Yorumun son güncellenme tarihi
 *     CommentsResponse:
 *       type: object
 *       description: Post'un yorumları response
 *       properties:
 *         postId:
 *           type: string
 *           description: Post ID'si
 *           example: "60d21b4667d0d8992e610c85"
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               content:
 *                 type: string
 *                 example: "Harika bir paylaşım!"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *               authorDetails:
 *                 $ref: '#/components/schemas/UserBasicInfo'
 *               parentComment:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *         totalComments:
 *           type: integer
 *           description: Toplam yorum sayısı
 *           example: 25
 *         displayedComments:
 *           type: integer
 *           description: Görüntülenen yorum sayısı
 *           example: 25
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     commentIdInPath:
 *       in: path
 *       name: commentId
 *       required: true
 *       schema:
 *         type: string
 *         description: İşlem yapılacak olan ana yorumun ID'si
 *         example: "60d21b4667d0d8992e610c85"
 *     commentReplyIdInPath:
 *       in: path
 *       name: commentReplyId
 *       required: true
 *       schema:
 *         type: string
 *         description: İşlem yapılacak olan yanıt yorumun ID'si
 *         example: "60d21b4667d0d8992e610c86"
 *     postIdInPath:
 *       in: path
 *       name: postId
 *       required: true
 *       schema:
 *         type: string
 *         description: Yorumları alınacak post'un ID'si
 *         example: "60d21b4667d0d8992e610c85"
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Yorum ve işlemleri
 */

/**
 * @swagger
 * /comment/create:
 *   post:
 *     summary: Yeni bir yorum oluşturur
 *     description: Belirtilen post'a yeni bir yorum ekler. Kullanıcının post sahibini bloklamadığından emin olunur.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       201:
 *         description: Yorum başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *                 message:
 *                   type: string
 *                   example: "Comment created successfully"
 *       400:
 *         description: Geçersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Bu post'a yorum yapma izniniz yok
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /comment/create/reply/{commentId}:
 *   post:
 *     summary: Bir yoruma yanıt oluşturur
 *     description: Belirtilen yoruma yanıt ekler. Kullanıcının yorum sahibini bloklamadığından emin olunur.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/commentIdInPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentReplyInput'
 *     responses:
 *       201:
 *         description: Yanıt başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Geçersiz istek verisi
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Bu yoruma yanıt verme izniniz yok
 *       404:
 *         description: Yorum bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

/**
 * @swagger
 * /comment/update/{commentId}:
 *   put:
 *     summary: Bir yorumu günceller
 *     description: Kullanıcının kendi yorumunu günceller. Sadece yorum sahibi güncelleyebilir.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/commentIdInPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdateInput'
 *     responses:
 *       200:
 *         description: Yorum başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Geçersiz istek verisi
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece kendi yorumunuzu güncelleyebilirsiniz
 *       404:
 *         description: Yorum bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

/**
 * @swagger
 * /comment/update/reply/{commentReplyId}:
 *   put:
 *     summary: Bir yanıt yorumunu günceller
 *     description: Kullanıcının kendi yanıt yorumunu günceller. Sadece yanıt sahibi güncelleyebilir.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/commentReplyIdInPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdateInput'
 *     responses:
 *       200:
 *         description: Yanıt başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Geçersiz istek verisi
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece kendi yanıtınızı güncelleyebilirsiniz
 *       404:
 *         description: Yanıt bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

/**
 * @swagger
 * /comment/post/{postId}:
 *   get:
 *     summary: Post'un tüm yorumlarını getirir
 *     description: Belirtilen post'un tüm yorumlarını ve yanıtlarını getirir. Bloklanmış kullanıcıların yorumları gösterilmez.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/postIdInPath'
 *     responses:
 *       200:
 *         description: Yorumlar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CommentsResponse'
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Bu post'un yorumlarını görme izniniz yok
 *       404:
 *         description: Post bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

/**
 * @swagger
 * /comment/delete/{commentId}:
 *   delete:
 *     summary: Bir yorumu siler
 *     description: Kullanıcının kendi yorumunu siler. Yorumun yanıtları varsa onlar da silinir.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/commentIdInPath'
 *     responses:
 *       200:
 *         description: Yorum başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 message:
 *                   type: string
 *                   example: "Comment deleted successfully"
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece kendi yorumunuzu silebilirsiniz
 *       404:
 *         description: Yorum bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

/**
 * @swagger
 * /comment/like/{commentId}:
 *   post:
 *     summary: Bir yorumu beğenir
 *     description: Belirtilen yorumu beğenir. Herkes herhangi bir yorumu beğenebilir.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/commentIdInPath'
 *     responses:
 *       200:
 *         description: Yorum başarıyla beğenildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Comment liked successfully"
 *       400:
 *         description: Yorum zaten beğenilmiş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Yorum bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /comment/dislike/{commentId}:
 *   delete:
 *     summary: Bir yorumun beğenisini kaldırır
 *     description: Belirtilen yorumun beğenisini kaldırır. Sadece daha önce beğenilen yorumların beğenisi kaldırılabilir.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/commentIdInPath'
 *     responses:
 *       200:
 *         description: Yorumun beğenisi başarıyla kaldırıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Comment unliked successfully"
 *       400:
 *         description: Yorum zaten beğenilmemiş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Yorum bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

//Yorum oluştur
router.post("/create", protectRoute, createComment);

//Yoruma cevap ver
router.post("/create/reply/:commentId", protectRoute, createReplyComment);

//Yorumu düzenleme
router.put("/update/:commentId", protectRoute, updateComment);

//Yoruma atılan cevabı düzenleme
router.put("/update/reply/:commentReplyId", protectRoute, updateReplyComment);

//Post'un bütün yorumlarını getirme
router.get("/post/:postId", protectRoute, getCommentsForPost);

//Post'un ilgili yorumunu silme
router.delete("/delete/:commentId", protectRoute, deleteComment);

//Post'un ilgili yorumunu beğenme
router.post("/like/:commentId", protectRoute, likeComment);

//Post'un ilgili yorumunun beğenisini kaldırma
router.delete("/dislike/:commentId", protectRoute, dislikeComment);

export default router;
