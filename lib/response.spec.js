const formatResponse = require('./response.js');

describe('response', () => {
  test('expect good forwarding from the status code and the message object', () => {
    const result = formatResponse(200, { "xxx": "yyy" });
    expect(result).toEqual({
      "code": 200,
      "message": { "description": "OK", "xxx": "yyy" },
    });
  });

  test('should return correct description for various status codes', () => {
    expect(formatResponse(201).message.description).toBe('Created');
    expect(formatResponse(404).message.description).toBe('Not Found');
    expect(formatResponse(500).message.description).toBe('Internal Server Error');
  });

  test('should handle unknown status codes with default 428', () => {
    const result = formatResponse(999);
    expect(result.message.description).toBe('Precondition Required');
  });

  test('should preserve existing message properties', () => {
    const result = formatResponse(200, { custom: 'data', another: 'field' });
    expect(result).toEqual({
      code: 200,
      message: {
        description: 'OK',
        custom: 'data',
        another: 'field'
      }
    });
  });

  test('should not override existing description', () => {
    const result = formatResponse(200, { description: 'Custom Description' });
    expect(result.message.description).toBe('Custom Description');
  });
});
