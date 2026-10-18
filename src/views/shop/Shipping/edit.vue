<template>
  <div class="container mt-4" v-if="checkPermission(['shipping_update'])">
    <h3>ویرایش روش حمل و نقل</h3>

    <form @submit.prevent="updateForm" class="row g-3">
      <div class="col-md-6">
        <div class="col-md-12">
          <label class="form-label">عنوان روش</label>
          <b-form-input v-model="form.title" type="text" class="form-control" required />
          <b-form-invalid-feedback v-if="errors.title">{{ errors.title[0] }}</b-form-invalid-feedback>
        </div>
        <div class="col-md-12 mt-5">
          <label class="form-label">
            مبلغ قابل پرداخت
            <span v-if="form.cost">
              ({{ Number(form.cost).toLocaleString('fa') }} - تومان)
            </span>
          </label>
          <b-form-input v-model="form.cost" type="number" min="0" class="form-control" />
          <b-form-invalid-feedback v-if="errors.cost">{{ errors.cost[0] }}</b-form-invalid-feedback>
        </div>
      </div>
      <b-col cols="12" md="6">
        <b-form-group label="تصویر (URL)">
          <VueFileAgent @update:raw-model-value="imageLoaded" :raw-model-value="oldImage" :maxFiles="1"
            accept=".pdf,.jpg,.png" theme="grid" deletable sortable>
          </VueFileAgent>
          <b-form-invalid-feedback v-if="errors.icon">{{ errors.icon[0] }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <div class="col-12">
        <label class="form-label">توضیحات روش</label>
        <b-form-textarea v-model="form.description"></b-form-textarea>
      </div>
      <div class="col-md-6">
        <div class="form-check mt-4">
          <b-form-checkbox id="status" v-model="form.status" :true-value="1" :false-value="0">
            فعال
          </b-form-checkbox>
        </div>
      </div>
      <div id="conditionBox">
        <div v-for="(item, index) in conditions" :key="index" class="col-12 row align-items-end">
          <div class="col-md-3">
            <label class="form-label">نوع شرط</label>
            <select v-model="item.condition" class="form-select">
              <option value="">انتخاب کنید</option>
              <option value="total">جمع کل</option>
              <option value="province">استان</option>
              <option value="city">شهر</option>
              <option value="quantity">تعداد کالا</option>
              <option value="weight">وزن</option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label">نوع عملیات</label>
            <select v-model="item.type" :disabled="item.condition == 'province' || item.condition == 'city'"
              class="form-select">
              <option value="">انتخاب کنید
              </option>
              <option value="==">برابر</option>
              <option value=">=">بیشتر مساوی</option>
              <option value="<=">کمتر مساوی</option>
            </select>
          </div>

          <div v-if="item.condition == 'province'" class="col-md-3">
            <label class="form-label">استان مد نظر</label>
            <select v-model="item.value" class="form-select">
              <option value="">انتخاب کنید</option>
              <option v-for="(pro, proindex) in provinces" :key="proindex" :value="pro.id">{{ pro.name }}
              </option>
            </select>
          </div>

          <div v-else-if="item.condition == 'city'" class="col-md-3">
            <div class="col-md-12">
              <label class="form-label">انتخاب شهر</label>

              <multiselect @search-change="loadCity" v-model="item.value" placeholder="جستجوی شهر..."
                open-direction="bottom" :options="options" label="label" track-by="id" :searchable="true"
                :multiple="false" :close-on-select="true" :show-labels="false">
                <template slot="noOptions">
                  جستجو کنید
                </template>
                <template slot="noResult">
                  <span v-if="isRequesting" v-text="'در حال جستجو...'" />
                  <span v-else v-text="'موردی یافت نشد'"></span>
                </template>
              </multiselect>
            </div>
          </div>

          <div v-else class="col-md-3">
            <label class="form-label">
              مقدار مد
              نظر

              <span v-if="item.value">
                ({{ Number(item.value).toLocaleString('fa') }} )
              </span>
            </label>
            <b-form-input v-model="item.value" type="text" class="form-control" required />
          </div>

          <div class="col-md-3">
            <button class="btn btn-danger" type="button" @click="removeindex(index)"> <i class="bi bi-trash3-fill"></i>
              <span>حذف</span></button>
          </div>
        </div>
        <button type="button" @click="addRow()" class="mt-4 btn btn-dark">افزودن شرط</button>
      </div>
      <div class="col-12">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'در حال ثبت ...' : 'ثبت' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { BFormTextarea, BFormInput, BFormCheckbox } from "bootstrap-vue-3"
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useAdmin } from '@/stores/modules/admin';
let conditions = ref([]);
const errors = reactive({})
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute()
const router = useRouter()
const oldImage = ref([]);
const form = ref({
  title: '',
  description: '',
  cost: null,
  icon: null,
  status: false,
})
function imageLoaded(files) {
  if (files.length) {
    form.icon = files[0].file
  } else {
    form.icon = '';
  }
}
const loading = ref(false)
let provinces = ref([])
function addRow() {
  let obj = { condition: "", type: "", value: "" };
  conditions.value.push(obj)
}
function removeindex(index) {
  conditions.value.splice(index, 1)
}
function fetchProvince() {
  axios.get('/provinces').then((res) => {
    provinces.value = res.data.data
  });
}

let options = ref([]);
let abortController = null;
const loadCity = async (searchQuery) => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  try {
    const { data } = await axios.get('/cities?search=' + searchQuery ?? '')
    const ops = data.data.data.map(u => ({ id: u.id, label: `${u.name}` }))
    options.value = ops
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('درخواست قبلی کنسل شد:', error.message);
    } else {
      toast.error('خطا در جستجوی کاربران')
    }
  }
}

const fetchData = async () => {
  try {
    const { data } = await axios.get(`/shipping-methods/${route.params.id}`)
    if (data.data.icon) {
      oldImage.value =
        [{
          name: data.data.icon.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: data.data.icon.split('.').pop(),
          url: `${baseImageAddress}${data.data.icon}`,
        }];
    }
    form.value.status = Number(data.data.status);
    if (data.data.conditions) {
      conditions.value = data.data.conditions
    }
    delete data.data.priority;
    delete data.data.conditions;
    form.value = data.data;


  } catch (e) {
    console.log(e);
    toast.error('Failed to load shipping data')
  }
}
function shippingTypeHandler(shippingCondition) {
  if (shippingCondition.condition == 'city' || shippingCondition.type == 'province' || !shippingCondition.type) {
    return "=="
  } else {
    return shippingCondition.type
  }
}

const updateForm = async () => {
  try {
    loading.value = true
    const formData = new FormData()
    for (const key in form.value) {
      if (key != 'icon') {
        formData.append(key, key == 'status' ? Number(form.value[key]) : form.value[key])
      }
    }
    formData.append("_method", "PUT");
    if (form.value.icon) {
      formData.append("icon", form.value.icon);
    }

    conditions.value.forEach((shipp, index) => {
      formData.append(`conditions[${index}][condition]`, shipp.condition)
      formData.append(`conditions[${index}][type]`, shippingTypeHandler(shipp))
      formData.append(`conditions[${index}][value]`, typeof shipp.value == 'object' ? shipp.value.id : shipp.value)
    });
    await axios.post(`/shipping-methods/${route.params.id}`, formData)
    toast.success('روش حمل و نقل ویرایش شد')
  } catch (e) {
    console.log(e);

    toast.error('خطایی در ویرایش روش به وجود آمده است')
  } finally {
    loading.value = false
  }
}

onMounted(
  () => {
    fetchProvince();
    fetchData()
  }
)
</script>

<style scoped>
/* می‌تونی اینجا استایل دلخواه اضافه کنی */
</style>