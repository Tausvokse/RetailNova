import { createBrowserRouter } from "react-router";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CartPage } from "./pages/CartPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ProfilePage } from "./pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: CatalogPage,
  },
  {
    path: "/catalog",
    Component: CatalogPage,
  },
  {
    path: "/product/:id",
    Component: ProductDetailPage,
  },
  {
    path: "/cart",
    Component: CartPage,
  },
  {
    path: "/checkout",
    Component: CheckoutPage,
  },
  {
    path: "/order-success/:orderId",
    Component: OrderSuccessPage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/contacts",
    Component: ContactsPage,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);