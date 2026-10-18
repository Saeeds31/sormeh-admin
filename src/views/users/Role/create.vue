<template>
  <div class="container py-4 mt-3  bg-gray" v-if="checkPermission(['role_store'])">
    <h3 class=" p-2">
      <i class="bi bi-person-rolodex"></i>
      <span>ایجاد نقش</span>
    </h3>
    <b-card>
      <b-form @submit.prevent="handleSubmit">
        <b-row>
          <!-- Name -->
          <b-col cols="12" md="6">
            <b-form-group label="نام نقش" label-for="name">
              <b-form-input id="name" v-model="form.name" placeholder="نام نقش را وارد کنید" />
              <small v-if="errors.name" class="text-danger">{{ errors.name[0] }}</small>
            </b-form-group>
          </b-col>

          <b-col cols="12" md="6">
            <b-form-group label="به انگلیسی" label-for="slug">
              <b-form-input id="slug" v-model="form.slug" placeholder="ترجمه انگلیسی نقش" />
              <small v-if="errors.slug" class="text-danger">{{ errors.slug[0] }}</small>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mt-3">
          <b-button type="submit" :disabled="loading" variant="primary">
            <i class="bi bi-save2"></i>
            <span>
              ذخیره

            </span> </b-button>
        </div>
      </b-form>
    </b-card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import axios from "axios"
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from "bootstrap-vue-3"
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = reactive({
  name: "",
  slug: "",
})

const errors = reactive({})
let loading = ref(false);

const handleSubmit = async () => {
  errors.name = null
  loading.value = true;
  try {
    let formData = new FormData();
    formData.append("name", form.name)
    formData.append("slug", form.slug.replaceAll(" ", '-'))
    await axios.post("/roles", formData)
    toast.success("نقش با موفقیت ایجاد شد ✅")
    form.name = ""
  } catch (err) {
    if (err.response?.status === 422) {
      Object.assign(errors, err.response.data.errors)
    } else {
      toast.error("خطایی رخ داد ❌")
    }
  } finally {
    loading.value = false;
  }
}
</script>