function success(res, data = null, message = 'Success', statusCode = 200) {
  const body = {
    success: true,
    message,
    data,
    errorCode: null,
    details: null,
    pagination: null,
  };
  return res.status(statusCode).json(body);
}

function created(res, data = null, message = 'Created successfully') {
  return success(res, data, message, 201);
}

function paginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    errorCode: null,
    details: null,
    pagination,
  });
}

function error(res, message = 'Internal server error', statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
  const body = {
    success: false,
    message,
    data: null,
    errorCode,
    details: null,
    pagination: null,
  };
  if (details) {
    const isDev = process.env.NODE_ENV === 'development';
    body.details = isDev || details.public ? (details.public || details) : null;
  }
  return res.status(statusCode).json(body);
}

module.exports = {
  success,
  created,
  paginated,
  error,
};
