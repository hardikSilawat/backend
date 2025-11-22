// src/utils/response.js
const errorResponse = (res, status, message, error = null) => {
  const response = {
    success: false,
    status,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  };
  return res.status(status).json(response);
};

const successResponse = (res, status = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    status,
    message,
    data
  };
  return res.status(status).json(response);
};



module.exports = { successResponse, errorResponse };