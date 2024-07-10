import { Sequelize } from "sequelize-typescript";
import { faker } from '@faker-js/faker';
import ProductModel from "../../../infrastructure/product/repository/sequelize/product.model";
import ProductRepository from "../../../infrastructure/product/repository/sequelize/product.repository";
import FindProductUseCase from "./find.product.usecase";
import Product from "../../../domain/product/entity/product";

describe("Test find product use case", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([ProductModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should find a product", async () => {
    const productRepository = new ProductRepository();
    const usecase = new FindProductUseCase(productRepository);

    const id = faker.string.uuid();
    const name = faker.commerce.product();
    const price = Number(faker.commerce.price());

    const product = new Product(id, name, price);

    await productRepository.create(product);

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
