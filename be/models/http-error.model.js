class HttpError extends Error {
  constructor(message, statusCode, extra) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;
  }
}

module.exports = HttpError;
