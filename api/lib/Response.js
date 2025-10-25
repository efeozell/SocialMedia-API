import CustomError from "./Error.js";
import httpStatus from "http-status";

class Response {
  constructor() {}

  static successResponse(data, code = 200) {
    return {
      code,
      data,
    };
  }

  static errorResponse(error) {
    if (error instanceof CustomError) {
      return {
        code: error.code,
        error: {
          message: error.message,
          description: error.description,
        },
      };
    } else if (error.message.includes("E11000")) {
      return {
        code: httpStatus.CONFLICT,
        error: {
          message: "Common Already exist",
          description: "Common Already exist",
        },
      };
    }

    const statusCode = httpStatus.INTERNAL_SERVER_ERROR || 500;

    return {
      code: statusCode,
      error: {
        message: "Common Unknow error",
        description: error.message,
      },
    };
  }
}

export default Response;

// const errorResponse = Response.errorResponse(data)

// res.send(Response.successResponse(data));

//  const errorResponse = Response.errorResponse(
//       new CustomError(400, "Bad Request", "The JSON payload is malformed. Please check the syntax")
//     );
