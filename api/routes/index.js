import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";
import postRoutes from "../routes/post.routes.js";
import commentRoutes from "../routes/comment.routes.js";
import storyRoutes from "../routes/story.routes.js";

const mountRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/post", postRoutes);
  app.use("/api/comment", commentRoutes);
  app.use("/api/story", storyRoutes);
};

export default mountRoutes;
