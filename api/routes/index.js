import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";
import postRoutes from "../routes/post.routes.js";

const mountRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/post", postRoutes);
};

export default mountRoutes;
