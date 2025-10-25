class CustomError extends Error {
  constructor(code, message, desc) {
    super(`{"code": "${code}", "message:" "${message}", "description:" "${desc}"}`);

    this.code = code;
    this.message = message;
    this.desc = desc;
  }
}

export default CustomError;
