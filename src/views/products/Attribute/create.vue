<template>
  <div class="container py-4 mt-4 bg-gray" v-if="checkPermission(['attributes_store'])">
    <h3 class=" p-2">
      <i class="bi bi-list-check"></i>
      <span>
        ایجاد ویژگی
      </span>
    </h3>
    <b-card>
      <h5 class="mb-3"></h5>
      <b-form @submit.prevent="handleSubmit">
        <b-row>
          <!-- Name -->
          <b-col cols="12" md="12">
            <b-form-group label="نام ویژگی" label-for="name">
              <b-form-input id="name" v-model="form.name" placeholder="نام ویژگی را وارد کنید" />
              <small v-if="errors.name" class="text-danger">{{ errors.name[0] }}</small>
            </b-form-group>
            <b-form-group label="نوع ویژگی" label-for="value_type">
              <b-form-select name="value_type" v-model="form.value_type">
                <b-form-select-option value="code">کد رنگی</b-form-select-option>
                <b-form-select-option value="image">تصویر</b-form-select-option>
              </b-form-select>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mt-3">
          <b-button :disabled="loading" type="submit" variant="primary">
            <i class="bi bi-save2"></i>
            <span class="mx-2">
              ثبت
            </span>
          </b-button>
        </div>
      </b-form>
    </b-card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import axios from "axios"
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol, BFormSelect,BFormSelectOption } from "bootstrap-vue-3"
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = reactive({
  name: "",
  value_type:""
})

let loading = ref(false);
const errors = reactive({})

const handleSubmit = async () => {
  errors.name = null
  loading.value = true;
  try {
    let formData = new FormData();
    formData.append("name", form.name)
    formData.append("value_type", form.value_type)
    await axios.post("/attributes", formData)
    toast.success("ویژگی با موفقیت ایجاد شد ✅")
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