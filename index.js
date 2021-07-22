const SwaggerParser = require('@apidevtools/swagger-parser');
const faker = require('faker');
const { randexp } = require('randexp');

const generateFakeData = (property) => {
  let fakedData;
  if ('x-faker' in property) {
    const fakeType = property['x-faker'].split('.');
    fakedData = faker[fakeType[0]][fakeType[1]]();
  } else if (property.format === 'uri') {
    fakedData = faker.internet.url();
  } else if (property.format === 'email') {
    fakedData = faker.internet.email();
  } else if ('pattern' in property) {
    fakedData = randexp(property.pattern);
  } else if (property.type === 'integer') {
    fakedData = faker.datatype.number({ min: property.minimum, max: property.maximum });
  } else if (property.type === 'object') {
    fakedData = {};
    Object.keys(property.properties).forEach((objectProperty) => {
      fakedData[objectProperty] = generateFakeData(property.properties[objectProperty]);
    });
  } else if (property.type === 'array') {
    fakedData = [];
    let limit;
    limit = 10;
    if (property.maxItems) {
      limit = property.maxItems;
    }
    while (limit > 0) {
      const fakedItem = generateFakeData(property.items);
      fakedData.push(fakedItem);
      limit -= 1;
    }
  } else {
    console.log('Property not faked:', property);
  }

  if (property.nullable) {
    fakedData = faker.helpers.randomize([fakedData, fakedData, null]);
  }
  return fakedData;
};

(async () => {
  const spec = await SwaggerParser.dereference('api.yaml');
  const schema = {};

  Object.keys(spec.components.schemas).forEach((schemaName) => {
    schema[schemaName] = {};

    Object.keys(spec.components.schemas[schemaName].properties).forEach((propertyName) => {
      const property = spec.components.schemas[schemaName].properties[propertyName];

      schema[schemaName][propertyName] = generateFakeData(property);
    });
  });
  console.log(schema.Station);
})();
