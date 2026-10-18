import { createRouter, createWebHistory } from "vue-router";
import login from "../views/login.vue";
import dashboard from "../views/dashboard/dashboard.vue";

const routes = [
  { path: "/login", name: "login", component: login },
  { path: "/dashboard", name: "dashboard", component: dashboard },
  {
    path: "/users",
    name: "users-list",
    component: () => import("@/views/users/User/list.vue"),
  },
  {
    path: "/users/create",
    name: "users-create",
    component: () => import("@/views/users/User/create.vue"),
  },

  {
    path: "/users/:id/edit",
    name: "users-edit",
    component: () => import("@/views/users/User/edit.vue"),
  },
  {
    path: "/users/:id/addresses",
    name: "users-addresses",
    component: () => import("@/views/users/Address/list.vue"),
  },
  {
    path: "/users/:id/addresses/create",
    name: "users-addresses-create",
    component: () => import("@/views/users/Address/create.vue"),
  },
  {
    path: "/users/:id/addresses/:address/edit",
    name: "users-addresses-edit",
    component: () => import("@/views/users/Address/edit.vue"),
  },
  {
    path: "/users/managers",
    name: "users-managers",
    component: () => import("@/views/users/Manager/list.vue"),
  },
  {
    path: "/users/managers/create",
    name: "users-managers-create",
    component: () => import("@/views/users/Manager/create.vue"),
  },
  {
    path: "/users/managers/:id/edit",
    name: "users-managers-edit",
    component: () => import("@/views/users/Manager/edit.vue"),
  },

  {
    path: "/users/roles",
    name: "users-roles",
    component: () => import("@/views/users/Role/list.vue"),
  },
  {
    path: "/users/roles/create",
    name: "users-roles-create",
    component: () => import("@/views/users/Role/create.vue"),
  },
  {
    path: "/users/roles/:id/edit",
    name: "users-roles-edit",
    component: () => import("@/views/users/Role/edit.vue"),
  },
  {
    path: "/wallets",
    name: "wallets",
    component: () => import("@/views/wallet/Wallet/list.vue"),
  },
  {
    path: "/wallet/transactions",
    name: "wallet/transactions",
    component: () => import("@/views/wallet/Transaction/list.vue"),
  },

  {
    path: "/products/specification/create",
    name: "products-specification-create",
    component: () => import("@/views/products/Specification/create.vue"),
  },
  {
    path: "/products/specification/:id/edit",
    name: "products-specification-edit",
    component: () => import("@/views/products/Specification/edit.vue"),
  },

  {
    path: "/products/specification",
    name: "products-specification",
    component: () => import("@/views/products/Specification/list.vue"),
  },
  {
    path: "/products/attributes/create",
    name: "products-attributes-create",
    component: () => import("@/views/products/Attribute/create.vue"),
  },
  {
    path: "/products/attributes/:id/edit",
    name: "products-attributes-edit",
    component: () => import("@/views/products/Attribute/edit.vue"),
  },

  {
    path: "/products/attributes",
    name: "products-attributes",
    component: () => import("@/views/products/Attribute/list.vue"),
  },
  {
    path: "/products/attributes/:id/values",
    name: "products-attribute-values",
    component: () => import("@/views/products/Attribute/AttributeValues.vue"),
  },
  {
    path: "/products/categories",
    name: "products-categories",
    component: () => import("@/views/products/Category/list.vue"),
  },
  {
    path: "/products/categories/create",
    name: "products-categories-create",
    component: () => import("@/views/products/Category/create.vue"),
  },
  {
    path: "/products/categories/:id/edit",
    name: "products-categories-edit",
    component: () => import("@/views/products/Category/edit.vue"),
  },

  {
    path: "/products",
    name: "products-list",
    component: () => import("@/views/products/Product/list.vue"),
  },
  {
    path: "/products/create",
    name: "products-create",
    component: () => import("@/views/products/Product/create.vue"),
  },
  {
    path: "/products/:id/edit",
    name: "products-edit",
    component: () => import("@/views/products/Product/edit.vue"),
  },

  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/settings/index.vue"),
  },

  {
    path: "/content/sliders",
    name: "content-sliders",
    component: () => import("@/views/content/Slider/list.vue"),
  },

  {
    path: "/content/sliders/create",
    name: "content-sliders-create",
    component: () => import("@/views/content/Slider/create.vue"),
  },
  {
    path: "/content/sliders/:id/edit",
    name: "content-sliders-edit",
    component: () => import("@/views/content/Slider/edit.vue"),
  },

  {
    path: "/content/menus",
    name: "content-menus",
    component: () => import("@/views/content/Menu/list.vue"),
  },

  {
    path: "/content/menus/create",
    name: "content-menus-create",
    component: () => import("@/views/content/Menu/create.vue"),
  },

  {
    path: "/content/menus/:id/edit",
    name: "content-menus-edit",
    component: () => import("@/views/content/Menu/edit.vue"),
  },
  {
    path: "/content/banners",
    name: "content-banners",
    component: () => import("@/views/content/Banner/list.vue"),
  },

  {
    path: "/content/banners/create",
    name: "content-banners-create",
    component: () => import("@/views/content/Banner/create.vue"),
  },

  {
    path: "/content/banners/:id/edit",
    name: "content-banners-edit",
    component: () => import("@/views/content/Banner/edit.vue"),
  },

  {
    path: "/articles/list",
    name: "articles-list",
    component: () => import("@/views/articles/Article/list.vue"),
  },
  {
    path: "/articles/create",
    name: "articles-create",
    component: () => import("@/views/articles/Article/create.vue"),
  },
  {
    path: "/articles/:id/edit",
    name: "articles-edit",
    component: () => import("@/views/articles/Article/edit.vue"),
  },
  {
    path: "/articles/categories",
    name: "articles-categories",
    component: () => import("@/views/articles/Category/list.vue"),
  },
  {
    path: "/articles/categories/create",
    name: "articles-categories-create",
    component: () => import("@/views/articles/Category/create.vue"),
  },
  {
    path: "/articles/categories/:id/edit",
    name: "articles-categories-edit",
    component: () => import("@/views/articles/Category/edit.vue"),
  },

  {
    path: "/reports/users",
    name: "reports-users",
    component: () => import("@/views/reports/Users.vue"),
  },
  {
    path: "/reports/orders",
    name: "reports-orders",
    component: () => import("@/views/reports/Orders.vue"),
  },
  {
    path: "/reports/products",
    name: "reports-products",
    component: () => import("@/views/reports/Products.vue"),
  },
  {
    path: "/reports/variant",
    name: "reports-variant",
    component: () => import("@/views/reports/variant.vue"),
  },
  {
    path: "/shop/coupons",
    name: "shop-coupons",
    component: () => import("@/views/shop/Coupons/list.vue"),
  },
  {
    path: "/shop/coupons/create",
    name: "shop-coupons-create",
    component: () => import("@/views/shop/Coupons/create.vue"),
  },
  {
    path: "/shop/coupons/:id/edit",
    name: "shop-coupons-edit",
    component: () => import("@/views/shop/Coupons/edit.vue"),
  },
  {
    path: "/shop/shipping",
    name: "shop-shipping",
    component: () => import("@/views/shop/Shipping/list.vue"),
  },

  {
    path: "/shop/shipping/create",
    name: "shop-shipping-create",
    component: () => import("@/views/shop/Shipping/create.vue"),
  },

  {
    path: "/shop/shipping/:id/edit",
    name: "shop-shipping-edit",
    component: () => import("@/views/shop/Shipping/edit.vue"),
  },
  {
    path: "/users/duplicates",
    name: "shop-DuplicateUsers",
    component: () => import("@/views/users/User/DuplicateUsers.vue"),
  },
  {
    path: "/card-transfer/receipts",
    name: "orders-card-transfer-receipts",
    component: () => import("@/views/CardToCard/list.vue"),
  },

  {
    path: "/orders/problematic",
    name: "orders-problematic",
    component: () => import("@/views/orders/problematic.vue"),
  },
  //
   {
    path: "/channels",
    name: "channels",
    component: () => import("@/views/channels/ChannelsList.vue"),
  },

  {
    path: "/comments/list",
    name: "comments-list",
    component: () => import("@/views/comments/list.vue"),
  },

  {
    path: "/location/provinces/list",
    name: "location-province-list",
    component: () => import("@/views/location/Province/list.vue"),
  },

  {
    path: "/location/provinces/create",
    name: "location-province-create",
    component: () => import("@/views/location/Province/create.vue"),
  },

  {
    path: "/location/provinces/:id/edit",
    name: "location-province-edit",
    component: () => import("@/views/location/Province/edit.vue"),
  },
  {
    path: "/location/cities/list",
    name: "location-cities-list",
    component: () => import("@/views/location/City/list.vue"),
  },

  {
    path: "/location/cities/create",
    name: "location-cities-create",
    component: () => import("@/views/location/City/create.vue"),
  },

  {
    path: "/location/cities/:id/edit",
    name: "location-cities-edit",
    component: () => import("@/views/location/City/edit.vue"),
  },

  {
    path: "/orders/today",
    name: "orders-today",
    component: () => import("@/views/orders/today.vue"),
  },
  {
    path: "/orders",
    name: "orders-list",
    component: () => import("@/views/orders/list.vue"),
  },
  {
    path: "/orders/create",
    name: "orders-create",
    component: () => import("@/views/orders/create.vue"),
  },
  {
    path: "/orders/:id",
    name: "orders-show",
    component: () => import("@/views/orders/show.vue"),
  },

  {
    path: "/pos/dashboard",
    name: "pos-dashboard",
    component: () => import("@/views/pos/dashboard.vue"),
  },
  {
    path: "/pos/cashier-manager",
    name: "pos-cashier-manager",
    component: () => import("@/views/pos/cashierManager.vue"),
  },
  {
    path: "/pos/cashier/sessions/:id/details",
    name: "pos-cashier-detail",
    component: () => import("@/views/pos/cashierDetail.vue"),
  },
  {
    path: "/pos/create",
    name: "pos-create",
    component: () => import("@/views/pos/createOrder.vue"),
  },

  {
    path: "/pos/order/print/:id",
    name: "pos-order-print-detail",
    component: () => import("@/views/pos/orderPrint.vue"),
  },

  {
    path: "/pos/order/:id",
    name: "pos-order-detail",
    component: () => import("@/views/pos/orderDetail.vue"),
  },
  {
    path: "/pos/orders",
    name: "pos-orders",
    component: () => import("@/views/pos/orders.vue"),
  },

  {
    path: "/pos/refunds",
    name: "pos-refunds",
    component: () => import("@/views/pos/refunds.vue"),
  },

  {
    path: "/pos/cashiers",
    name: "pos-cashiers",
    component: () => import("@/views/pos/cashiers.vue"),
  },

  {
    path: "/pos/reports",
    name: "pos-reports",
    component: () => import("@/views/pos/reports.vue"),
  },
  {
    path: "/orders/print",
    name: "orders-print",
    component: () => import("@/views/orders/print.vue"),
  },
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
