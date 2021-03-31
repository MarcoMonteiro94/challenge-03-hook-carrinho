import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = await api
        .get(`/products/${productId}`)
        .then((res) => res.data);
      product.amount = 1;

      const stock = await api
        .get(`/stock/${productId}`)
        .then((res) => res.data);

      const productSelected = cart.find(
        (products) => products.id === product.id
      );

      if (productSelected) {
        if (productSelected!.amount < stock.amount) {
          productSelected!.amount += 1;
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
          setCart(JSON.parse(localStorage.getItem("@RocketShoes:cart")!));
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      } else {
        setCart([...cart, product]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, product])
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productSelected = cart.find(
        (products) => products.id === productId
      );
      if (productSelected) {
        const productRemoved = cart.filter(
          (products) => products.id !== productId
        );
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(productRemoved)
        );
        setCart(JSON.parse(localStorage.getItem("@RocketShoes:cart")!));
      } else {
        throw "Erro na remoção do produto";
      }
    } catch (e) {
      toast.error(e);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api
        .get(`/stock/${productId}`)
        .then((res) => res.data);

      const productSelected = cart.find(
        (products) => products.id === productId
      );

      if (productSelected!.amount <= stock.amount && amount === 1) {
        productSelected!.amount += amount;
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
        setCart(JSON.parse(localStorage.getItem("@RocketShoes:cart")!));
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
