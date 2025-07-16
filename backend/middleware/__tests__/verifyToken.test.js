const verifyToken = require('../verifyToken');
const jwt = require('jsonwebtoken');

describe('verifyToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if no token is provided', () => {
    req.header.mockReturnValue(undefined);

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Akses ditolak, token tidak ditemukan' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if token is invalid', () => {
    req.header.mockReturnValue('Bearer invalidtoken');
    jwt.verify = jest.fn(() => { throw new Error('invalid token'); });

    verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', 'rahasia123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token tidak valid atau sudah kedaluwarsa' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user if token is valid', () => {
    const decoded = { id: 1, name: 'User' };
    req.header.mockReturnValue('Bearer validtoken');
    jwt.verify = jest.fn(() => decoded);

    verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'rahasia123');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
