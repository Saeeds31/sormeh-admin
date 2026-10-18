<template>
  <div class="product-create container py-4" v-if="checkPermission(['product_update'])">
    <!-- دکمه‌های مرحله‌ای -->
    <div class="step-buttons d-flex flex-wrap justify-content-center align-items-center mb-4">
      <template v-for="(step, index) in steps" :key="index">
        <button class="btn btn-primary d-flex align-items-end me-2 mb-2 steper"
          :class="{ active: currentStep === index }" :disabled="!step.enabled" @click="currentStep = index">
          <i :class="step.icon" class="me-1"></i>
          {{ step.label }}
          <span v-if="step.completed" class="ms-1 text-success">&#10003;</span>
        </button>
        <div v-if="index < steps.length - 1" class="step-divider-wrap">
          <i class="bi bi-caret-left"></i>
          <i class="bi bi-caret-left"></i>
          <i class="bi bi-caret-left"></i>
        </div>
      </template>
    </div>

    <!-- مرحله اول: اطلاعات اصلی محصول -->
    <div class="bg-gray" v-if="currentStep === 0">
      <h3 class="p-2">
        <i class="bi bi-info"></i>
        <span>مرحله اول: اطلاعات اصلی محصول</span>
      </h3>
      <form @submit.prevent="saveStep1">
        <div class="formSetp1 g-3">
          <div class="border-box row">
            <div class="col-md-6 mb-3">
              <label class="form-label">عنوان محصول</label>
              <input v-model="form.title" type="text" class="form-control" />
              <span v-if="errors.step1.title" class="text-danger">{{ errors.step1.title[0] }}</span>
            </div>

            <div class="col-md-6 mb-3">
              <label class="form-label">
                قیمت
                <span v-if="form.price">{{ Number(form.price).toLocaleString('fa-IR') }}</span>
                (تومان)
              </label>
              <input v-model="form.price" type="number" class="form-control" />
              <span v-if="errors.step1.price" class="text-danger">{{ errors.step1.price[0] }}</span>
            </div>

            <div class="col-md-12 mb-3">
              <label class="form-label">دسته‌بندی‌ها</label>
              <Treeselect v-model="form.categories" :multiple="true" :options="categoryOptions"
                :normalizer="normalizer" />
              <span v-if="errors.step1.categories" class="text-danger">{{ errors.step1.categories[0] }}</span>
            </div>

            <div class="col-md-4 mb-3">
              <label class="form-label">بارکد</label>
              <input v-model="form.barcode" type="text" class="form-control" />
              <span v-if="errors.step1.barcode" class="text-danger">{{ errors.step1.barcode[0] }}</span>
            </div>

            <div class="col-md-4 mb-3">
              <label class="form-label">SKU</label>
              <input v-model="form.sku" type="text" class="form-control" />
              <span v-if="errors.step1.sku" class="text-danger">{{ errors.step1.sku[0] }}</span>
            </div>

            <div class="col-md-4 mb-3">
              <label class="form-label">
                موجودی
                <span v-if="form.stock">{{ Number(form.stock).toLocaleString('fa-IR') }}</span>
              </label>
              <input v-model="form.stock" type="number" class="form-control" />
              <span v-if="errors.step1.stock" class="text-danger">{{ errors.step1.stock[0] }}</span>
            </div>

            <div class="col-md-12 mb-3">
              <label class="form-label">توضیحات</label>
              <Editor v-model="form.description" />
              <span v-if="errors.step1.description" class="text-danger">{{ errors.step1.description[0] }}</span>
            </div>

            <div class="col-md-12 mb-3">
              <label class="form-label">تصاویر</label>
              <VueFileAgent @select="imagesLoaded" @beforedelete="imagesRemoved" :multiple="true"
                accept=".jpg,.png,.webp" theme="grid" deletable sortable />
              <span v-if="errors.step1.images" class="text-danger">{{ errors.step1.images[0] }}</span>
            </div>

            <div class="col-md-12 mb-3">
              <label class="form-label">ویدئو</label>
              <VueFileAgent @select="videoLoaded" @beforedelete="videoRemoved" :maxFiles="1" accept=".mp4,.mov,.avi"
                theme="grid" deletable sortable />
              <span v-if="errors.step1.video" class="text-danger">{{ errors.step1.video[0] }}</span>
            </div>
          </div>

          <div class="border-box">

            <div class="col-md-12 mb-3">
              <label class="form-label">تصویر اصلی</label>
              <VueFileAgent @select="imageLoaded" @beforedelete="imageRemoved" :maxFiles="1" accept=".jpg,.png"
                theme="grid" deletable sortable />
              <span v-if="errors.step1.main_image" class="text-danger">{{ errors.step1.main_image[0] }}</span>
            </div>
            <div class="col-md-12 mb-3">
              <label class="form-label">نوع فروش</label>
              <select v-model="form.sales_channel" class="form-select">
                <option value="both">هردو</option>
                <option value="in_store_only">حضوری</option>
                <option value="online_only">آنلاین</option>
              </select>
              <span v-if="errors.step1.sales_channel" class="text-danger">{{ errors.step1.sales_channel[0] }}</span>
            </div>
            <div class="col-md-12 mb-3">
              <label class="form-label">وضعیت</label>
              <select v-model="form.status" class="form-select">
                <option value="">انتخاب کنید</option>
                <option value="draft">پیشنویس</option>
                <option value="published">انتشار</option>
                <option value="unavailable">ناموجود</option>
              </select>
              <span v-if="errors.step1.status" class="text-danger">{{ errors.step1.status[0] }}</span>
            </div>
            <div v-if="form.status == 'draft'" class="col-md-12 mb-3">
              <label class="form-label">زمان انتشار</label>
              <date-picker type="datetime" display-format="jYYYY/jMM/jDD HH:mm" placeholder="از تاریخ"
                format="YYYY-MM-DD HH:mm" v-model="form.published_at"></date-picker>
              <span v-if="errors.step1.published_at" class="text-danger">{{ errors.step1.published_at[0]
              }}</span>
            </div>
            <div class="col-md-12 mb-3">
              <label class="form-label">نوع تخفیف</label>
              <select v-model="form.discount_type" class="form-select">
                <option value="">انتخاب کنید</option>
                <option value="percent">درصدی</option>
                <option value="fixed">ثابت</option>
              </select>
              <span v-if="errors.step1.discount_type" class="text-danger">{{ errors.step1.discount_type[0] }}</span>
            </div>

            <div class="col-md-12 mb-3">
              <label class="form-label">تخفیف</label>
              <input v-model="form.discount_value" type="number" class="form-control" />
              <span v-if="errors.step1.discount_value" class="text-danger">{{ errors.step1.discount_value[0] }}</span>
            </div>
            <div class="col-md-12 mb-3">
              <label class="form-label">شروع تخفیف</label>
              <date-picker display-format="jYYYY/jMM/jDD" placeholder="از تاریخ" format="YYYY-MM-DD"
                v-model="form.discount_start_at"></date-picker>
              <span v-if="errors.step1.discount_start_at" class="text-danger">{{ errors.step1.discount_start_at[0]
              }}</span>
            </div>
            <div class="col-md-12 mb-3">
              <label class="form-label">پایان تخفیف</label>
              <date-picker display-format="jYYYY/jMM/jDD" placeholder="از تاریخ" format="YYYY-MM-DD"
                v-model="form.discount_end_at"></date-picker>
              <span v-if="errors.step1.discount_end_at" class="text-danger">{{ errors.step1.discount_end_at[0]
              }}</span>
            </div>

          </div>
        </div>

        <div class="metaBox row border-box g-3">
          <div class="col-md-12 mb-3">
            <label class="form-label">عنوان متا</label>
            <input v-model="form.meta_title" type="text" class="form-control" />
            <span v-if="errors.step1.meta_title" class="text-danger">{{ errors.step1.meta_title[0] }}</span>
          </div>

          <div class="col-md-12 mb-3">
            <label class="form-label">توضیحات متا</label>
            <textarea v-model="form.meta_description" class="form-control"></textarea>
            <span v-if="errors.step1.meta_description" class="text-danger">{{ errors.step1.meta_description[0] }}</span>
          </div>
        </div>

        <button :disabled="loading" type="submit" class="btn btn-primary mt-3">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-save2"></i>
          <span class="mx-2">ذخیره مرحله اول</span>
        </button>
      </form>
    </div>

    <!-- مرحله دوم: واریانت‌ها -->
    <div class="bg-gray" v-else-if="currentStep === 1">
      <h3 class="p-2">
        <i class="bi bi-list-task"></i>
        <span>مرحله دوم: تنوع‌ها</span>
      </h3>

      <form>
        <div class="row formSetp2">
          <div class="col-md-12 mb-3">
            <label>ویژگی‌ها:</label>
            <Treeselect v-model="selectedAttibutes" :multiple="true" :options="attributes"
              :normalizer="attributeNormalizer" />
          </div>

          <template v-for="attributeId in selectedAttibutes" :key="attributeId">
            <div class="col-md-12 mb-3">
              <label>انتخاب {{ attrName(attributeId) }}:</label>
              <Treeselect :valueFormat="'object'" v-model="attributeValue[attributeId]" :multiple="true"
                :options="attributeOptionsFor(attributeId)" :normalizer="attributeValuesNormalizer" />
            </div>
          </template>
        </div>

        <span v-if="errors.step2.variants" class="text-danger d-block mb-2">{{ errors.step2.variants[0] }}</span>

        <div v-if="variantCombinations.length" class="table-responsive mt-3 formSetp2">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th v-for="attributeId in attributesWithValues" :key="attributeId">
                  {{ attrName(attributeId) }}
                </th>
                <th>SKU</th>
                <th>قیمت</th>
                <th>موجودی</th>
                <th>تخفیف</th>
                <th>زمان تخفیف</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="variant in variantCombinations" :key="variant.id">
                <td v-for="(AV, idx) in variant.values" :key="idx">
                  {{ AV ? AV.value : '' }}
                </td>
                <td><input v-model="variant.sku" class="form-control" /></td>
                <td><input v-model="variant.price" type="number" class="form-control" /></td>
                <td><input v-model="variant.stock" type="number" class="form-control" /></td>
                <td>

                  <div class="col-md-12 mb-3">
                    <label class="form-label">نوع تخفیف</label>
                    <select v-model="variant.discount_type" class="form-select">
                      <option value="">انتخاب کنید</option>
                      <option value="percent">درصدی</option>
                      <option value="fixed">ثابت</option>
                    </select>

                  </div>

                  <div class="col-md-12 mb-3">
                    <label class="form-label">تخفیف</label>
                    <input v-model="variant.discount_value" type="number" class="form-control" />
                  </div>
                </td>
                <td>

                  <div class="col-md-12 mb-3">
                    <label class="form-label">شروع تخفیف</label>
                    <date-picker display-format="jYYYY/jMM/jDD" placeholder="از تاریخ" format="YYYY-MM-DD"
                      v-model="variant.discount_start_at"></date-picker>

                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label">پایان تخفیف</label>
                    <date-picker display-format="jYYYY/jMM/jDD" placeholder="از تاریخ" format="YYYY-MM-DD"
                      v-model="variant.discount_end_at"></date-picker>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" @click="saveStep2" :disabled="!variantCombinations.length || loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-save2"></i>
          <span class="mx-1">ذخیره مرحله دوم</span>
        </button>

        <button type="button" class="btn btn-outline-secondary" @click="skipStep2" :disabled="loading">
          <i class="bi bi-skip-forward"></i>
          <span class="mx-1">رد شدن از این مرحله</span>
        </button>
      </div>
    </div>

    <!-- مرحله سوم: مشخصات -->
    <div v-else-if="currentStep === 2">
      <div class="border-box speci">
        <h3>
          <i class="bi bi-table"></i>
          <span>جدول مشخصات</span>
        </h3>
        <form>
          <div class="col-md-12 mb-3">
            <label>مشخصات:</label>
            <Treeselect :valueFormat="'object'" v-model="selectedSpecification" :multiple="true"
              :options="specification" :normalizer="specificationNormalizer" />
          </div>

          <template v-for="ss in selectedSpecification" :key="ss.id">
            <div class="col-md-12 mb-3">
              <label>انتخاب {{ ss.title }}:</label>
              <Treeselect :valueFormat="'object'" v-model="selectedSpecificationValues[ss.id]" :multiple="true"
                :options="ss.values" :normalizer="attributeValuesNormalizer" />
            </div>
          </template>
        </form>
      </div>

      <button class="btn btn-primary mt-3" @click="saveStep3" :disabled="!selectedSpecification.length || loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        <i v-else class="bi bi-save2"></i>
        <span class="mx-1">ذخیره مرحله سوم</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, reactive, nextTick, computed } from 'vue'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import Editor from '@/components/shared/Editor.vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useAdmin } from '@/stores/modules/admin'

const store = useAdmin()
const checkPermission = store.checkPermission

const currentStep = ref(0)
const product = ref(null)
const loading = ref(false)

const steps = ref([
  { label: 'اطلاعات محصول', icon: 'bi bi-file-text', enabled: true, completed: false },
  { label: 'تنوع های محصول', icon: 'bi bi-palette', enabled: false, completed: false },
  { label: 'جدول مشخصات', icon: 'bi bi-table', enabled: false, completed: false },
])

const form = ref({
  title: '',
  images: [],
  description: '',
  categories: [],
  main_image: '',
  meta_title: '',
  meta_description: '',
  status: '',
  sales_channel: 'both',
  discount_value: '',
  published_at: '',
  discount_start_at: '',
  discount_end_at: '',
  discount_type: '',
  barcode: '',
  sku: '',
  stock: '',
  price: '',
  video: '',
})

const errors = ref({ step1: {}, step2: {}, step3: {} })

const categoryOptions = ref([])
const specification = ref([])
const attributes = ref([])
const variantCombinations = ref([])

const selectedSpecification = ref([])
const selectedSpecificationValues = reactive({})

const selectedAttibutes = ref([])
const attributeValue = reactive({})

// --- نرمالایزرها ---
const normalizer = (node) => ({ id: node.id, label: node.title, children: node.all_children })
const attributeNormalizer = (node) => ({ id: node.id, label: node.name })
const attributeValuesNormalizer = (node) => ({ id: node.id, label: node.value })
const specificationNormalizer = (node) => ({ id: node.id, label: node.title, values: node.values })

// --- فایل‌ها ---
function imageLoaded(files) {
  form.value.main_image = files?.[0]?.file ?? ''
}
function imageRemoved() {
  form.value.main_image = ''
}
function imagesLoaded(files) {
  form.value.images = files.map((file) => file.file)
}
function imagesRemoved(fileRecord, removeFn) {
  form.value.images = form.value.images.filter((f) => f !== fileRecord.file)
  removeFn()
}
function videoLoaded(files) {
  form.value.video = files?.[0]?.file ?? ''
}
function videoRemoved() {
  form.value.video = ''
}

// نام یک ویژگی بر اساس آیدی
function attrName(id) {
  const found = attributes.value.find((attr) => attr.id === id)
  return found ? found.name : 'گزینه‌ها'
}

// مقادیر یک ویژگی (با محافظت در برابر نبود attribute)
function attributeOptionsFor(attributeId) {
  const found = attributes.value.find((attr) => attr.id == attributeId)
  return found ? found.values : []
}

// فقط ویژگی‌هایی که واقعاً مقدار انتخاب‌شده دارن (برای هدر جدول)
const attributesWithValues = computed(() =>
  selectedAttibutes.value.filter(
    (id) => attributeValue[id] && attributeValue[id].length
  )
)

watch(
  attributeValue,
  () => {
    generateCombinations()
  },
  { deep: true }
)

onMounted(() => {
  loadCategories()
  loadAttributes()
  loadSpecification()
})

async function loadSpecification() {
  const res = await axios.get('/all-specification')
  specification.value = res.data.data
}
async function loadCategories() {
  const res = await axios.get('/categories')
  categoryOptions.value = res.data.data
}
async function loadAttributes() {
  const res = await axios.get('/attributes')
  attributes.value = res.data.data
}

/**
 * ساخت ترکیب‌های تنوع (cartesian product) برای تعداد دلخواه ویژگی.
 * نسخه قبلی فقط ۲ ویژگی اول رو در نظر می‌گرفت؛ این نسخه برای N ویژگی کار می‌کنه.
 */
async function generateCombinations() {
  await nextTick()

  const activeLists = attributesWithValues.value.map((id) => attributeValue[id])

  let newVariantList = []

  if (activeLists.length) {
    // cartesian product روی همه‌ی ویژگی‌های فعال
    newVariantList = activeLists.reduce(
      (acc, list) => {
        const result = []
        for (const combo of acc) {
          for (const item of list) {
            result.push([...combo, item])
          }
        }
        return result
      },
      [[]]
    ).map((values) => {
      const id = 'uid_' + values.map((v) => v.id).join('_')
      return {
        id,
        sku: '',
        discount_value: '',
        discount_start_at: '',
        discount_end_at: '',
        discount_type: '',
        price: product.value ? product.value.price : '',
        stock: product.value ? product.value.stock : '',
        values: values.map((v) => ({ id: v.id, value: v.value })),
      }
    })
  }

  // مقادیر قبلاً واردشده (sku/price/stock) رو برای ترکیب‌های تکراری حفظ کن
  newVariantList = newVariantList.map((newVariant) => {
    const existing = variantCombinations.value.find((old) => old.id === newVariant.id)
    return existing ?? newVariant
  })

  variantCombinations.value = newVariantList
}

async function saveStep1() {
  errors.value.step1 = {}
  loading.value = true
  try {
    const formData = new FormData()
    Object.keys(form.value).forEach((key) => {
      if (key === 'images') {
        form.value.images.forEach((imgfile) => {
          formData.append('images[]', imgfile)
        })
      } else if (key !== 'categories') {
        formData.append(key, form.value[key])
      }
    })
    form.value.categories.forEach((catId) => {
      formData.append('categories[]', catId)
    })

    const res = await axios.post('/products', formData)
    // بک‌اند مستقیماً آبجکت محصول رو برمی‌گردونه (بدون wrapper success/data)
    product.value = res.data

    steps.value[0].completed = true
    steps.value[1].enabled = true
    steps.value[2].enabled = true
    toast.success('مرحله اول با موفقیت ذخیره شد!')
  } catch (e) {
    if (e.response?.data?.errors) errors.value.step1 = e.response.data.errors
    toast.error('خطا در ذخیره مرحله اول')
  } finally {
    loading.value = false
  }
}

async function saveStep2() {
  errors.value.step2 = {}
  if (!variantCombinations.value.length) return

  const formData = new FormData()
  variantCombinations.value.forEach((v, index) => {
    formData.append(`variants[${index}][sku]`, v.sku)
    formData.append(`variants[${index}][price]`, v.price)
    formData.append(`variants[${index}][stock]`, v.stock ?? 0)
    formData.append(`variants[${index}][discount_value]`, v.discount_value ?? 0)
    formData.append(`variants[${index}][discount_start_at]`, v.discount_start_at ?? 0)
    formData.append(`variants[${index}][discount_end_at]`, v.discount_end_at ?? 0)
    formData.append(`variants[${index}][discount_type]`, v.discount_type ?? 0)
    v.values.forEach((AV) => {
      formData.append(`variants[${index}][values][]`, AV.id)
    })
  })

  loading.value = true
  try {
    await axios.post(`/product-variant/${product.value.id}/variants`, formData)
    steps.value[1].completed = true
    toast.success('مرحله دوم با موفقیت ذخیره شد!')
  } catch (e) {
    if (e.response?.data?.errors) errors.value.step2 = e.response.data.errors
    toast.error('خطا در ذخیره مرحله دوم')
  } finally {
    loading.value = false
  }
}

// رد شدن از مرحله تنوع — چون بک‌اند هنگام ساخت محصول یک تنوع پیش‌فرض می‌سازه،
// نیازی به درخواست API نیست؛ فقط مرحله رو تکمیل‌شده علامت بزن و برو جلو.
function skipStep2() {
  steps.value[1].completed = true
  currentStep.value = 2
}

async function saveStep3() {
  errors.value.step3 = {}
  if (!selectedSpecification.value.length) return

  const formData = new FormData()
  let index = 0
  for (const key in selectedSpecificationValues) {
    if (selectedSpecificationValues[key]) {
      selectedSpecificationValues[key].forEach((spec) => {
        formData.append(`specifications[${index}][specification_value_id]`, spec.id)
        formData.append(`specifications[${index}][specification_id]`, key)
        index++
      })
    }
  }

  loading.value = true
  try {
    await axios.post(`/sync-specification/${product.value.id}`, formData)
    steps.value[2].completed = true
    toast.success('مرحله سوم با موفقیت ذخیره شد!')
  } catch (e) {
    if (e.response?.data?.errors) errors.value.step3 = e.response.data.errors
    toast.error('خطا در ذخیره مرحله سوم')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.step-buttons {
  flex-wrap: wrap;
  width: max(70%, 380px);
  margin: auto;
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-btn.active {
  box-shadow: 0 0 0 2px #0d6efd inset;
}

@media (max-width: 768px) {
  .step-buttons {
    flex-direction: column;
    width: 100%;
  }

  .step-divider-wrap {
    transform: rotate(90deg);
    margin: 0.25rem 0;
  }
}

.border-box {
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 0 5px #1213;
}

.formSetp1 {
  display: grid;
  grid-template-columns: 9fr 3fr;
  width: 95%;
  margin: 24px auto;
}

@media (max-width: 768px) {
  .formSetp1 {
    grid-template-columns: 1fr;
    width: 100%;
  }
}

.speci,
.formSetp2 {
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 0 5px #1213;
  width: 95%;
  margin: 24px auto;
}

.metaBox {
  width: 95%;
  margin: 24px auto;
}

.g-3 {
  gap: 16px;
}
.steper {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
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
</style>
