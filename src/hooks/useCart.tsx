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
      const productSelected = cart.find(
        (products) => products.id === product.id
      );
      if (productSelected) {
        const stock = await api
          .get(`/stock/${productId}`)
          .then((res) => res.data);
        if (productSelected.amount <= stock.amount) {
          productSelected.amount += 1;
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
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productSelected = cart.find(
        (products) => products.id === productId
      );
      if (amount < productSelected!.amount) {
        console.log("reduz");
        removeProduct(productId);
      } else {
        console.log("adiciona");
        addProduct(productId);
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
