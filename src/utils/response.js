function success(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

function created(res, data = null, message = 'Created successfully') {
  return success(res, data, message, 201);
}

function paginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}

function error(res, message = 'Internal server error', statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    message,
    errorCode,
  };
  if (details && (process.env.NODE_ENV === 'development' || details.public)) {
    response.details = details.public ? details.public : details;
  }
  return res.status(statusCode).json(response);
}

module.exports = {
  success,
  created,
  paginated,
  error,
};
