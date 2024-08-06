import { faker } from "@faker-js/faker";
import { app, sequelize } from "../express";
import request from "supertest";

const input = {
  type: faker.string.fromCharacters(['a']),
  name: faker.commerce.product(),
  price: Number(faker.commerce.price())
};

const input2 = {
  type: faker.string.fromCharacters(['a']),
  name: faker.commerce.product(),
  price: Number(faker.commerce.price())
};

describe("E2E test for product", () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should create a product", async () => {
    const response = await request(app)
      .post("/product")
      .send({
        type: input.type,
        name: input.name,
        price: input.price,
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(input.name);
    expect(response.body.price).toBe(input.price);
  });

  it("should not create a product", async () => {
    const response = await request(app).post("/product").send({
      name: input.name,
    });
    expect(response.status).toBe(500);
  });

  it("should list all product", async () => {
    const response = await request(app)
      .post("/product")
      .send({
        type: input.type,
        name: input.name,
        price: input.price,
      });
    expect(response.status).toBe(200);

    const response2 = await request(app)
      .post("/product")
      .send({
        type: input2.type,
        name: input2.name,
        price: input2.price,
      });
    expect(response2.status).toBe(200);

    const listResponse = await request(app).get("/product").send();

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.products.length).toBe(2);

    const product = listResponse.body.products[0];
    expect(product.name).toBe(input.name);
    expect(product.price).toBe(input.price);

    const product2 = listResponse.body.products[1];
    expect(product2.name).toBe(input2.name);
    expect(product2.price).toBe(input2.price);
  });
});
