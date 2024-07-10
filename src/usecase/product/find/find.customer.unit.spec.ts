import { faker } from '@faker-js/faker';
import Product from '../../../domain/product/entity/product';
import FindProductUseCase from './find.product.usecase';

const id = faker.string.uuid();
const name = faker.commerce.product();
const price = Number(faker.commerce.price());

const product = new Product(id, name, price);

const MockRepository = () => {
  return {
    find: jest.fn().mockReturnValue(Promise.resolve(product)),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
};

describe("Unit Test find product use case", () => {
  it("should find a product", async () => {
    const productRepository = MockRepository();
    const usecase = new FindProductUseCase(productRepository);

    const input = {
      id,
    };

    const output = {
      id,
      name,
      price,
    };

    const result = await usecase.execute(input);

    expect(result).toEqual(output);
  });
});
