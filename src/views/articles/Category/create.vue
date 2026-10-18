<template>
  <div class="p-4 container bg-gray mt-4" v-if="checkPermission(['articlecategory_store'])">
    <h3 class=" p-2">
      <i class="bi bi-list-task"></i>
      <span>
        ایجاد دسته بندی جدید
      </span>
    </h3>
    <b-form class="row" @submit.prevent="submitForm">
      <!-- Title -->
      <b-form-group label="عنوان" class="col-md-6" label-for="title">
        <b-form-input id="title" v-model="form.title" placeholder="عنوان را وارد کنید"></b-form-input>
        <small class="text-danger" v-if="errors.title">{{ errors.title[0] }}</small>
      </b-form-group>

      <!-- Slug -->
      <b-form-group label="Slug" label-for="slug" class="col-md-6" >
        <b-form-input id="slug" v-model="form.slug" placeholder="slug دسته‌بندی"></b-form-input>
        <small class="text-danger" v-if="errors.slug">{{ errors.slug[0] }}</small>
      </b-form-group>

      <!-- Parent -->
      <b-form-group label="دسته‌بندی والد" label-for="parent_id" class="col-md-6">

        <Treeselect id="parent_id" v-model="form.parent_id" :normalizer="normalizer" :options="parentOptions"
          placeholder="انتخاب دسته‌بندی والد" :clearable="true" />
        <small class="text-danger" v-if="errors.parent_id">{{ errors.parent_id[0] }}</small>
      </b-form-group>

      <!-- Meta Title -->
      <b-form-group label="Meta Title" label-for="meta_title" class="col-md-6">
        <b-form-input id="meta_title" v-model="form.meta_title"></b-form-input>
        <small class="text-danger" v-if="errors.meta_title">{{ errors.meta_title[0] }}</small>
      </b-form-group>

      <!-- Meta Description -->
      <b-form-group label="Meta Description" label-for="meta_description" class="col-md-6">
        <b-form-textarea id="meta_description" v-model="form.meta_description" rows="3"></b-form-textarea>
        <small class="text-danger" v-if="errors.meta_description">{{ errors.meta_description[0]
        }}</small>
      </b-form-group>

      <!-- Description -->
      <b-form-group label="توضیحات" label-for="description" class="col-md-6">
        <b-form-textarea id="description" v-model="form.description" rows="5"></b-form-textarea>
        <small class="text-danger" v-if="errors.description">{{ errors.description[0] }}</small>
      </b-form-group>

      <b-button type="submit" :disabled="loading" variant="primary">
        <i class="bi bi-save2"></i>
        <span>
          ذخیره
        </span>
      </b-button>
    </b-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { BForm, BFormGroup, BFormInput, BFormSelect, BFormTextarea, BButton, BCard, BFormInvalidFeedback } from 'bootstrap-vue-3'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = reactive({
  title: '',
  slug: '',
  parent_id: null,
  meta_title: '',
  meta_description: '',
  description: '',
})
let loading = ref(false);

const errors = reactive({})
const normalizer = (node) => {
  // تبدیل کلیدها به فرمت استاندارد کامپوننت
  return {
    id: node.id,
    label: node.title,
    children: node.children
  }
}
const parentOptions = ref([])
function getParentOption() {
  axios.get("/article-categories-by-child").then((res) => {
    parentOptions.value = res.data.data
  })
}
getParentOption()
const submitForm = async () => {
  Object.keys(errors).forEach(k => delete errors[k])

  loading.value = true;
  try {
    const formData = new FormData()
    for (const key in form) {
      formData.append(key, form[key] ?? '')
    }

    const response = await axios.post('/article-categories', formData)
    toast.success('دسته‌بندی با موفقیت ذخیره شد ✅')
    // ریست فرم بعد از موفقیت
    Object.keys(form).forEach(key => form[key] = key === 'parent_id' ? null : '')
  } catch (err) {
    if (err.response && err.response.status === 422) {
      Object.assign(errors, err.response.data.errors)
      toast.error('لطفا خطاهای فرم را بررسی کنید ❌')
    } else {
      toast.error('خطا در ارسال اطلاعات ❌')
      console.error(err)
    }
  } finally {
    loading.value = false;
  }
}
</script>