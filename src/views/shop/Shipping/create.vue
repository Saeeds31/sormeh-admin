<template>
    <div class="container mt-4" v-if="checkPermission(['shipping_store'])">
        <h3>ایجاد روش حمل و نقل</h3>
        <form @submit.prevent="submitForm" class="row g-3">
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
                    <VueFileAgent @select="imageLoaded" :maxFiles="1" accept=".jpg,.png" theme="grid" deletable
                        sortable />
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
                            <Treeselect :options="options" v-model="item.value" :multiple="false"
                                @search-change="loadCity" placeholder="جستجوی شهر..." :searchable="true" />
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
                        <button class="btn btn-danger" type="button" @click="removeindex(index)">     <i class="bi bi-trash3-fill"></i>
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
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { BFormTextarea, BFormInput, BFormCheckbox, BFormInvalidFeedback } from "bootstrap-vue-3"
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useAdmin } from '@/stores/modules/admin';
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'

const store = useAdmin();
const checkPermission = store.checkPermission;
const errors = reactive({})

const form = ref({
    name: '',
    description: '',
    cost: null,
    status: false,
    icon: false,
})
const conditions = ref([{ condition: "", type: "", value: "" }])
function imageLoaded(files) {
    form.value.icon = files[0].file
}
let provinces = ref([])
function fetchProvince() {
    axios.get('/provinces').then((res) => {
        provinces.value = res.data.data
    });
}
const options = ref([]);

const loadCity = async (searchQuery) => {
    try {
        const { data } = await axios.get('/cities?search=' + searchQuery ?? '')
        const ops = data.data.data.map(u => ({ id: u.id, label: `${u.name}` }))
        options.value = ops
    } catch (e) {
        console.log(e);
        toast.error('خطا در جستجوی شهرها')
    }
}
const loading = ref(false)
function addRow() {
    let obj = { condition: "", type: "", value: "" };
    conditions.value.push(obj)
}
function removeindex(index) {
    conditions.value.splice(index, 1)
}
function shippingTypeHandler(shippingCondition) {
    if (shippingCondition.condition == 'city' || shippingCondition.type == 'province' || !shippingCondition.type) {
        return "=="
    } else {
        return shippingCondition.type
    }
}
const submitForm = async () => {
    const formData = new FormData()
    for (const key in form.value) {
        formData.append(key, key == 'status' ? Number(form.value[key]) : form.value[key])
    }
    conditions.value.forEach((shipp, index) => {
        formData.append(`conditions[${index}][condition]`, shipp.condition)
        formData.append(`conditions[${index}][type]`, shippingTypeHandler(shipp))
        formData.append(`conditions[${index}][value]`, shipp.value)
    });
    try {
        loading.value = true
        await axios.post('/shipping-methods', formData)
        toast.success('روش حمل و نقل با موفقیت ایجاد شد')
        form.value = { name: '', description: '', default_cost: null, status: false }
    } catch (e) {
        toast.error('خطایی در ثبت داده به وجود آمده است')
    } finally {
        loading.value = false
    }
}
onMounted(() => {
    fetchProvince();
})
</script>

<style scoped>
/* می‌تونی اینجا استایل دلخواه اضافه کنی */
</style>