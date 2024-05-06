const util = require('./util')

describe('Util', () => {

  const sampleData = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 }
  ];

  test('asc() should sort objects in ascending order based on the given key', () => {

    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const sortedData = util.asc(sampleDataTest, 'age');
    expect(sortedData).toEqual([
      { id: 2, name: 'Bob', age: 25 },
      { id: 1, name: 'Alice', age: 30 },
      { id: 3, name: 'Charlie', age: 35 }
    ]);
  });

  test('desc() should sort objects in descending order based on the given key', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const sortedData = util.desc(sampleDataTest, 'age');
    expect(sortedData).toEqual([
      { id: 3, name: 'Charlie', age: 35 },
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ]);
  });

  test('limit() should limit the number of objects returned', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const limitedData = util.limit(sampleDataTest, 2);
    expect(limitedData.length).toBe(2);
  });

  test('where() should filter objects based on the provided filter', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const filteredData = util.where(sampleDataTest, { age: 'gt:25' });
    expect(filteredData.length).toBe(2);
    expect(filteredData).toContainEqual({ id: 1, name: 'Alice', age: 30 });
    expect(filteredData).toContainEqual({ id: 3, name: 'Charlie', age: 35 });
  });

  test('pluck() should extract specified keys from objects', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const pluckedData = util.pluck(sampleDataTest, ['name', 'age']);
    expect(pluckedData.length).toBe(sampleDataTest.length);
    expect(pluckedData[0]).toEqual({ name: 'Alice', age: 30 });
    expect(pluckedData[1]).toEqual({ name: 'Bob', age: 25 });
    expect(pluckedData[2]).toEqual({ name: 'Charlie', age: 35 });
  });

  // FIXME: TEST
  // test('aggregate() should perform various aggregation operations on data', () => {
  //   const aggregates = {
  //     '$count': 'name',
  //     '$sum': 'age',
  //     '$avg': 'age',
  //     '$min': 'age',
  //     '$max': 'age',
  //     '$order': 'age:asc',
  //     '$limit': '2'
  //   };
  //   const aggregatedData = util.aggregate(sampleData, aggregates);
  //   expect(aggregatedData['count(name)']).toBe(3);
  //   expect(aggregatedData['sum(age)']).toBe(90);
  //   expect(aggregatedData['avg(age)']).toBe(30);
  //   expect(aggregatedData['min(age)']).toBe(25);
  //   expect(aggregatedData['max(age)']).toBe(35);
  //   expect(aggregatedData.length).toBe(2);
  //   expect(aggregatedData[0]).toEqual({ id: 2, name: 'Bob', age: 25 });
  //   expect(aggregatedData[1]).toEqual({ id: 1, name: 'Alice', age: 30 });
  // });

  test('columns() should return an array of unique column names from the provided object or array of objects', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const columns = util.columns(sampleDataTest);
    expect(columns).toEqual(['id', 'name', 'age']);
  });

  test('typeof() should return the type of the provided value along with any format information', () => {
    const type1 = typeof(42);
    expect(type1).toEqual("number");

    const type2 = typeof('2024-05-06');
    expect(type2).toEqual("string");
  });

  test('types() should return an object containing the type information for each property of the provided object', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const types = util.types(sampleDataTest);
    expect(types).toEqual({
      id: { type: 'integer', format: 'int32' },
      name: { type: 'string' },
      age: { type: 'integer', format: 'int32' }
    });
  });

  test('columnsApply() should add missing columns to each object in the array and remove extra columns', () => {
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const modifiedData = util.columnsApply(sampleDataTest, ['id', 'name', 'email']);
    expect(modifiedData[0]).toEqual({ id: 1, name: 'Alice', email: null });
    expect(Object.keys(modifiedData[1])).toEqual(['id', 'name', 'email']);
  });

  test('valuesApply() should apply values to objects in the array based on a query', () => {
    const values = { age: 40 };
    const query = { age: 'lt:30' };
    const sampleDataTest = JSON.parse(JSON.stringify(sampleData));
    const modifiedData = util.valuesApply(sampleDataTest, values, query);
    expect(modifiedData[0].age).toBe(30);
    expect(modifiedData[1].age).toBe(40);
    expect(modifiedData[2].age).toBe(35);
  });

  test('btoa() should encode a string to base64', () => {
    const encodedString = util.btoa('Hello, world!');
    expect(encodedString).toBe('SGVsbG8sIHdvcmxkIQ==');
  });

  test('atob() should decode a base64-encoded string', () => {
    const decodedString = util.atob('SGVsbG8sIHdvcmxkIQ==');
    expect(decodedString).toBe('Hello, world!');
  });

  test('removeEmpty() should remove empty properties from an object', () => {
    const obj = { a: 1, b: null, c: undefined, d: '', e: 0 };
    const cleanedObj = util.removeEmpty(obj);
    expect(cleanedObj).toEqual({ a: 1, c: undefined });
  });

  test('isEmptyObjectArray() should return true if the object array is empty or contains only empty objects', () => {
    const emptyArray = [];
    const nonEmptyArray = [{}, { a: 1 }, {}];
    expect(util.isEmptyObjectArray(emptyArray)).toBe(true);
    expect(util.isEmptyObjectArray(nonEmptyArray)).toBe(false);
  });

  test('mime() should return the MIME type for the given file extension', () => {
    const mimeType = util.mime('json');
    expect(mimeType).toBe('application/json');
  });
});
