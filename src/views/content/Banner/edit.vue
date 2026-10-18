<template>
  <div class="container py-4 bg-gray mt-3" v-if="checkPermission(['banner_update'])">
    <h3 class=" p-2">
      <i class="bi bi-images"></i>
      <span>
        ویرایش بنر
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
            <b-form-input id="ratio" v-model="form.ratio" :state="errors.ratio ? false : null" placeholder="نسبت بنر" />
            <small v-if="errors.ratio" class="text-danger">{{ errors.ratio[0] }}</small>
          </b-form-group>
        </b-col>
        <!-- Desktop Image -->
        <b-col cols="12" md="6">
          <b-form-group label="تصویر دسکتاپ" label-for="image_desktop">
            <VueFileAgent @update:raw-model-value="imageLoaded" :raw-model-value="oldImage" :maxFiles="1"
              accept=".pdf,.jpg,.png" theme="grid" deletable sortable />
            <small v-if="errors.image_desktop" class="text-danger">{{ errors.image_desktop[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Mobile Image -->
        <b-col cols="12" md="6">
          <b-form-group label="تصویر موبایل" label-for="image_mobile">
            <VueFileAgent @update:raw-model-value="imageLoaded1" :raw-model-value="oldImage1" :maxFiles="1"
              accept=".pdf,.jpg,.png" theme="grid" deletable sortable />

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
            <Treeselect id="position" :multiple="false" v-model="form.position" v-if="form.position"
              :options="positions" placeholder="انتخاب موقعیت" />
            <small v-if="errors.position" class="text-danger">{{ errors.position[0] }}</small>
          </b-form-group>
        </b-col>


        <!-- Status -->
        <b-col cols="12" md="6">
          <b-form-group label="وضعیت" label-for="status"> <b-form-checkbox id="status" v-model="form.status"
              :state="errors.status ? false : null" :true-value="1" :false-value="0">

              فعال
            </b-form-checkbox>
            <small v-if="errors.status" class="text-danger">{{ errors.status[0] }}</small>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="primary">
          <i class="bi bi-save2"></i>
          <span class="mx-2">
            ویرایش بنر
          </span>
        </b-button>
      </div>
    </b-form>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, getCurrentInstance } from "vue"
import axios from "axios"
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"
import { BForm, BFormGroup, BFormInput, BFormCheckbox, BButton, BCard, BRow, BCol } from "bootstrap-vue-3"
import { useRoute } from "vue-router"
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute()
const form = reactive({
  title: "",
  image_desktop: null,
  image_mobile: null,
  link: "",
  position: "",
  status: false,
  ratio: 100
})
let loading = ref(false);
let positions = [
  { id: 'after_products', label: "بعد از محصولات" },
  { id: 'before_about', label: "قبل از درباره ماه ستی" },
];
let oldImage = ref([])
let oldImage1 = ref([])
const errors = reactive({})
onMounted(async () => {
  try {
    const res = await axios.get(`/banners/${route.params.id}`)
    Object.assign(form, res.data.data)
    if (res.data.data.image_desktop)
      oldImage.value =
        [{
          name: res.data.data.image_desktop.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: res.data.data.image_desktop.split('.').pop(),
          url: `${baseImageAddress}${res.data.data.image_desktop}`,
        }];
    if (res.data.data.image_mobile)
      oldImage1.value =
        [{
          name: res.data.data.image_mobile.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: res.data.data.image_mobile.split('.').pop(),
          url: `${baseImageAddress}${res.data.data.image_mobile}`,
        }];
    form.status = Number(res.data.data.status);

  } catch (err) {
    toast.error("خطا در دریافت اطلاعات بنر ❌")
  }
})

function imageLoaded(files) {
  form.image_desktop = files[0].file
}
function imageLoaded1(files) {
  form.image_mobile = files[0].file
}
const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    const formData = new FormData()
    formData.append("_method", "PUT")
    for (const key in form) {
      if (key == "status")
        formData.append(key, Number(form[key]))
      else if (key != "image_desktop" && key != "image_mobile")
        formData.append(key, form[key])
    }
    if (form.image_desktop) {
      formData.append("image_desktop", form.image_desktop);
    }
    if (form.image_mobile) {
      formData.append("image_mobile", form.image_mobile);
    }
    await axios.post(`/banners/${route.params.id}`, formData)
    toast.success("بنر با موفقیت ویرایش شد ✅")
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