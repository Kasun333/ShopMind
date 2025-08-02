export interface Product {
  productId: number;
  name: string;
  description: string;
  categoryId: number;
  price: number;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}
