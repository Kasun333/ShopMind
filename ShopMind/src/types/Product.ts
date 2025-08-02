export interface Product {
  productId: number;
  name: string;
  description: string;
  imageUrl: string;
  stock: number;
  categoryId: number;
  price: number;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}
