const response = require('../../../utils/response');

function mockRes() {
  return {
    statusCode: 0,
    json: jest.fn(),
    status: function (code) {
      this.statusCode = code;
      return this;
    },
  };
}

describe('response.success()', () => {
  it('returns correct shape with 200', () => {
    const res = mockRes();
    response.success(res, { id: 1 }, 'Done');
    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Done',
      data: { id: 1 },
      errorCode: null,
      details: null,
      pagination: null,
    });
  });

  it('uses defaults when not provided', () => {
    const res = mockRes();
    response.success(res);
    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: null,
      errorCode: null,
      details: null,
      pagination: null,
    });
  });
});

describe('response.created()', () => {
  it('returns 201', () => {
    const res = mockRes();
    response.created(res, { id: 42 });
    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { id: 42 } }),
    );
  });
});

describe('response.paginated()', () => {
  it('returns data + pagination metadata', () => {
    const res = mockRes();
    const pagination = { page: 1, limit: 20, total: 50 };
    response.paginated(res, [1, 2, 3], pagination);
    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: [1, 2, 3],
      errorCode: null,
      details: null,
      pagination,
    });
  });
});

describe('response.error()', () => {
  it('returns errorCode + message', () => {
    const res = mockRes();
    response.error(res, 'Not found', 404, 'NOT_FOUND');
    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found',
      data: null,
      errorCode: 'NOT_FOUND',
      details: null,
      pagination: null,
    });
  });
});
