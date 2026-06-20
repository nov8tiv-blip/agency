export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  images: WooImage[];
  categories: WooCategory[];
  attributes: WooAttribute[];
  variations: number[];
  stock_status: "instock" | "outofstock" | "onbackorder";
  manage_stock: boolean;
  stock_quantity: number | null;
}

export interface WooImage {
  id: number;
  src: string;
  alt: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface WooVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  attributes: { name: string; option: string }[];
  image: WooImage;
  stock_status: "instock" | "outofstock" | "onbackorder";
  stock_quantity: number | null;
}

export interface CartItem {
  productId: number;
  variationId?: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface WooOrder {
  id: number;
  status: string;
  total: string;
  line_items: {
    product_id: number;
    variation_id: number;
    name: string;
    quantity: number;
    total: string;
  }[];
  billing: WooAddress;
  shipping: WooAddress;
}

export interface WooAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}
