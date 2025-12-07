"use client";

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  originPrice: number;
  image: string;
  colors: string[];
  selectedColor: number;
  colorName?: string;
  quantity: number;
  flashSaleVariantId?: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: typeof window !== 'undefined' && localStorage.getItem('cart')
    ? JSON.parse(localStorage.getItem('cart') as string)
    : [],
};

const MAX_QTY_PER_ITEM = 5;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existingItem = state.items.find(
        (item) => item.variantId === newItem.variantId
      );

      if (existingItem) {
        existingItem.price = newItem.price;
        existingItem.originPrice = newItem.originPrice;
        const isFlashSale = Boolean(existingItem.flashSaleVariantId || newItem.flashSaleVariantId);
        if (isFlashSale) {
          existingItem.quantity += newItem.quantity;
        } else {
          existingItem.quantity = Math.min(MAX_QTY_PER_ITEM, existingItem.quantity + newItem.quantity);
        }
      } else {
        const isFlashSale = Boolean(newItem.flashSaleVariantId);
        state.items.push({
          ...newItem,
          quantity: isFlashSale ? newItem.quantity : Math.min(MAX_QTY_PER_ITEM, newItem.quantity)
        });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action: PayloadAction<{productId: string, variantId: string}>) => {
      state.items = state.items.filter(item => !(item.variantId === action.payload.variantId));
      if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify(state.items));
    },
    changeQuantity: (state, action: PayloadAction<{productId: string, variantId: string, delta: number}>) => {
      const idx = state.items.findIndex(item => item.variantId === action.payload.variantId);
      if (idx > -1) {
        const item = state.items[idx];
        const isFlashSale = Boolean(item.flashSaleVariantId);
        const newQty = Math.max(1, item.quantity + action.payload.delta);
        item.quantity = isFlashSale ? newQty : Math.min(MAX_QTY_PER_ITEM, newQty);
        if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify([]));
    }
  }
});

export const { addToCart, removeFromCart, changeQuantity, setCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer; 