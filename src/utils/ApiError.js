class ApiError extends Error {
  constructor(
    statusCode, message, errors = [], stack = ""
  ) {
    super(message)

    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;

    } else {
      Error.captureStackTrace(this, this.constructor)

    }
    const match = message.match(/^(.*?):/); // Capture everything before the first colon
    this.simplifiedMessage = match ? match[1].trim() : message; // If no colon, use the whole message

  }


}

export { ApiError }