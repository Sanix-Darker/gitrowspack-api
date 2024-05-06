const formatResponse = require('./response.js')

describe('response', () => {
    test('expect good forwarding from the status code and the message object', () => {
        const result = formatResponse(200, {"xxx": "yyy"});
        expect(result).toEqual({
            "code": 200,
            "message": {"description": "OK", "xxx": "yyy"},
        });
    })
})
