import swaggerJsDoc from "swagger-jsdoc";
import { ENV } from "../config/env.js";

const swaggerOptions = {
  openapi: "3.0.0",
  info: {
    title: "Social Media API Documentation",
    version: "1.0.0",
    description: "Sosyal Medya API'si icin Swagger dokumantasyonum",
    contact: {
      name: "Efe Ozel",
      email: "efeqozel@gmail.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${ENV.PORT}/api`,
      description: "Development Server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Giris (Login) endpointinden alinan JWT tokenni buraya girin",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerOptions,

  apis: ["./routes/*.js"],
};

const swaggerSpecs = swaggerJsDoc(options);

export { swaggerSpecs };
