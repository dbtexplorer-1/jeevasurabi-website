export interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  price: number;
  img: string;
  stock_quantity: number;
  description?: string | null;
}

export interface UserProfile {
  id: number;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  profile_pic: string | null;
  is_active: boolean;
  is_admin: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product: Product;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}
