import { createApp } from "vue";
import "./assets/css/style.css";
import App from "./App.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap"; // optional: for JS components like dropdowns, modals
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.rtl.min.css";
import Multiselect from "vue-multiselect";
import "vue3-treeselect/dist/vue3-treeselect.css";
import BootstrapVue3 from "bootstrap-vue-3";
import router from "./router";
import pinia from "./stores";
import axios from "axios";
import Vue3Toastify, { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import VueFileAgent from "@boindil/vue-file-agent-next";
import Vue3PersianDatetimePicker from "vue3-persian-datetime-picker";
import "@boindil/vue-file-agent-next/dist/vue-file-agent-next.css";
// api.mahseti.shop
// 127.0.0.1:8000
axios.defaults.baseURL = "https://api.mahseti.shop/api/v1/admin";
window.baseImageAddress = "https://api.mahseti.shop/storage_public/";
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      router.push({ name: "login" }); // برو به صفحه لاگین
    }
    return Promise.reject(error);
  }
);
const app = createApp(App);
// app.use(CKEditor)
app.use(Vue3Toastify, {
  autoClose: 3000, // زمان بسته شدن (میلی‌ثانیه)
  position: "top-right", // مکان پیش‌فرض toast
});
app.use(BootstrapVue3);
app.use(VueFileAgent);
app.use(pinia);
app.use(router);
app.component("DatePicker", Vue3PersianDatetimePicker);
app.component("multiselect", Multiselect);

app.mount("#app");
