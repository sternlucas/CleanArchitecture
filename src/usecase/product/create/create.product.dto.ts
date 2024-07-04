export interface InputCreateproductDto {
  type: string;
  name: string;
  price: number;
}

export interface OutputCreateproductDto {
  id: string;
  name: string;
  price: number;
}
