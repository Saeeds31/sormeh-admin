<template>
  <div class="container py-4 mt-4 bg-gray" v-if="checkPermission(['banner_store'])">
    <h3 class=" p-2">
      <i class="bi bi-images"></i>
      <span>
        ایجاد بنر
      </span>
    </h3>
    <b-form @submit.prevent="handleSubmit">
      <b-row>
        <!-- Title -->
        <b-col cols="12" md="6">
          <b-form-group label="عنوان" label-for="title">
            <b-form-input id="title" v-model="form.title" :state="errors.title ? false : null"
              placeholder="عنوان بنر" />

            <small v-if="errors.title" class="text-danger">{{ errors.title[0] }}</small>
          </b-form-group>
        </b-col>
        <b-col cols="12" md="6">
          <b-form-group label="نسبت" label-for="ratio">
            <b-form-input id="title" v-model="form.ratio" :state="errors.ratio ? false : null" placeholder="نسبت بنر" />

            <small v-if="errors.ratio" class="text-danger">{{ errors.ratio[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Desktop Image -->
        <b-col cols="12" md="6">
          <b-form-group label="تصویر دسکتاپ" label-for="image_desktop">
            <VueFileAgent @select="imageLoaded" :maxFiles="1" accept=".pdf,.jpg,.png" theme="grid" deletable sortable />
            <small v-if="errors.image_desktop" class="text-danger">{{ errors.image_desktop[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Mobile Image -->
        <b-col cols="12" md="6">
          <b-form-group label="تصویر موبایل" label-for="image_mobile">

            <VueFileAgent @select="imageLoaded1" :maxFiles="1" accept=".pdf,.jpg,.png" theme="grid" deletable
              sortable />
            <small v-if="errors.image_mobile" class="text-danger">{{ errors.image_mobile[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Link -->
        <b-col cols="12" md="6">
          <b-form-group label="لینک" label-for="link">
            <b-form-input id="link" v-model="form.link" :state="errors.link ? false : null" placeholder="لینک بنر" />
            <small v-if="errors.link" class="text-danger">{{ errors.link[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Position -->
        <b-col cols="12" md="6">
          <b-form-group label="موقعیت" label-for="position">
            <Treeselect id="position" :multiple="false" v-model="form.position" :options="positions"
              placeholder="انتخاب موقعیت" />
            <small v-if="errors.position" class="text-danger">{{ errors.position[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Status -->
        <b-col cols="12" md="6">
          <b-form-group label="وضعیت" label-for="status">
            <b-form-checkbox id="status" v-model="form.status" :state="errors.status ? false : null" :true-value="1"
              :false-value="0">
              فعال

            </b-form-checkbox>
            <small v-if="errors.status" class="text-danger">{{ errors.status[0] }}</small>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="primary">
          <i class="bi bi-save2"></i>
          <span class="mx-2">ثبت بنر</span>
        </b-button>
      </div>
    </b-form>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import axios from "axios"
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"
import { BForm, BFormGroup, BFormInput, BFormCheckbox, BButton, BCard, BRow, BCol } from "bootstrap-vue-3"
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = reactive({
  title: "",
  image_desktop: "",
  image_mobile: "",
  link: "",
  position: "after_products",
  status: false,
  ratio: 100
})
let positions = [
  { id: 'after_products', label: "بعد از محصولات" },
  { id: 'before_about', label: "قبل از درباره ماه ستی" },
];
let loading = ref(false);
function imageLoaded(files) {
  form.image_desktop = files[0].file
}
function imageLoaded1(files) {
  form.image_mobile = files[0].file
}
const errors = reactive({})

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    const formData = new FormData()
    for (const key in form) {
      if (key == "status")
        formData.append(key, Number(form[key]))
      else
        formData.append(key, form[key])
    }

    await axios.post("/banners", formData)
    toast.success("بنر با موفقیت ثبت شد ✅")
    Object.keys(form).forEach(k => form[k] = k === "status" ? false : "")
  } catch (err) {
    if (err.response?.status === 422) {
      Object.assign(errors, err.response.data.errors)
      toast.error("خطاهای فرم را بررسی کنید ❌")
    } else {
      toast.error("خطا در ارسال اطلاعات ❌")
    }
  } finally {
    loading.value = false;
  }
}
</script>