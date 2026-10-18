<template>
    <div class="container mt-4" v-if="checkPermission(['order_store'])">
        <div class="row">
            <!-- ستون اصلی -->
            <div class="col-md-8 bg-gray">
                <h3 class="p-2">
                    <i class="bi bi-plus"></i>
                    <span>ثبت سفارش جدید</span>
                </h3>
                <form @submit.prevent="submitOrder" class="row g-3">
                    <!-- انتخاب کاربر -->
                    <div class="col-md-12">
                        <label class="form-label">انتخاب کاربر</label>
                        <multiselect @search-change="loadUsers" v-model="selectedUser" placeholder="انتخاب کاربر"
                            open-direction="bottom" :options="userOptions" label="label" track-by="id"
                            :searchable="true" :multiple="false" :close-on-select="true" :show-labels="false">
                            <template slot="noOptions">جستجو کنید</template>
                            <template slot="noResult">
                                <span v-if="isRequesting" v-text="'در حال جستجو...'" />
                                <span v-else v-text="'موردی یافت نشد'"></span>
                            </template>
                        </multiselect>
                    </div>

                    <!-- انتخاب آدرس -->
                    <div class="col-12" v-if="addresses.length && !form.parent_order">
                        <label class="form-label">آدرس</label>
                        <Treeselect v-model="selectedAddress" :multiple="false" :options="addresses"
                            placeholder="انتخاب آدرس..." />
                    </div>

                    <!-- افزودن به سفارش رزرو -->
                    <div v-if="reservedOrders.length" class="d-flex flex-column gap-2">
                        <label for="">افزودن به سفارش رزرو:</label>
                        <select v-model="form.parent_order" class="form-control" id="">
                            <option value="">سفارش عادی</option>
                            <option v-for="(item, index) in reservedOrders" :key="index" :value="item">
                                {{ `سفارش #${item.order_number} - ارسال به ${item.receiver_name} با
                                ${item.shipping_method}` }}
                            </option>
                        </select>
                        <small class="text-muted" v-if="form.parent_order">
                            هزینه حمل سفارش رزرو قبلاً پرداخت شده است
                        </small>
                    </div>

                    <!-- افزودن محصول -->
                    <div class="col-12 gap-2">
                        <div class="gap-2 d-flex flex-column align-items-start selectProduct">
                            <label class="form-label">افزودن محصول</label>
                            <multiselect @search-change="loadProducts" v-model="selectedProduct"
                                placeholder="انتخاب محصول" open-direction="bottom" :options="productOptions"
                                label="title" track-by="id" :searchable="true" :multiple="false" :close-on-select="true"
                                :show-labels="false">
                                <template slot="noOptions">جستجو کنید</template>
                                <template slot="noResult">
                                    <span v-if="isRequesting" v-text="'در حال جستجو...'" />
                                    <span v-else v-text="'موردی یافت نشد'"></span>
                                </template>
                            </multiselect>
                        </div>
                        <div class=" row mt-2 gap-2">
                            <div class="col-6">
                                <input v-model.number="selectedQuantity" type="number" min="1" class="form-control"
                                    placeholder="تعداد" />
                            </div>
                            <button type="button" class="btn btn-success col-4" @click="addProduct">افزودن</button>
                        </div>

                    </div>
                    <!-- لیست محصولات انتخاب‌شده -->
                    <div class="col-12" v-if="form.items.length">
                        <h5>محصولات انتخاب شده</h5>
                        <ul class="list-group">
                            <li v-for="(item, index) in form.items" :key="index"
                                class="list-group-item d-flex justify-content-between align-items-center">
                                {{ item.title }} × {{ item.quantity }}
                                <span>
                                    {{ (item.price * item.quantity).toLocaleString() }} تومان
                                    <button type="button" class="btn btn-sm btn-danger ms-2"
                                        @click="removeProduct(index)">حذف</button>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <!-- روش حمل و نقل -->
                    <template v-if="!form.parent_order">
                        <div v-if="form.items.length" class="col-12">
                            <label class="form-label">روش حمل و نقل</label>
                            <div v-if="shippingLoading" class="text-muted">در حال محاسبه...</div>
                            <Treeselect v-else-if="shippings.length" :normalizer="shippingNormalizer"
                                v-model="form.shipping_method" :multiple="false" :options="shippings"
                                placeholder="انتخاب روش حمل..." :valueFormat="'object'" />
                            <div v-else-if="!shippingLoading" class="text-warning">
                                روش حمل مناسبی یافت نشد
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="col-12">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                روش حمل از سفارش رزرو استفاده می‌شود و هزینه آن قبلاً پرداخت شده است
                            </div>
                        </div>
                    </template>
                </form>
            </div>

            <!-- ستون جمع سفارش -->
            <div class="col-md-4">
                <div class="card">
                    <div v-if="!form.parent_order" class="d-flex flex-column gap-2 p-3">
                        <label for="">نوع سفارش:</label>
                        <select v-model="form.reservation_type" class="form-control" id="">
                            <option value="">عادی</option>
                            <option value="three_days">رزرو سه روزه</option>
                            <option value="seven_days">رزرو هفت روزه</option>
                        </select>
                    </div>
                    <div class="card-header">
                        <h3><span>جمع سفارش</span></h3>
                    </div>
                    <div class="card-body">
                        <p v-if="wallet">موجودی کیف پول: <strong>{{ wallet.balance.toLocaleString() }} تومان</strong>
                        </p>
                        <p>جمع محصولات: <strong>{{ subtotal.toLocaleString() }} تومان</strong></p>
                        <p v-if="form.parent_order">
                            هزینه حمل: <strong class="text-success">رایگان (پوشش توسط رزرو)</strong>
                        </p>
                        <p v-else>
                            هزینه حمل: <strong>{{ shippingCost.toLocaleString() }} تومان</strong>
                        </p>
                        <p>تخفیف: <input type="number" class="form-control" v-model="discount_amount" min="0"></p>
                        <hr />
                        <h5>مبلغ نهایی: <strong>{{ total.toLocaleString() }} تومان</strong></h5>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <label for="">توضیحات سفارش :</label>
                        <textarea name="" class="form-control" v-model="user_note" id=""></textarea>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary w-100" @click="submitOrder" :disabled="loading">
                            {{ loading ? 'در حال ثبت...' : 'ثبت سفارش' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;

const form = ref({
    user_id: null,
    address_id: null,
    shipping_method: null,
    reservation_type: '',
    parent_order: '',
    items: []
});
let user_note = ref('');
let discount_amount = ref(0);
let selectedAddress = ref(null);
const addresses = ref([]);
const selectedProduct = ref(null);
const selectedQuantity = ref(1);
const shippingCost = ref(0);
const loading = ref(false);
const shippingLoading = ref(false);
let userOptions = ref([]);
let productOptions = ref([]);
let shippings = ref([]);
let selectedUser = ref(null);
let wallet = ref(null);
let reservedOrders = ref([]);
let reservationCost = ref(0);

// محاسبه جمع
const subtotal = computed(() =>
    form.value.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const total = computed(() => {
    let cost = form.value.parent_order ? 0 : shippingCost.value;
    return subtotal.value + cost - discount_amount.value;
});

// ابورت کنترلرها
let abortController = null;
let abortController1 = null;

// لود کاربران
const loadUsers = async (search) => {
    if (abortController) {
        abortController.abort();
    }
    abortController = new AbortController();
    const { data } = await axios.get('/users', {
        params: { search },
        signal: abortController.signal,
    });
    userOptions.value = data.data.map(u => ({
        id: u.id,
        label: u.full_name + ` - (${u.mobile})`,
        addresses: u.addresses,
        wallet: u.wallet
    }));
};

// لود محصولات
const loadProducts = async (search) => {
    if (!search || search.length < 2) return;
    if (abortController1) {
        abortController1.abort();
    }
    abortController1 = new AbortController();
    const { data } = await axios.get('/products-search', {
        params: { search },
        signal: abortController1.signal,
    });
    productOptions.value = await convertToSelectableProduct(data.data);
};

async function convertToSelectableProduct(productList) {
    let finalList = [];
    productList.forEach(product => {
        if (product.variants.length > 1) {
            product.variants.filter(a => a.stock).forEach((variant) => {

                let obj = {
                    id: variant.id,
                    product_id: product.id,
                    price: variant.price,
                    title: `${variant.id} - ${product.title} || ${variant.values.map((att) => att.value).join("-")} || موجودی: ${variant.stock}`,
                    isDisabled: variant.stock > 0 ? false : true
                };
                finalList.push(obj);
            });
        } else if (product.variants.length == 1 && product.variants[0].stock != 0) {
            let obj = {
                isDisabled: product.variants[0].stock > 0 ? false : true,
                id: product.variants[0].id,
                title: product.variants[0].id + " - " + product.title,
                price: product.price,
                product_id: product.id
            };
            finalList.push(obj);
        }
    });
    return finalList;
}

// واچ برای تغییر کاربر
watch(() => selectedUser.value, async (newUser) => {
    if (newUser) {
        fetchAddresses(newUser.addresses);
        wallet.value = newUser.wallet;
        await loadReservedOrders(newUser.id);
    } else {
        addresses.value = [];
        wallet.value = null;
        reservedOrders.value = [];
    }
});

// واچ برای تغییر آدرس
watch(() => selectedAddress.value, async (newAddress) => {
    if (newAddress) {
        await calculateShipping();
    } else {
        shippings.value = [];
        shippingCost.value = 0;
    }
});

// واچ برای تغییر سفارش والد
watch(() => form.value.parent_order, async (val) => {
    if (val) {
        // اگر سفارش رزرو انتخاب شده، هزینه حمل صفر می‌شود
        shippingCost.value = 0;
        form.value.shipping_method = null;
        shippings.value = [];

        // نمایش پیام
        toast.info('هزینه حمل با سفارش رزرو پوشش داده می‌شود');
    } else {
        // اگر انتخاب رزرو برداشته شد، دوباره محاسبه کن
        await calculateShipping();
    }
});

// دریافت آدرس‌های کاربر
const fetchAddresses = (asses) => {
    addresses.value = asses.map(a => ({
        id: a.id,
        label: `${a.receiver_name} - ${a.address_line} - ${a.phone}`
    }));
};

// دریافت سفارش‌های رزرو شده کاربر
const loadReservedOrders = async (userId) => {
    try {
        const { data } = await axios.get('/user-reservations', {
            params: { user_id: userId }
        });
        reservedOrders.value = data.data || [];
    } catch (error) {
        console.error('Error loading reservations:', error);
        reservedOrders.value = [];
    }
};

// محاسبه روش‌های حمل و نقل
const calculateShipping = async () => {
    if (!selectedAddress.value || !form.value.items.length) {
        shippings.value = [];
        shippingCost.value = 0;
        return;
    }

    shippingLoading.value = true;
    try {
        const params = {
            address_id: selectedAddress.value,
            subtotal: subtotal.value,
            quantity: form.value.items.reduce((sum, item) => sum + item.quantity, 0),
        };

        // اگر سفارش رزرو وجود دارد
        if (form.value.parent_order) {
            params.reservation_order_id = form.value.parent_order.order_number;
        }

        const { data } = await axios.post('/calculate-shipping-with-reservation', params);

        if (data.success) {
            shippings.value = data.data || [];

            if (data.has_reservation && data.reservation_method_invalid) {
                toast.warning('روش حمل سفارش رزرو شما معتبر نیست، لطفاً روش دیگری را انتخاب کنید');
            }

            // اگر یک روش خاص برای رزرو برگردانده شده
            if (data.data && data.data.length === 1 && data.data[0].is_reservation_method) {
                shippings.value = data.data;
                shippingCost.value = 0;
                // انتخاب خودکار روش رزرو
                form.value.shipping_method = data.data[0];
                toast.info('روش حمل سفارش رزرو شما');
            } else if (data.data && data.data.length > 0) {
                // انتخاب اولین روش به صورت پیش‌فرض
                form.value.shipping_method = data.data[0];
                shippingCost.value = data.data[0].cost || 0;
            }
        }
    } catch (error) {
        console.error('Error calculating shipping:', error);
        toast.error('خطا در محاسبه هزینه حمل');
    } finally {
        shippingLoading.value = false;
    }
};

const shippingNormalizer = (node) => {
    return {
        id: node.id,
        label: node.name + (node.cost !== undefined ? ` (${node.cost.toLocaleString()} تومان)` : ''),
    };
};

// افزودن محصول
const addProduct = () => {
    if (!selectedProduct.value || selectedQuantity.value < 1) {
        return toast.error('لطفاً محصول و تعداد را انتخاب کنید');
    }
    const product = selectedProduct.value;
    let findedIndex = form.value.items.findIndex(item => item.id == product.id);
    if (findedIndex != -1) {
        form.value.items[findedIndex].quantity += selectedQuantity.value;
    } else {
        form.value.items.push({
            id: product.id,
            product_id: product.product_id,
            title: product.title,
            price: product.price,
            quantity: selectedQuantity.value
        });
    }
    selectedQuantity.value = 1;
    calculateShipping();
};

// حذف محصول
const removeProduct = (index) => {
    form.value.items.splice(index, 1);
    calculateShipping();
};

// واچ برای تغییر روش حمل
watch(() => form.value.shipping_method, (val) => {
    if (val && !form.value.parent_order) {
        shippingCost.value = val.cost || 0;
    }
});

// واچ برای تغییر نوع رزرو
watch(() => form.value.reservation_type, () => {
    // نیازی به محاسبه مجدد نیست
});

// ثبت سفارش
const submitOrder = async () => {
    if (!selectedUser.value) {
        return toast.error('لطفاً کاربر را انتخاب کنید');
    }
    if (!selectedAddress.value) {
        return toast.error('لطفاً آدرس را انتخاب کنید');
    }
    if (!form.value.items.length) {
        return toast.error('لطفاً حداقل یک محصول اضافه کنید');
    }
    if (!form.value.parent_order && !form.value.shipping_method) {
        return toast.error('لطفاً روش حمل را انتخاب کنید');
    }

    loading.value = true;
    try {
        let formData = new FormData();
        formData.append("user_id", selectedUser.value.id);
        formData.append("address_id", selectedAddress.value);
        formData.append("subtotal", subtotal.value);
        formData.append("discount_amount", discount_amount.value || 0);

        // اگر سفارش رزرو باشد
        if (form.value.parent_order) {
            formData.append("parent_order_id", form.value.parent_order.order_number);
            formData.append("shipping_id", form.value.parent_order.shipping_id);
            formData.append("shipping_cost", 0);
        } else {
            formData.append("shipping_id", form.value.shipping_method.id);
            formData.append("shipping_cost", shippingCost.value);
            if (form.value.reservation_type) {
                formData.append("reservation_type", form.value.reservation_type);
            }
        }

        formData.append("total", total.value);
        formData.append("user_note", user_note.value);

        form.value.items.forEach((item, index) => {
            formData.append(`items[${index}][product_id]`, item.product_id);
            formData.append(`items[${index}][product_variant_id]`, item.id);
            formData.append(`items[${index}][quantity]`, item.quantity);
            formData.append(`items[${index}][price]`, item.price);
        });

        const response = await axios.post('/orders-create-by-admin', formData);

        toast.success('سفارش با موفقیت ثبت شد');

        // ریست کردن فرم
        form.value = {
            user_id: null,
            address_id: null,
            shipping_method: null,
            reservation_type: '',
            parent_order: '',
            items: []
        };
        addresses.value = [];
        shippingCost.value = 0;
        wallet.value = null;
        selectedUser.value = null;
        selectedAddress.value = null;
        reservedOrders.value = [];
        discount_amount.value = 0;

    } catch (error) {
        console.error('Error submitting order:', error);
        toast.error(error.response?.data?.message || 'خطا در ثبت سفارش');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.card {
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.selectProduct {
    display: grid;
    grid-template-columns: 10fr 1fr 2fr;
    gap: 8px;
}
</style>