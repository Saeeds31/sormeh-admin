<template>
  <div class="product-edit container py-4" v-if="checkPermission(['product_update'])">
    <!-- دکمه‌های مرحله‌ای -->
    <div class="step-buttons d-flex flex-wrap align-items-center justify-content-center mb-4">
      <template v-for="(step, index) in steps" :key="index">

        <button class="btn btn-primary d-flex align-items-end me-2 mb-2  steper"
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

    <!-- اسکلتون لودینگ اولیه -->
    <div v-if="initialLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">در حال بارگذاری اطلاعات محصول...</p>
    </div>

    <template v-else>
      <!-- مرحله اول: اطلاعات اصلی محصول -->
      <div class="bg-gray" v-if="currentStep === 0">
        <h3>
          <i class="bi bi-info"></i>
          <span>مرحله اول: اطلاعات اصلی محصول</span>
        </h3>
        <form @submit.prevent="saveStep1">
          <fieldset :disabled="loading">
            <div class="formSetp1 g-3">
              <div class="border-box row">
                <!-- عنوان و قیمت -->
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

                <!-- دسته‌بندی‌ها -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">دسته‌بندی‌ها</label>
                  <Treeselect v-model="form.categories" :multiple="true" :options="categoryOptions"
                    :normalizer="normalizer" />
                  <span v-if="errors.step1.categories" class="text-danger">{{ errors.step1.categories[0] }}</span>
                </div>

                <!-- بارکد، SKU، موجودی -->
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

                <!-- توضیحات -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">توضیحات</label>
                  <Editor v-model="form.description" />
                  <span v-if="errors.step1.description" class="text-danger">{{ errors.step1.description[0] }}</span>
                </div>

                <!-- تصاویر -->
                <div class="col-md-12 mb-3">
                  <label class="form-label">تصاویر</label>
                  <VueFileAgent v-model:rawModelValue="oldImages" @select="imagesLoaded" @beforedelete="imageDeleted"
                    :multiple="true" accept=".jpg,.png,.webp" theme="grid" deletable sortable />
                  <span v-if="errors.step1.images" class="text-danger">{{ errors.step1.images[0] }}</span>
                </div>
                <div class="col-md-12 mb-3">
                  <label class="form-label">ویدئو</label>
                  <VueFileAgent :raw-model-value="oldMainVideo" @select="videoLoaded" @beforedelete="mainVideoRemoved"
                    @update:rawModelValue="onMainVideoChange" :maxFiles="1" accept=".mp4,.mov,.avi" theme="grid"
                    deletable sortable />
                  <span v-if="errors.step1.video" class="text-danger">{{ errors.step1.video[0] }}</span>
                </div>
              </div>

              <div class="border-box">
                <b-col cols="12">
                  <b-form-group>
                    <b-form-checkbox id="status" v-model="form.is_rechargeable" :true-value="1" :false-value="0">
                      نمایش در لیست شارژ مجدد
                    </b-form-checkbox>
                  </b-form-group>
                </b-col>
                <div class="col-md-12 mb-3">
                  <label class="form-label">تصویر اصلی</label>
                  <VueFileAgent :raw-model-value="oldMainImage" @select="imageLoaded" @beforedelete="mainImageRemoved"
                    :maxFiles="1" accept=".jpg,.png" theme="grid" deletable sortable />
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
                <!-- وضعیت و تخفیف -->
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
                <div class="col-md-12 mb-3" v-if="form.status == 'draft'">
                  <label class="form-label">تاریخ انتشار</label>
                  <date-picker type="datetime" display-format="jYYYY/jMM/jDD HH:mm" placeholder="از تاریخ"
                    format="YYYY-MM-DD HH:mm" v-model="form.published_at"></date-picker>
                  <span v-if="errors.step1.published_at" class="text-danger">{{ errors.step1.published_at[0]
                  }}</span>
                </div>
                <div class="col-md-12 mb-3">
                  <label class="form-label">نوع تخفیف</label>
                  <select v-model="form.discount_type" class="form-select">
                    <option value="">انتخاب کنید</option>
                    <option value="fixed">ثابت</option>
                    <option value="percent">درصدی</option>
                  </select>
                  <span v-if="errors.step1.discount_type" class="text-danger">{{ errors.step1.discount_type[0] }}</span>
                </div>
                <div class="col-md-12 mb-3">
                  <label class="form-label">مقدار تخفیف</label>
                  <input v-model="form.discount_value" type="number" class="form-control" />
                  <span v-if="errors.step1.discount_value" class="text-danger">{{ errors.step1.discount_value[0]
                  }}</span>
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
              <!-- متا -->
              <div class="col-md-12 mb-3">
                <label class="form-label">عنوان متا</label>
                <input v-model="form.meta_title" type="text" class="form-control" />
                <span v-if="errors.step1.meta_title" class="text-danger">{{ errors.step1.meta_title[0] }}</span>
              </div>
              <div class="col-md-12 mb-3">
                <label class="form-label">توضیحات متا</label>
                <textarea v-model="form.meta_description" class="form-control"></textarea>
                <span v-if="errors.step1.meta_description" class="text-danger">{{ errors.step1.meta_description[0]
                }}</span>
              </div>
            </div>
          </fieldset>

          <button type="submit" :disabled="loading" class="btn btn-primary mt-3">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-save2"></i>
            <span class="mx-2">ذخیره مرحله اول</span>
          </button>
        </form>
      </div>

      <!-- مرحله دوم: واریانت‌ها -->
      <div class="bg-gray" v-else-if="currentStep === 1">
        <h3>
          <i class="bi bi-palette"></i>
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
                <tr v-for="variant in variantCombinations" :key="variant.uid">
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
                        <option value="fixed">ثابت</option>
                        <option value="percent">درصدی</option>
                      </select>
                    </div>
                    <div class="col-md-12 mb-3">
                      <label class="form-label">مقدار تخفیف</label>
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
      <div class="bg-gray" v-else-if="currentStep === 2">
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
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import Editor from '@/components/shared/Editor.vue'
import { toast } from 'vue3-toastify'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin'

const store = useAdmin()
const checkPermission = store.checkPermission
const route = useRoute()
const productId = route.params.id

// baseImageAddress در main.js روی window تعریف شده
const baseImageAddress = window.baseImageAddress

const currentStep = ref(0)
const product = ref(null)
const loading = ref(false)
const initialLoading = ref(true)

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
  is_rechargeable: false,
  meta_title: '',
  meta_description: '',
  status: '',
  sales_channel: 'both',
  discount_value: '',
  discount_start_at: '',
  published_at: '',
  discount_end_at: '',
  discount_type: '',
  barcode: '',
  sku: '',
  stock: '',
  price: '',
  video: '',
})

const errors = ref({ step1: {}, step2: {}, step3: {} })

// آپلودر فایل‌ها
const mainImageChanged = ref(false)
const mainVideoChanged = ref(false)
const deletedImages = ref([])
const backupImages = ref([])
const oldMainImage = ref([])
const oldMainVideo = ref([])
const oldImages = ref([])

const categoryOptions = ref([])
const attributes = ref([])
const variantCombinations = ref([])
const backupVariantCombinations = ref([])

// پرچم برای جلوگیری از تولید زودهنگام ترکیبات هنگام لود اولیه‌ی داده
const isHydrating = ref(true)

const selectedAttibutes = ref([])
const attributeValue = reactive({})

const specification = ref([])
const selectedSpecification = ref([])
const selectedSpecificationValues = reactive({})

// --- نرمالایزرها ---
const normalizer = (node) => ({ id: node.id, label: node.title, children: node.all_children })
const attributeNormalizer = (node) => ({ id: node.id, label: node.name })
const attributeValuesNormalizer = (node) => ({ id: node.id, label: node.value })
const specificationNormalizer = (node) => ({ id: node.id, label: node.title, values: node.values })

function attrName(id) {
  const attr = attributes.value.find((a) => a.id == id)
  return attr ? attr.name : 'گزینه‌ها'
}

function attributeOptionsFor(attributeId) {
  const found = attributes.value.find((attr) => attr.id == attributeId)
  return found ? found.values : []
}

const attributesWithValues = computed(() =>
  selectedAttibutes.value.filter((id) => attributeValue[id] && attributeValue[id].length)
)

// --- تولید ترکیب‌های تنوع برای هر تعداد ویژگی (cartesian product) ---
function generateCombinations() {
  const activeLists = attributesWithValues.value.map((id) => attributeValue[id])

  let newVariantList = []

  if (activeLists.length) {
    newVariantList = activeLists
      .reduce(
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
      )
      .map((values) => {
        const uid = 'uid_' + values.map((v) => v.id).join('_')
        return {
          uid,
          id: '',
          sku: '',
          discount_value: '',
          discount_start_at: '',
          discount_end_at: '',
          discount_type: '',
          price: '',
          stock: '',
          values: values.map((v) => ({ id: v.id, value: v.value })),
        }
      })
  }

  // حفظ مقادیر sku/price/stock/id برای ترکیب‌هایی که از قبل وجود داشتن
  newVariantList = newVariantList.map((newVariant) => {
    const existing = variantCombinations.value.find((old) => old.uid === newVariant.uid)
    return existing ? { ...existing, values: newVariant.values } : newVariant
  })

  variantCombinations.value = newVariantList
}

// حذف مقادیر ویژگی‌هایی که از انتخاب خارج شدن
function cleanupAttributeValues() {
  for (const keyId in attributeValue) {
    if (!selectedAttibutes.value.includes(Number(keyId))) {
      delete attributeValue[keyId]
    }
  }
}

watch(
  attributeValue,
  () => {
    if (!isHydrating.value) generateCombinations()
  },
  { deep: true }
)

watch(
  selectedAttibutes,
  () => {
    if (isHydrating.value) return
    cleanupAttributeValues()
    generateCombinations()
  },
  { deep: true }
)

onMounted(async () => {
  try {
    await Promise.all([loadCategories(), loadAttributes(), loadSpecification()])
    await loadProduct()
  } catch (e) {
    toast.error('خطا در بارگذاری اطلاعات محصول')
  } finally {
    initialLoading.value = false
  }
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

async function loadProduct() {
  const res = await axios.get(`/products/${productId}`)
  product.value = res.data

  Object.assign(form.value, {
    title: product.value.title,
    is_rechargeable: Number(product.value.is_rechargeable),
    description: product.value.description,
    categories: product.value.categories.map((c) => c.id),
    meta_title: product.value.meta_title,
    meta_description: product.value.meta_description,
    status: product.value.status,
    sales_channel: product.value.sales_channel,
    discount_value: product.value.discount_value,
    discount_start_at: product.value.discount_start_at,
    published_at: product.value.published_at,
    discount_end_at: product.value.discount_end_at,
    discount_type: product.value.discount_type,
    barcode: product.value.barcode,
    sku: product.value.sku,
    stock: product.value.stock,
    price: product.value.price,
  })

  backupImages.value = product.value.images ?? []

  if (product.value.video) {
    oldMainVideo.value = [
      {
        name: product.value.video.split('/').pop(),
        size: 0,
        type: 'video/*',
        ext: product.value.video.split('.').pop(),
        url: `${baseImageAddress}${product.value.video}`,
      },
    ]
  }

  if (product.value.main_image) {
    oldMainImage.value = [
      {
        name: product.value.main_image.split('/').pop(),
        size: 0,
        type: 'image/jpeg',
        ext: product.value.main_image.split('.').pop(),
        url: `${baseImageAddress}${product.value.main_image}`,
      },
    ]
  }

  if (product.value.images && product.value.images.length) {
    oldImages.value = product.value.images.map((img) => ({
      id: img.id,
      name: img.path.split('/').pop(),
      size: 0,
      type: 'image/jpeg',
      ext: img.path.split('.').pop(),
      url: `${baseImageAddress}${img.path}`,
    }))
  }

  steps.value[0].completed = true
  steps.value[1].enabled = true
  steps.value[2].enabled = true

  // بارگذاری واریانت‌های موجود
  if (product.value.variants && product.value.variants.length) {
    selectedAttibutes.value = []
    variantCombinations.value = []

    product.value.variants.forEach((v) => {
      let uid = 'uid'
      v.values.forEach((val) => {
        uid += `_${val.id}`
        if (!selectedAttibutes.value.includes(Number(val.attribute_id))) {
          selectedAttibutes.value.push(Number(val.attribute_id))
        }
        if (!attributeValue[val.attribute_id]) {
          attributeValue[val.attribute_id] = []
        }
        if (attributeValue[val.attribute_id].findIndex((av) => av.id == val.id) === -1) {
          attributeValue[val.attribute_id].push({ id: val.id, value: val.value })
        }
      })

      variantCombinations.value.push({
        price: v.price,
        uid,
        id: v.id,
        sku: v.sku,
        discount_value: v.discount_value,
        discount_start_at: v.discount_start_at,
        discount_end_at: v.discount_end_at,
        discount_type: v.discount_type,
        stock: v.stock,
        values: v.values.map((val) => ({ id: val.id, value: val.value })),
      })
    })

    backupVariantCombinations.value = JSON.parse(JSON.stringify(variantCombinations.value))
  }

  // بارگذاری مشخصات موجود
  if (product.value.specifications && product.value.specifications.length) {
    product.value.specifications.forEach((item) => {
      let minimalObj = item;
      minimalObj.values = specification.value.find(it => it.id == item.id)?.values || []
      selectedSpecification.value.push(minimalObj);
      selectedSpecificationValues[item.id] = item.values;
    })
  }
  console.log(selectedSpecification.value, selectedSpecificationValues);

  // از این به بعد watch ها فعال می‌شن و دیگه دیتای هیدریت‌شده بازنویسی نمی‌شه
  isHydrating.value = false
}

// --- فایل‌ها ---
// آپلودر گالری تصاویر (چندتایی)
function imagesLoaded(files) {
  form.value.images = files.map((f) => f.file)
}
function imageDeleted(fileRecord, removeFn) {
  // اگه عکس از تصاویر قدیمی (دارای id) بود، برای حذف سمت سرور علامت بزن
  if (fileRecord.id) {
    deletedImages.value.push(fileRecord.id)
  } else {
    // عکس تازه‌آپلودشده‌ای که هنوز سیو نشده، فقط از لیست ارسال خارج می‌شه
    form.value.images = form.value.images.filter((f) => f !== fileRecord.file)
  }
  removeFn()
}

// آپلودر تصویر اصلی (تکی)
function imageLoaded(files) {
  form.value.main_image = files?.[0]?.file ?? ''
  mainImageChanged.value = true
}
function videoLoaded(files) {
  form.value.video = files?.[0]?.file ?? ''
}


function mainImageRemoved(_, removeFn) {

  mainImageChanged.value = true
  form.value.main_image = ''
}
function onMainVideoChange() {
  mainVideoChanged.value = true
}
function mainVideoRemoved(_, removeFn) {
  mainVideoChanged.value = true
  form.value.video = ''
  removeFn()
}

async function saveStep1() {
  errors.value.step1 = {}
  loading.value = true

  try {
    const formData = new FormData()

    Object.keys(form.value).forEach((key) => {
      if (key === 'images') return // جدا مدیریت می‌شه
      if (key === 'categories') return // جدا مدیریت می‌شه

      if (key === 'video') {
        if (mainVideoChanged.value) {
          // کاربر فایل جدید گذاشته یا حذف کرده؛ اگه خالیه یعنی حذف شده
          if (form.value.video) formData.append('video', form.value.video)
          else formData.append('remove_video', '1')
        }
        // اگه تغییری نداده، چیزی ارسال نمی‌کنیم تا ویدیوی فعلی دست‌نخورده بماند
        return
      }
      if (key == 'is_rechargeable') {
        formData.append('is_rechargeable', Number(form.value.is_rechargeable))

        return
      }
      if (key === 'main_image') {
        if (mainImageChanged.value) {
          if (form.value.main_image) formData.append('main_image', form.value.main_image)
          else formData.append('main_image', '')
        } else {
          formData.append('main_image', product.value.main_image)
        }
        return
      }

      // سایر فیلدها؛ شامل مقادیر خالی/صفر هم می‌شه (برخلاف نسخه قبلی)
      const value = form.value[key]
      formData.append(key, value === null || value === undefined ? '' : value)
    })

    form.value.images.forEach((img) => {
      formData.append('images[]', img)
    })

    if (form.value.categories && form.value.categories.length) {
      form.value.categories.forEach((catId) => formData.append('categories[]', catId))
    }

    if (deletedImages.value.length) {
      deletedImages.value.forEach((id) => formData.append('deleted_images[]', id))
    }

    formData.append('_method', 'PUT')
    const res = await axios.post(`/products/${productId}`, formData)
    product.value = res.data

    steps.value[0].completed = true
    steps.value[1].enabled = true
    steps.value[2].enabled = true
    toast.success('مرحله اول با موفقیت بروزرسانی شد!');
    loadProduct()
  } catch (e) {
    console.log(e);

    if (e.response?.data?.errors) errors.value.step1 = e.response.data.errors
    toast.error('خطا در ذخیره مرحله اول')
  } finally {
    loading.value = false
  }
}

async function saveStep2() {
  errors.value.step2 = {}

  if (!variantCombinations.value.length) {
    toast.warning('هیچ تنوعی برای ذخیره وجود ندارد')
    return
  }

  const validVariants = variantCombinations.value.filter((v) => v.values && v.values.length > 0)

  if (!validVariants.length) {
    toast.warning('هیچ ترکیب معتبری برای ذخیره وجود ندارد')
    return
  }

  const formData = new FormData()
  formData.append('product_id', product.value.id)

  validVariants.forEach((v, index) => {
    formData.append(`variants[${index}][id]`, v.id || '')
    formData.append(`variants[${index}][sku]`, v.sku || '')
    formData.append(`variants[${index}][price]`, v.price || 0)
    formData.append(`variants[${index}][stock]`, v.stock ?? 0)
    formData.append(`variants[${index}][discount_value]`, v.discount_value ?? 0)
    formData.append(`variants[${index}][discount_start_at]`, v.discount_start_at ?? '')
    formData.append(`variants[${index}][discount_end_at]`, v.discount_end_at ?? '')
    formData.append(`variants[${index}][discount_type]`, v.discount_type ?? "")
    v.values.forEach((AV) => {
      if (AV && AV.id) formData.append(`variants[${index}][values][]`, AV.id)
    })
  })

  loading.value = true
  try {
    await axios.post(`/products-variants/${product.value.id}/update-all`, formData)
    steps.value[1].completed = true
    backupVariantCombinations.value = JSON.parse(JSON.stringify(variantCombinations.value))
    toast.success('مرحله دوم با موفقیت بروزرسانی شد!')
  } catch (e) {
    if (e.response?.data?.errors) errors.value.step2 = e.response.data.errors
    toast.error('خطا در ذخیره مرحله دوم: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

// رد شدن از مرحله تنوع بدون تماس با API (مثلاً وقتی محصول از قبل واریانت دارد
// و کاربر فقط می‌خواد بدون تغییر به مرحله بعد برود)
function skipStep2() {
  steps.value[1].completed = true
  currentStep.value = 2
}

async function saveStep3() {

  errors.value.step3 = {}

  if (!selectedSpecification.value.length) {
    toast.warning('هیچ مشخصه‌ای برای ذخیره انتخاب نشده است')
    return
  }

  const formData = new FormData()
  let index = 0

  for (const key in selectedSpecificationValues) {
    if (selectedSpecificationValues[key] && selectedSpecificationValues[key].length) {
      selectedSpecificationValues[key].forEach((spec) => {
        // spec یک آبجکت {id, value} است (طبق valueFormat: 'object')
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
    toast.error('خطا در ذخیره مرحله سوم: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.step-buttons {
  flex-wrap: wrap;
  width: max(80%, 380px);
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