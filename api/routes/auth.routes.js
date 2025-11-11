import express from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
  verifyEmail,
  enable2fa,
  verify2fa,
  forgotPassword,
} from "../controllers/auth.controller.js";
import { signupValidator, loginValidator } from "../validators/auth.validator.js";
import { protectRoute, checkEmailVerified } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSignupInput:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Adi
 *         username:
 *           type: string
 *           description: Kullanici Adi
 *           example: efeozel
 *         email:
 *           type: string
 *           description: Kullanici Email Adresi
 *           example: efeozel@example.com
 *         password:
 *           type: string
 *           description: Kullanici Sifresi
 *           example: 123456
 *         passwordConfirm:
 *           type: string
 *           description: Sifre Tekrari
 *           example: 123456
 *     UserLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Kullanici Email Adresi
 *           example: efeozel@example.com
 *         password:
 *           type: string
 *           description: Kullanici Sifresi
 *           example: 123456
 *     twoFactorCodeInput:
 *       type: object
 *       required:
 *         - userId
 *         - twoFactorCode
 *       properties:
 *         userId:
 *           type: string
 *           description: Kullanici ID'si
 *           example: 60d0fe4f5311236168a109ca
 *         twoFactorCode:
 *           type: string
 *           description: Iki Faktorlu Dogrulama Kodu
 *           example: "123456"
 *     forgotPasswordInput:
 *       type: object
 *       required:
 *         - password
 *         - passwordConfirm
 *       properties:
 *         password:
 *           type: string
 *           description: Yeni Sifre
 *           example: newpassword123
 *         passwordConfirm:
 *           type: string
 *           description: Yeni Sifre Tekrari
 *           example: newpassword123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: 60d0fe4f5311236168a109ca
 *             username:
 *               type: string
 *               example: efeozel
 *             email:
 *               type: string
 *               example: efeozel@example.com
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: dGhpcy1pcz1hLXJlZnJlc2gtdG9rZW4uLi4=
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: Gecersiz istek verisi
 *         details:
 *           type: array
 *           items:
 *             type: string
 *             example: "Email alani zorunludur"
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Kullanici kayit, giris ve kimlik dogrulama islemleri
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Kullanici kayit islemi
 *     tags: [Authentication]
 *     description: Yeni bir kullanici kaydi olusturur
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignupInput'
 *     responses:
 *       201:
 *         description: Kullanici basariyla olusturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/signup", signupValidator, signup);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanici giris islemi
 *     tags: [Authentication]
 *     description: Mevcut bir kullanici girişi yapar
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       200:
 *         description: Kullanici basariyla giris yapti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Bulunamadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", loginValidator, login);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Kullanici cikis islemi
 *     tags: [Authentication]
 *     description: Mevcut bir kullanici cikisi yapar
 *     security: []
 *     responses:
 *       200:
 *         description: Kullanici basariyla cikis yapti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/logout", protectRoute, logout);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Kullanici refresh token islemi
 *     tags: [Authentication]
 *     description: Mevcut bir kullanici için redisten token kontrolu yapar ve yeni token verir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanici basariyla refresh token aldi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh-token", refreshToken);
/**
 * @swagger
 * /auth/enable-2fa:
 *   post:
 *     summary: Kullanici 2FA'yi etkinleştir
 *     tags: [Authentication]
 *     description: Mevcut bir kullanici için iki faktörlü kimlik doğrulamayı etkinleştirir
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanici basariyla 2FA'yi etkinleştirdi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/enable-2fa", protectRoute, enable2fa);
/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Kullanici 2FA dogrulama islemi
 *     tags: [Authentication]
 *     description: Mevcut bir kullanici için iki faktörlü kimlik doğrulama kodunu doğrular
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/twoFactorCodeInput'
 *     responses:
 *       200:
 *         description: Kullanici basariyla 2FA dogruladi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Bulunamadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/verify-2fa", verify2fa);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Kullanici sifreyi sıfırlama islemi
 *     tags: [Authentication]
 *     description: Mevcut bir kullanici için sifreyi sıfırlama isteği gönderir
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/forgotPasswordInput'
 *     responses:
 *       200:
 *         description: Kullanici basariyla sifreyi sıfırladı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Gecersiz istek verisi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Bulunamadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Sunucu hatasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reset-password", protectRoute, checkEmailVerified, forgotPassword);
router.get("/verify-email/:token", verifyEmail);

export default router;
