<template>
  <div id="sidebar">
    <!-- Overlay موبایل -->
    <b-collapse v-model="mobileOpen" class="d-lg-none">
      <div class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" @click="mobileOpen = false"></div>
    </b-collapse>

    <!-- Sidebar -->
    <div class="sidebar d-flex flex-column" :class="{ 'sidebar-open': mobileOpen }">
      <!-- Logo -->
      <router-link to="/dashboard" class="p-3 d-flex justify-content-center border-bottom logo-wrapper">
        <img src="../../assets/images/logo.png" alt="Logo" class="img-fluid" />
      </router-link>

      <div class="menu-items-wrapper">
        <div v-for="item in menuItems" :key="item.name" class="w-100">
          <b-nav-item v-if="!item.children && checkPermission(item.permissions)" :to="item.link"
            @click="mobileOpen = false" class="menu-item" :class="{ 'active': isActiveRoute(item.link) }">
            <i :class="item.icon + ' me-2'"></i>
            <span v-if="mobileOpen || windowWidth < 992">{{ item.name }}</span>
          </b-nav-item>

          <!-- آیتم با زیرمنو -->
          <div v-else-if="checkPermission(item.permissions, 'or')" class="menu-group">
            <button class="navItem btn w-100 text-start menu-group-btn"
              :class="{ 'has-active-child': hasActiveChild(item) }" @click="toggleSubmenu(item)">
              <i :class="item.icon + ' me-2'"></i>
              <span>{{ item.name }}</span>
              <i class="ms-auto bi" :class="openSubmenuStates[item.name] ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </button>
            <b-collapse v-model="openSubmenuStates[item.name]" class="submenu-wrapper">
              <b-nav vertical>
                <template v-for="child in item.children" :key="child.name">
                  <b-nav-item v-if="checkPermission(child.permissions)" :to="child.link" class="submenu-item"
                    @click="mobileOpen = false" :class="{ 'active': isActiveRoute(child.link) }">
                    <i :class="child.icon + ' me-2'"></i>
                    <span>{{ child.name }}</span>
                  </b-nav-item>
                </template>
              </b-nav>
            </b-collapse>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Button موبایل -->
    <b-button variant="primary" class="d-lg-none mobile-toggle-btn" @click="mobileOpen = !mobileOpen">
      <i class="bi-list"></i>
    </b-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { BNav, BNavItem, BButton, BCollapse } from "bootstrap-vue-3";
import { useAdmin } from '@/stores/modules/admin';
import { useRoute } from "vue-router";

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();

const mobileOpen = ref(true);
const windowWidth = ref(window.innerWidth);
const openSubmenuStates = ref({});
const openSubmenu = ref(null);

// بررسی می‌کنه که آیا لینک فعلی با مسیر داده شده مطابقت داره
const isActiveRoute = (link) => {
  if (!link) return false;
  return route.path === link || route.path.startsWith(link + '/');
};

// بررسی می‌کنه که آیا زیرمنوی باز شده شامل صفحه فعال هست
const hasActiveChild = (item) => {
  if (!item.children) return false;
  return item.children.some(child =>
    child.link && (route.path === child.link || route.path.startsWith(child.link + '/'))
  );
};

// باز کردن خودکار زیرمنویی که صفحه فعال در اون قرار داره
const autoOpenSubmenu = () => {
  menuItems.value.forEach(item => {
    if (item.children) {
      const hasActive = item.children.some(child =>
        child.link && (route.path === child.link || route.path.startsWith(child.link + '/'))
      );
      if (hasActive) {
        openSubmenuStates.value[item.name] = true;
        openSubmenu.value = item.name;
      }
    }
  });
};

const toggleSubmenu = (item) => {
  openSubmenuStates.value[item.name] = !openSubmenuStates.value[item.name];
  openSubmenu.value = openSubmenuStates.value[item.name] ? item.name : null;
};

// منوها
const menuItems = ref([
  {
    name: "داشبورد",
    permissions: ['dashboard_view'],
    link: "/dashboard",
    icon: "bi-house-fill"
  },
  {
    name: "کاربران",
    permissions: ['user_view', 'role_view', 'manager_view'],
    icon: "bi-people-fill",
    children: [
      {
        name: "لیست کاربران",
        permissions: ['user_view'],
        link: "/users",
        icon: "bi-list-ul"
      },
      {
        name: "ادغام کاربران",
        permissions: ['user_view'],
        link: "/users/duplicates",
        icon: "bi-list-ul"
      },
      {
        name: "نقش ها",
        permissions: ['role_view'],
        link: "/users/roles",
        icon: "bi-person-badge"
      },
      {
        name: "مدیران",
        permissions: ['manager_view'],
        link: "/users/managers",
        icon: "bi-person-check"
      },
    ],
  },
  {
    name: "کیف پول",
    icon: "bi-wallet2",
    permissions: ['wallet_view'],
    children: [
      {
        name: "کیف پول",
        permissions: ['wallet_view'],
        link: "/wallets",
        icon: "bi-list-ul"
      },
      {
        name: "تراکنش ها",
        permissions: ['wallettransaction_view'],
        link: "/wallet/transactions",
        icon: "bi-list-ul"
      },
    ],
  },
  {
    name: "محصولات",
    permissions: ['wallet_view', 'attributes_view', 'category_view', 'product_view', 'product_store', 'specifications_view'],
    icon: "bi-box-seam",
    children: [
      {
        name: "ویژگی‌ها",
        permissions: ['attributes_view'],
        link: "/products/attributes",
        icon: "bi-sliders"
      },
      {
        name: "دسته‌بندی‌ها",
        permissions: ['category_view'],
        link: "/products/categories",
        icon: "bi-tags"
      },
      {
        name: "محصولات",
        permissions: ['product_view'],
        link: "/products",
        icon: "bi-bag"
      },
      {
        name: "افزودن محصول",
        permissions: ['product_store'],
        link: "/products/create",
        icon: "bi-plus-square"
      },
      {
        name: "مشخصات",
        permissions: ['specifications_view'],
        link: "/products/specification",
        icon: "bi-table"
      },
    ],
  },
  {
    name: "محتوا",
    permissions: ['menu_view', 'slider_view', 'banner_view'],
    icon: "bi-layout-text-window",
    children: [
      {
        name: "منو",
        permissions: ['menu_view'],
        link: "/content/menus",
        icon: "bi-list"
      },
      {
        name: "اسلایدر",
        permissions: ['slider_view'],
        link: "/content/sliders",
        icon: "bi-images"
      },
      {
        name: "بنر",
        permissions: ['banner_view'],
        link: "/content/banners",
        icon: "bi-collection"
      },
    ],
  },
  {
    name: "گزارشات",
    permissions: ['report_users', 'report_orders', 'report_products'],
    icon: "bi-bar-chart-line",
    children: [
      {
        name: "کاربران",
        permissions: ['report_users'],
        link: "/reports/users",
        icon: "bi-people"
      },
      {
        name: "سفارشات",
        permissions: ['report_orders'],
        link: "/reports/orders",
        icon: "bi-basket"
      },


      {
        name: "محصولات",
        permissions: ['report_products'],
        link: "/reports/products",
        icon: "bi-box2"
      },

      {
        name: "تنوع ها",
        permissions: ['report_products'],
        link: "/reports/variant",
        icon: "bi-box2"
      },
    ],
  },
  {
    name: "فروشگاه",
    icon: "bi-shop",
    permissions: ['coupon_view', 'shipping_view'],
    children: [
      {
        name: "تخفیفات",
        permissions: ['coupon_view'],
        link: "/shop/coupons",
        icon: "bi-percent"
      },
      {
        name: "حمل و نقل",
        permissions: ['shipping_view'],
        link: "/shop/shipping",
        icon: "bi-truck"
      },

      {
        name: "کانال های فروش",
        permissions: ['channel_view'],
        link: "/channels",
        icon: "bi-list"
      },

    ],
  },
  {
    name: "مکان‌ها",
    permissions: ['city_view', 'province_view'],
    icon: "bi-building",
    children: [
      {
        name: "استان‌ها",
        permissions: ['province_view'],
        link: "/location/provinces/list",
        icon: "bi-geo-alt"
      },
      {
        name: "شهرها",
        permissions: ['city_view'],
        link: "/location/cities/list",
        icon: "bi-geo"
      }
    ]
  },
  {
    name: "دیدگاه‌ها",
    permissions: ['comment_products', 'comment_blogs'],
    icon: "bi-chat-dots",
    children: [
      {
        name: "لیست",
        permissions: ['comment_products'],
        link: "/comments/list",
        icon: "bi-bag"
      },

    ],
  },

  {
    "name": "فروشگاه حضوری",
    "permissions": ["pos_view"],
    "icon": "bi-shop",
    "children": [
      {
        "name": "داشبورد",
        "permissions": ["pos_view"],
        "link": "/pos/dashboard",
        "icon": "bi-speedometer2"
      },
      {
        "name": "ثبت سفارش",
        "permissions": ["pos_store"],
        "link": "/pos/create",
        "icon": "bi-cart-plus"
      },
      {
        "name": "مدیریت سفارشات",
        "permissions": ["pos_view"],
        "link": "/pos/orders",
        "icon": "bi-receipt"
      },
      {
        "name": "مدیریت شیفت‌ها",
        "permissions": ["pos_cashier_manager"],
        "link": "/pos/cashier-manager",
        "icon": "bi-clock-history"
      },
      {
        "name": "مدیریت صندوق‌ها",
        "permissions": ["pos_cashier"],
        "link": "/pos/cashiers",
        "icon": "bi-cash-coin"
      },
      {
        "name": "مدیریت مرجوعی‌ها",
        "permissions": ["pos_refund"],
        "link": "/pos/refunds",
        "icon": "bi-arrow-return-left"
      },
      {
        "name": "مدیریت گزارش‌ها",
        "permissions": ["pos_report"],
        "link": "/pos/reports",
        "icon": "bi-graph-up"
      }
    ]
  },
  {
    name: "سفارشات",
    permissions: ['order_view', 'order_today', 'order_store'],
    icon: "bi-basket3",
    children: [
      {
        name: "سفارشات پیش رو",
        permissions: ['order_today'],
        link: "/orders/today",
        icon: "bi-calendar-day"
      },
      {
        name: "سفارشات خطادار",
        permissions: ['order_view'],
        link: "/orders/problematic",
        icon: "bi-basket"
      },
      {
        name: "لیست",
        permissions: ['order_view'],
        link: "/orders",
        icon: "bi-list-check"
      },
      {
        name: "افزودن دستی",
        permissions: ['order_store'],
        link: "/orders/create",
        icon: "bi-plus-square"
      },
      {
        name: "رسیدهای کارت به کارت",
        permissions: ['cardtocard_view'],
        link: "/card-transfer/receipts",
        icon: "bi-receipt-cutoff"
      }
    ],
  },
  {
    name: "مقالات",
    permissions: ['articlecategory_view', 'article_view'],
    icon: "bi-journal",
    children: [
      {
        name: "دسته‌بندی‌ها",
        permissions: ['articlecategory_view'],
        link: "/articles/categories",
        icon: "bi-tags"
      },
      {
        name: "لیست مقالات",
        permissions: ['article_view'],
        link: "/articles/list",
        icon: "bi-file-text"
      },
    ],
  },
  {
    name: "تنظیمات",
    permissions: ['setting_view'],
    icon: "bi-gear",
    link: "/settings",
  },
]);

const updateWidth = () => (windowWidth.value = window.innerWidth);

// وقتی مسیر تغییر می‌کنه، زیرمنوی مربوطه رو باز کن
watch(() => route.path, () => {
  autoOpenSubmenu();
}, { immediate: true });

onMounted(() => {
  window.addEventListener("resize", updateWidth);
  autoOpenSubmenu();
});
onBeforeUnmount(() => window.removeEventListener("resize", updateWidth));
</script>

<style scoped>
/* استایل اصلی سایدبار - تمیز و حرفه‌ای */
.sidebar {
  width: 260px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
  background: #1a1f2e;
  color: #e4e6eb;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

/* اسکرول بار سفارشی */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: #2d3348;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #5a6578;
}

/* لوگو */
.logo-wrapper {
  border-bottom: 1px solid #2d3348 !important;
  padding: 1.25rem !important;
  background: #1a1f2e;
}

.logo-wrapper img {
  max-height: 40px;
}

/* محتوای منوها */
.menu-items-wrapper {
  padding: 0.75rem 0;
}

/* آیتم منوی اصلی */
.menu-item {
  display: flex !important;
  align-items: center !important;
  padding: 0.625rem 1.25rem !important;
  margin: 0.25rem 0.75rem !important;
  border-radius: 10px !important;
  color: #cfd8e3 !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
}

.menu-item:hover {
  background: #2d3348 !important;
  color: #ffffff !important;
}

.menu-item.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.menu-item i {
  font-size: 1.125rem;
  width: 1.5rem;
}

/* گروه منو با زیرمنو */
.menu-group {
  margin: 0.25rem 0;
}

.menu-group-btn {
  display: flex !important;
  align-items: center !important;
  padding: 0.625rem 1.25rem !important;
  margin: 0.25rem 0.75rem !important;
  border-radius: 10px !important;
  background: transparent !important;
  color: #cfd8e3 !important;
  border: none !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
}

.menu-group-btn:hover {
  background: #2d3348 !important;
  color: #ffffff !important;
}

.menu-group-btn.has-active-child {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #3b82f6 !important;
}

.menu-group-btn i:first-child {
  font-size: 1.125rem;
  width: 1.5rem;
}

.menu-group-btn .bi-chevron-up,
.menu-group-btn .bi-chevron-down {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

/* زیرمنو */
.submenu-wrapper {
  margin-right: 0.5rem;
}

.submenu-item {
  display: flex !important;
  align-items: center !important;
  padding: 0.5rem 1.25rem 0.5rem 1rem !important;
  margin: 0.125rem 0.75rem !important;
  border-radius: 8px !important;
  color: #858d9d !important;
  font-size: 0.8125rem !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
}

.submenu-item:hover {
  background: #2d3348 !important;
  color: #e4e6eb !important;
}

.submenu-item.active {
  background: rgba(59, 130, 246, 0.2) !important;
  color: #3b82f6 !important;
  border-right: 2px solid #3b82f6;
}

.submenu-item i {
  font-size: 0.875rem;
  width: 1.25rem;
}

/* دکمه موبایل */
.mobile-toggle-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1100;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  background: #1a1f2e;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mobile-toggle-btn:hover {
  background: #2d3348;
}

/* ریسپانسیو */
@media (max-width: 991px) {
  .sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 280px;
    z-index: 1050;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-open {
    transform: translateX(0);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  }
}

/* انیمیشن‌های نرم */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

a.nav-link i,
a.nav-link span {
  color: #cfd8e3 !important;
}

a.nav-link {
  color: #cfd8e3 !important;
}
</style>