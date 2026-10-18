<template>
    <div class="print-wrapper" v-if="checkPermission(['order_view'])">

        <!-- ================= TOOLBAR ================= -->
        <div class="print-toolbar">
            <div class="toolbar-content">
                <div class="toolbar-brand">
                    <div class="brand-mark overflow-hidden">
                        <img src="@/assets/images/logo.png" width="72" alt="">
                    </div>
                    <div>
                        <strong>سرمه </strong>
                        <span>مرکز مدیریت سفارشات</span>
                    </div>
                </div>

                <div class="toolbar-meta">
                    <div class="toolbar-chip">
                        <i class="bi bi-receipt"></i>
                        <span>{{ orders.length }} سفارش</span>
                    </div>
                    <div class="toolbar-chip">
                        <i class="bi bi-printer"></i>
                        <span>{{ printType === 'full' ? 'فاکتور سفارش' : 'برچسب ارسال' }}</span>
                    </div>
                </div>

                <div class="toolbar-actions">
                    <button @click="handlePrint" class="btn-print">
                        <i class="bi bi-printer-fill"></i>
                        <span>چاپ</span>
                    </button>
                    <router-link to="/orders" class="btn-back">
                        <i class="bi bi-arrow-right"></i>
                        <span>بازگشت</span>
                    </router-link>
                </div>
            </div>
        </div>

        <!-- ================= LOADING ================= -->
        <div v-if="loading" class="loading-state">
            <div class="loading-box">
                <div class="loading-spinner"></div>
                <strong>در حال آماده‌سازی سفارش‌ها</strong>
                <span>لطفاً چند لحظه صبر کنید...</span>
            </div>
        </div>

        <!-- ================= EMPTY ================= -->
        <div v-else-if="orders.length === 0" class="empty-state">
            <div class="empty-icon">
                <i class="bi bi-inbox"></i>
            </div>
            <h3>سفارشی برای نمایش وجود ندارد</h3>
            <p>لطفاً سفارش‌های مورد نظر را انتخاب کنید.</p>
            <router-link to="/orders" class="empty-button">
                <i class="bi bi-arrow-right"></i>
                بازگشت به سفارش‌ها
            </router-link>
        </div>

        <!-- ================= PRINT ================= -->
        <div id="printSection">

            <div class="print-body">

                <!-- ================= FULL PRINT (A4 - 2 per page) ================= -->
                <template v-if="printType === 'full'">

                    <div class="invoice-page">
                        <div v-for="(order, index) in orders" :key="order.id" class="invoice-a4">

                            <!-- ===== باکس بالا: اطلاعات فروشگاه ===== -->
                            <div class="box box-store">
                                <div class="store-header">
                                    <div class="store-title">
                                        <strong>فروشگاه سرمه </strong>
                                    </div>
                                    <div class="store-date">
                                        <span>تاریخ چاپ:</span>
                                        <strong>{{ getCurrentDate() }}</strong>
                                    </div>
                                </div>

                                <div class="store-row">
                                    <div class="store-cell">
                                        <span class="cell-label">عنوان وبسایت:</span>
                                        <strong class="cell-value">sormeh-online.com</strong>
                                    </div>
                                    <div class="store-cell">
                                        <span class="cell-label">شناسه سفارش:</span>
                                        <strong class="cell-value">#{{ String(order.id).padStart(5, '0') }}</strong>
                                    </div>
                                </div>

                                <div class="store-row">
                                    <div class="store-cell">
                                        <span class="cell-label">تلفن:</span>
                                        <strong class="cell-value">09375015769</strong>
                                    </div>
                                    <div class="store-cell">
                                        <span class="cell-label">شیوه ارسال:</span>
                                        <strong class="cell-value">{{ order?.shipping?.title }}</strong>
                                    </div>
                                </div>

                                <div class="store-row">
                                    <div class="store-cell">
                                        <span class="cell-label">کدپستی:</span>
                                        <strong class="cell-value">4917765197</strong>
                                    </div>
                                    <div class="store-cell full-width">
                                        <span class="cell-label">آدرس:</span>
                                        <strong class="cell-value">
                                            گلستان - گرگان - خیابان پنج آذر - آذر چهارم - جنب داروخانه
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== باکس وسط: اطلاعات گیرنده ===== -->
                            <div class="box box-receiver">
                                <div class="receiver-header">
                                    <strong>اطلاعات گیرنده</strong>
                                </div>

                                <div class="receiver-grid">
                                    <div class="receiver-item">
                                        <span class="cell-label">گیرنده:</span>
                                        <strong class="cell-value">{{ order.user?.full_name ?? '-' }}</strong>
                                    </div>
                                    <div class="receiver-item">
                                        <span class="cell-label">کدپستی:</span>
                                        <strong class="cell-value">{{ order.address?.postal_code ?? '-' }}</strong>
                                    </div>
                                    <div class="receiver-item">
                                        <span class="cell-label">تلفن:</span>
                                        <strong class="cell-value">{{ order.user?.mobile ?? '-' }}</strong>
                                    </div>
                                    <div class="receiver-item">
                                        <span class="cell-label">تاریخ سفارش:</span>
                                        <strong class="cell-value">{{ new
                                            Date(order.created_at).toLocaleDateString('fa-IR') }}</strong>
                                    </div>
                                </div>

                                <div class="receiver-address">
                                    <span class="cell-label">آدرس:</span>
                                    <strong class="cell-value">
                                        {{ order.address?.province?.name ?? '' }} -
                                        {{ order.address?.city?.name ?? '' }} -
                                        {{ order.address?.address_line ?? '-' }}
                                    </strong>
                                </div>
                            </div>

                            <!-- ===== جدول آیتم‌ها (اصلی + فرزند) ===== -->
                            <div class="box box-table">
                                <table class="items-table">
                                    <thead>
                                        <tr>
                                            <th class="col-specs">مشخصات</th>
                                            <th class="col-index">#</th>
                                            <th class="col-product">محصول</th>
                                            <th class="col-price">قیمت</th>
                                            <th class="col-discount">تخفیف</th>
                                            <th class="col-qty">تعداد</th>
                                            <th class="col-total">مبلغ کل</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- آیتم‌های سفارش اصلی -->
                                        <tr v-for="(item, idx) in order.items" :key="item.id">
                                            <td class="cell-specs">
                                                <template v-if="item.variant?.values?.length">
                                                    <span v-for="val in item.variant.values" :key="val.id"
                                                        class="spec-line">
                                                        {{ val.attribute ? val.attribute.name + ' ' : '' }}{{ val.value
                                                        }}
                                                    </span>
                                                </template>
                                                <span v-else class="muted">-</span>
                                            </td>
                                            <td class="cell-index">{{ String(idx + 1).padStart(2, '0') }}</td>
                                            <td class="cell-product">{{ item.product?.title ?? '-' }}</td>
                                            <td class="cell-price">{{ Number(item.price).toLocaleString('fa-IR') }}</td>
                                            <td class="cell-discount">{{ Number(item.discount ??
                                                0).toLocaleString('fa-IR') }}</td>
                                            <td class="cell-qty">{{ item.quantity }}</td>
                                            <td class="cell-total">{{ Number(item.price *
                                                item.quantity).toLocaleString('fa-IR') }}</td>
                                        </tr>

                                        <!-- آیتم‌های سفارشات فرزند (ادامه شماره‌گذاری) -->
                                        <template v-for="child in order.child_orders || []" :key="'child-' + child.id">
                                            <tr v-for="(item, cidx) in child.items" :key="item.id">
                                                <td class="cell-specs">
                                                    <template v-if="item.variant?.values?.length">
                                                        <span v-for="val in item.variant.values" :key="val.id"
                                                            class="spec-line">
                                                            {{ val.attribute ? val.attribute.name + ' ' : '' }}{{
                                                                val.value }}
                                                        </span>
                                                    </template>
                                                    <span v-else class="muted">-</span>
                                                </td>
                                                <td class="cell-index">
                                                    {{ String((order.items?.length || 0) + cidx + 1).padStart(2, '0') }}
                                                </td>
                                                <td class="cell-product">{{ item.product?.title ?? '-' }}</td>
                                                <td class="cell-price">{{ Number(item.price).toLocaleString('fa-IR') }}
                                                </td>
                                                <td class="cell-discount">{{ Number(item.discount ??
                                                    0).toLocaleString('fa-IR') }}</td>
                                                <td class="cell-qty">{{ item.quantity }}</td>
                                                <td class="cell-total">{{ Number(item.price *
                                                    item.quantity).toLocaleString('fa-IR') }}</td>
                                            </tr>
                                        </template>

                                        <tr v-if="!order.items?.length && !order.child_orders?.length">
                                            <td colspan="7" class="text-center muted">بدون آیتم</td>
                                        </tr>
                                    </tbody>
                                    <!-- ✅ ردیف تعداد کل -->
                                    <tfoot v-if="order.items?.length || order.child_orders?.length">
                                        <tr class="items-total-row">
                                            <td colspan="7">
                                                <strong>تعداد کل: {{ getTotalQuantity(order) }}</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <!-- ===== باکس جمع کل ===== -->
                            <div class="box box-summary">
                                <div class="summary-row">
                                    <div class="summary-cell">
                                        <span class="cell-label">مبلغ کل:</span>
                                        <strong class="cell-value">{{ Number(getSubTotal(order)).toLocaleString('fa-IR')
                                            }}
                                            تومان</strong>
                                    </div>
                                    <div class="summary-cell">
                                        <span class="cell-label">مبلغ حمل و نقل:</span>
                                        <strong class="cell-value">{{
                                            Number(getShippingCost(order)).toLocaleString('fa-IR') }} تومان</strong>
                                    </div>
                                    <div class="summary-cell highlight">
                                        <span class="cell-label">مبلغ نهایی:</span>
                                        <strong class="cell-value">{{ Number(getShippingCost(order)+getSubTotal(order)).toLocaleString('fa-IR') }}
                                            تومان</strong>
                                    </div>
                                </div>
                            </div>
                            <div class="box box-summary" v-if="order.user_note">
                                <div class="summary-row">
                                    <div class="summary-cell">
                                        <span class="cell-label">توضیحات سفارش:</span>
                                        <strong class="cell-value">{{ order.user_note }}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <!-- ✅ جداکننده بین دو سفارش در یک صفحه (فقط در نمایش) -->
                            <div v-if="index < orders.length - 1 && index % 2 === 0" class="order-divider">
                                <span></span>
                                <i class="bi bi-scissors"></i>
                                <span></span>
                            </div>

                        </div>
                    </div>

                </template>

                <!-- ================= LABEL (بدون تغییر) ================= -->
                <template v-else-if="printType === 'label'">

                    <div class="labels-grid">
                        <template v-for="order in orders" :key="order.id">
                            <div class="label-card">
                                <div class="label-top">
                                    <div class="label-brand">
                                        <div class="mini-logo overflow-hidden">
                                            <img src="@/assets/images/logo.png" width="72" alt="">
                                        </div>
                                        <div>
                                            <strong>اطلاعات فرستنده:</strong>
                                            <span>سرمه </span>
                                        </div>
                                    </div>
                                    <div class="label-number">
                                        <small>website</small>
                                        <strong>www.sormeh-online.com</strong>
                                    </div>
                                </div>

                                <div class="label-route">
                                    <div class="route-title">
                                        <span class="route-line"></span>
                                        <i class="bi bi-arrow-down-circle-fill"></i>
                                        <span>ارسال از</span>
                                    </div>
                                    <div class="receiver-name">فروشگاه سرمه </div>
                                    <div class="receiver-phone">
                                        <i class="bi bi-telephone-fill"></i>
                                        ۰۹۳۳۵۸۱۴۴۷۵
                                    </div>
                                    <div class="receiver-address">
                                        آدرس: گلستان گرگان -سر سه راهی سلامتی
                                    </div>
                                    <div class="receiver-location">
                                        <span>گلستان - گرگان</span>
                                        <strong>کد پستی: ------</strong>
                                    </div>
                                </div>

                                <div class="label-bottom">
                                    <div>
                                        <small>sormeh-online</small>
                                        <strong>فروشگاه لباس زیر</strong>
                                    </div>
                                    <div class="label-price">
                                        <small>تاریخ سفارش</small>
                                        <strong>{{ new Date(order.created_at).toLocaleDateString('fa-IR') }}</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="label-card">
                                <div class="label-top">
                                    <div class="label-brand">
                                        <div class="mini-logo">
                                            <i class="bi bi-bag-heart-fill"></i>
                                        </div>
                                        <div>
                                            <strong>اطلاعات گیرنده:</strong>
                                            <span>SHIPPING LABEL</span>
                                        </div>
                                    </div>
                                    <div class="label-number">
                                        <small>شناسه سفارش</small>
                                        <strong>#{{ String(order.id).padStart(5, '0') }}</strong>
                                    </div>
                                </div>

                                <div class="label-route">
                                    <div class="route-title">
                                        <span class="route-line"></span>
                                        <i class="bi bi-arrow-down-circle-fill"></i>
                                        <span>ارسال به</span>
                                    </div>
                                    <div class="receiver-name">{{ order.user?.full_name ?? '-' }}</div>
                                    <div class="receiver-phone">
                                        <i class="bi bi-telephone-fill"></i>
                                        {{ order.user?.mobile ?? '-' }}
                                    </div>
                                    <div class="receiver-address">
                                        {{ order.address?.address_line ?? '-' }}
                                    </div>
                                    <div class="receiver-location">
                                        <span>
                                            {{ order.address?.province?.name ?? '-' }} -
                                            {{ order.address?.city?.name ?? '-' }}
                                        </span>
                                        <strong>کد پستی: {{ order.address?.postal_code ?? '-' }}</strong>
                                    </div>
                                </div>

                                <div class="label-bottom">
                                    <div>
                                        <small>روش ارسال</small>
                                        <strong>{{ order.shipping?.title ?? '-' }}</strong>
                                    </div>
                                    <div class="label-price">
                                        <small>مبلغ سفارش</small>
                                        <strong>
                                            {{ Number(order.total).toLocaleString('fa-IR') }}
                                            <em>تومان</em>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                </template>

            </div>

            <!-- PRINT FOOTER -->
            <div class="print-footer">
                <div class="footer-line"></div>
                <strong>سرمه </strong>
                <span>این فاکتور توسط سیستم مدیریت سفارشات صادر شده است.</span>
                <small>www.sormeh-online.com</small>
            </div>

        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useAdmin } from '@/stores/modules/admin';

const route = useRoute();
const router = useRouter();
const store = useAdmin();
const checkPermission = store.checkPermission;

const orders = ref([]);
const loading = ref(false);
const orderIds = ref([]);
const printType = ref('full');
function getSubTotal(order) {
    if (!order) return 0;
    let childs = order.child_orders ? order.child_orders.filter(o => o.status == "paid") : [];
    let childTotal = childs.reduce((a, b) => {
        return a + b.subtotal
    }, 0)
    return childTotal+order.subtotal
}

function getShippingCost(order) {
    if (!order) return 0;
    let childs = order.child_orders ? order.child_orders.filter(o => o.status == "paid") : [];
    let childTotal = childs.reduce((a, b) => {
        return a + b.shipping_cost
    }, 0)
    return childTotal+order.shipping_cost
}


// ✅ تاریخ امروز به شمسی
const getCurrentDate = () => {
    return new Date().toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// ✅ تعداد کل آیتم‌های سفارش (اصلی + فرزند)
const getTotalQuantity = (order) => {
    let total = 0;
    if (order?.items?.length) {
        total += order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }
    if (order?.child_orders?.length) {
        order.child_orders.forEach(child => {
            if (child?.items?.length) {
                total += child.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            }
        });
    }
    return total;
};

// ✅ اطلاعات ثابت فروشگاه
const STORE_INFO = {
    title: 'فروشگاه سرمه ',
    website: 'sormeh-online.com',
    phone: '09375015769',
    address: 'گلستان - گرگان - خیابان پنج آذر - آذر چهارم - جنب داروخانه'
};

const handlePrint = () => {
    const printContents = document.getElementById('printSection').innerHTML;
    const fontUrl = `${window.location.origin}/fonts/yekanBakh/bold.ttf`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>پرینت سفارش‌ها</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
            <style>
                @font-face {
                    font-family: 'yekanbakhbold';
                    src: url('${fontUrl}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                    font-display: block;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }

                html, body {
                    direction: rtl;
                    font-family: 'yekanbakhbold', Tahoma, Arial, sans-serif !important;
                    background: #fff;
                    color: #000;
                    font-size: 10px;
                    line-height: 1.5;
                }

                body, body * {
                    font-family: 'yekanbakhbold', Tahoma, Arial, sans-serif !important;
                }

                @page {
                    size: A4 portrait;
                    margin: 8mm;
                }

                /* ✅ دو سفارش در یک برگه A4 */
                .invoice-page {
                    display: block;
                }

                .invoice-a4 {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .invoice-a4:nth-child(2n) {
                    page-break-after: always;
                    break-after: page;
                }

                .invoice-a4:nth-child(2n):last-child {
                    page-break-after: auto;
                    break-after: auto;
                }

                /* ===== باکس‌ها ===== */
                .box {
                    border: 1px solid #000;
                    margin-bottom: 3px;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .box:last-child {
                    margin-bottom: 0;
                }

                /* ===== باکس بالای فروشگاه ===== */
                .store-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 4px 8px;
                    border-bottom: 1px solid #000;
                    background: #f5f5f5;
                }

                .store-title strong {
                    font-size: 12px;
                    font-weight: 900;
                }

                .store-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 9px;
                }

                .store-date strong {
                    font-weight: 800;
                }

                .store-row {
                    display: flex;
                    padding: 3px 8px;
                    border-bottom: 1px solid #ddd;
                }

                .store-row:last-child {
                    border-bottom: none;
                }

                .store-cell {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                    padding: 0 4px;
                }

                .store-cell:not(:last-child) {
                    border-left: 1px solid #ddd;
                }

                /* ===== باکس گیرنده ===== */
                .receiver-header {
                    padding: 3px 8px;
                    background: #f5f5f5;
                    border-bottom: 1px solid #000;
                    font-size: 10px;
                }

                .receiver-header strong {
                    font-weight: 900;
                }

                .receiver-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    border-bottom: 1px solid #ddd;
                }

                .receiver-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-bottom: 1px solid #ddd;
                }

                .receiver-item:nth-child(odd) {
                    border-left: 1px solid #ddd;
                }

                .receiver-item:nth-last-child(-n+2) {
                    border-bottom: none;
                }

                .receiver-address {
                    display: flex;
                    align-items: flex-start;
                    gap: 4px;
                    padding: 4px 8px;
                }

                /* ===== سلول‌ها ===== */
                .cell-label {
                    color: #555;
                    font-size: 8.5px;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .cell-value {
                    font-weight: 800;
                    font-size: 9.5px;
                    word-break: break-word;
                }

                /* ===== جدول آیتم‌ها ===== */
                .box-table {
                    padding: 0;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9px;
                }

                .items-table thead {
                    background: #f5f5f5;
                }

                .items-table th {
                    border: 1px solid #000;
                    padding: 4px 3px;
                    font-weight: 900;
                    font-size: 9px;
                    text-align: center;
                    white-space: nowrap;
                }

                .items-table td {
                    border: 1px solid #999;
                    padding: 4px 3px;
                    text-align: center;
                    vertical-align: middle;
                    font-size: 9px;
                }

                .cell-specs {
                    text-align: right;
                    line-height: 1.6;
                    font-size: 8px;
                }

                .spec-line {
                    display: block;
                }

                .cell-product {
                    text-align: right;
                    font-weight: 700;
                }

                .cell-index {
                    color: #666;
                    font-weight: 700;
                }

                .cell-price,
                .cell-discount,
                .cell-total {
                    font-weight: 700;
                    white-space: nowrap;
                }

                .cell-total {
                    font-weight: 900;
                }

                .muted {
                    color: #999;
                }

                .text-center {
                    text-align: center;
                }

                /* ✅ ردیف تعداد کل */
                .items-total-row td {
                    background: #f5f5f5;
                    text-align: right;
                    padding: 5px 8px;
                    font-size: 10px;
                    border-top: 2px solid #000;
                }

                .items-total-row strong {
                    font-weight: 900;
                }

                /* ===== باکس جمع کل ===== */
                .summary-row {
                    display: flex;
                }

                .summary-cell {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    padding: 7px 6px;
                    border-left: 1px solid #000;
                    text-align: center;
                }

                .summary-cell:last-child {
                    border-left: none;
                }

                .summary-cell.highlight {
                    background: #000 !important;
                    color: #fff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                .summary-cell.highlight .cell-label {
                    color: #fff !important;
                    font-weight: 700;
                }

                .summary-cell.highlight .cell-value {
                    color: #fff !important;
                    font-size: 12px;
                    font-weight: 900;
                }

                /* ✅ جداکننده بین دو سفارش */
                .order-divider {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 6px 0;
                    color: #999;
                }

                .order-divider span {
                    flex: 1;
                    height: 1px;
                    background: #ccc;
                }

                .order-divider i {
                    font-size: 11px;
                }

                /* ===== هدر/فوتر چاپ ===== */
                .print-header,
                .print-footer {
                    display: none;
                }

                /* ===== پرینت ===== */
                @media print {
                    .invoice-a4 {
                        margin: 0;
                    }

                    .box {
                        box-shadow: none;
                    }

                    .order-divider {
                        display: flex !important;
                    }
                }
            </style>
        </head>
        <body>
            ${printContents}
        </body>
        </html>
    `);

    doc.close();

    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1500);
    }, 500);
};

const fetchOrders = async () => {
    const ids = route.query.ids;
    const type = route.query.type || 'full';
    printType.value = type;

    if (!ids) {
        router.push('/orders');
        return;
    }

    orderIds.value = ids.split(',').map(id => parseInt(id));
    loading.value = true;

    try {
        const response = await axios.post('/orders/print-data', {
            ids: orderIds.value
        });

        if (response.data.success) {
            orders.value = response.data.data;
        } else {
            alert('خطا در دریافت اطلاعات سفارش‌ها');
            router.push('/orders');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور');
        router.push('/orders');
    } finally {
        loading.value = false;
    }
};

const formatDate = (date) => {
    if (!date) return '-';
    try {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR') + ' - ' + d.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return date;
    }
};

const statusText = (status) => {
    const map = {
        pending: "در انتظار",
        reserved: "رزرو شده",
        processing: "در حال پردازش",
        paid: "پرداخت شده",
        shipped: "ارسال شده",
        completed: "تکمیل شده",
        canceled: "لغو شده",
        returned: "مرجوعی",
    };
    return map[status] ?? status;
};

const statusClass = (status) => {
    const map = {
        pending: "status-pending",
        reserved: "status-reserved",
        processing: "status-processing",
        paid: "status-completed",
        shipped: "status-shipped",
        completed: "status-completed",
        canceled: "status-canceled",
        returned: "status-returned",
    };
    return map[status] ?? "status-pending";
};

const paymentStatusText = (status) => {
    const map = {
        pending: "در انتظار پرداخت",
        paid: "پرداخت شده",
        failed: "ناموفق",
        refunded: "برگشت داده شده",
    };
    return map[status] ?? status;
};

const paymentClass = (status) => {
    const map = {
        pending: "payment-pending",
        paid: "payment-paid",
        failed: "payment-failed",
        refunded: "payment-refunded",
    };
    return map[status] ?? "payment-pending";
};

const paymentMethodText = (method) => {
    const map = {
        online: "پرداخت آنلاین",
        wallet: "کیف پول",
        cod: "پرداخت در محل",
    };
    return map[method] ?? method;
};

onMounted(() => {
    fetchOrders();
});
</script>


<style scoped>
/* =========================================================
   BASE
========================================================= */
.print-wrapper {
    min-height: 100vh;
    background:
        radial-gradient(circle at top right, rgba(24, 24, 27, .035), transparent 30%),
        #f6f6f5;
    color: #18181b;
    direction: rtl;
}

.print-wrapper * {
    font-family: "yekanbakhbold" !important;
}

/* =========================================================
   TOOLBAR
========================================================= */
.print-toolbar {
    background: rgba(255, 255, 255, .92);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid #e4e4e7;
}

.toolbar-content {
    max-width: 1400px;
    min-height: 76px;
    margin: auto;
    padding: 12px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
}

.toolbar-brand {
    display: flex;
    align-items: center;
    gap: 11px;
}

.brand-mark {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #18181b;
    color: #fff;
    border-radius: 12px;
    font-size: 18px;
}

.toolbar-brand strong {
    display: block;
    font-size: 14px;
    font-weight: 900;
}

.toolbar-brand span {
    display: block;
    color: #a1a1aa;
    font-size: 10px;
    margin-top: 2px;
}

.toolbar-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toolbar-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 13px;
    background: #fafafa;
    border: 1px solid #e4e4e7;
    border-radius: 10px;
    color: #52525b;
    font-size: 11px;
    font-weight: 700;
}

.toolbar-chip i {
    color: #18181b;
}

.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-print,
.btn-back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 42px;
    padding: 0 18px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    text-decoration: none;
    transition: .2s ease;
}

.btn-print {
    border: 0;
    background: #18181b;
    color: #fff;
}

.btn-print:hover {
    background: #27272a;
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, .12);
}

.btn-back {
    background: #fff;
    color: #52525b;
    border: 1px solid #e4e4e7;
}

.btn-back:hover {
    background: #f4f4f5;
    color: #18181b;
}

/* =========================================================
   PRINT SECTION
========================================================= */
#printSection {
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 30px 70px;
}

.print-header,
.print-footer {
    display: none;
}

/* =========================================================
   LOADING
========================================================= */
.loading-state {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-box {
    width: 260px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 18px;
    box-shadow: 0 15px 45px rgba(0, 0, 0, .05);
}

.loading-spinner {
    width: 42px;
    height: 42px;
    border: 3px solid #e4e4e7;
    border-top-color: #18181b;
    border-radius: 50%;
    animation: spin .8s linear infinite;
    margin-bottom: 18px;
}

.loading-box strong {
    font-size: 13px;
}

.loading-box span {
    color: #a1a1aa;
    font-size: 10px;
    margin-top: 5px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* =========================================================
   EMPTY
========================================================= */
.empty-state {
    min-height: 65vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.empty-icon {
    width: 75px;
    height: 75px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 22px;
    background: #fff;
    border: 1px solid #e4e4e7;
    color: #a1a1aa;
    font-size: 30px;
    margin-bottom: 20px;
}

.empty-state h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 900;
}

.empty-state p {
    margin: 7px 0 20px;
    color: #a1a1aa;
    font-size: 12px;
}

.empty-button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 16px;
    border-radius: 9px;
    background: #18181b;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    text-decoration: none;
}

/* =========================================================
   INVOICE A4 (نمایش روی صفحه - 2 per page)
========================================================= */
.invoice-page {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.invoice-a4 {
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 6px;
    padding: 10px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, .05);
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}

/* ===== باکس‌ها ===== */
.invoice-a4 .box {
    border: 1px solid #000;
    margin-bottom: 4px;
}

.invoice-a4 .box:last-child {
    margin-bottom: 0;
}

/* باکس فروشگاه */
.invoice-a4 .store-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid #000;
    background: #f5f5f5;
}

.invoice-a4 .store-title strong {
    font-size: 14px;
    font-weight: 900;
}

.invoice-a4 .store-date {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
}

.invoice-a4 .store-date strong {
    font-weight: 800;
}

.invoice-a4 .store-row {
    display: flex;
    padding: 5px 10px;
    border-bottom: 1px solid #ddd;
}

.invoice-a4 .store-row:last-child {
    border-bottom: none;
}

.invoice-a4 .store-cell {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    padding: 0 5px;
}

.invoice-a4 .store-cell:not(:last-child) {
    border-left: 1px solid #ddd;
}

/* باکس گیرنده */
.invoice-a4 .receiver-header {
    padding: 5px 10px;
    background: #f5f5f5;
    border-bottom: 1px solid #000;
    font-size: 12px;
}

.invoice-a4 .receiver-header strong {
    font-weight: 900;
}

.invoice-a4 .receiver-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #ddd;
}

.invoice-a4 .receiver-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-bottom: 1px solid #ddd;
}

.invoice-a4 .receiver-item:nth-child(odd) {
    border-left: 1px solid #ddd;
}

.invoice-a4 .receiver-item:nth-last-child(-n+2) {
    border-bottom: none;
}

.invoice-a4 .receiver-address {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    padding: 6px 10px;
}

/* سلول‌ها */
.invoice-a4 .cell-label {
    color: #555;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
}

.invoice-a4 .cell-value {
    font-weight: 800;
    font-size: 11px;
    word-break: break-word;
}

/* جدول */
.invoice-a4 .box-table {
    padding: 0;
}

.invoice-a4 .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
}

.invoice-a4 .items-table thead {
    background: #f5f5f5;
}

.invoice-a4 .items-table th {
    border: 1px solid #000;
    padding: 6px 4px;
    font-weight: 900;
    font-size: 10px;
    text-align: center;
    white-space: nowrap;
}

.invoice-a4 .items-table td {
    border: 1px solid #999;
    padding: 6px 4px;
    text-align: center;
    vertical-align: middle;
    font-size: 10px;
}

.invoice-a4 .cell-specs {
    text-align: right;
    line-height: 1.6;
    font-size: 9px;
}

.invoice-a4 .spec-line {
    display: block;
}

.invoice-a4 .cell-product {
    text-align: right;
    font-weight: 700;
}

.invoice-a4 .cell-index {
    color: #666;
    font-weight: 700;
}

.invoice-a4 .cell-price,
.invoice-a4 .cell-discount,
.invoice-a4 .cell-total {
    font-weight: 700;
    white-space: nowrap;
}

.invoice-a4 .cell-total {
    font-weight: 900;
}

.invoice-a4 .muted {
    color: #999;
}

.invoice-a4 .text-center {
    text-align: center;
}

/* ✅ ردیف تعداد کل */
.invoice-a4 .items-total-row td {
    background: #f5f5f5;
    text-align: right;
    padding: 6px 10px;
    font-size: 11px;
    border-top: 2px solid #000;
}

.invoice-a4 .items-total-row strong {
    font-weight: 900;
}

/* جمع کل */
.invoice-a4 .summary-row {
    display: flex;
}

.invoice-a4 .summary-cell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 8px;
    border-left: 1px solid #000;
    text-align: center;
}

.invoice-a4 .summary-cell:last-child {
    border-left: none;
}

/* ✅ مبلغ نهایی - مشکی پررنگ */
.invoice-a4 .summary-cell.highlight {
    background: #000 !important;
    color: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
}

.invoice-a4 .summary-cell.highlight .cell-label {
    color: #fff !important;
    font-weight: 700;
}

.invoice-a4 .summary-cell.highlight .cell-value {
    color: #fff !important;
    font-size: 13px;
    font-weight: 900;
}

/* ===== جداکننده بین دو سفارش ===== */
.order-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
    color: #999;
}

.order-divider span {
    flex: 1;
    height: 1px;
    background: #ccc;
}

.order-divider i {
    font-size: 12px;
}

/* =========================================================
   LABELS (برچسب ارسال - بدون تغییر)
========================================================= */
.labels-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.label-card {
    overflow: hidden;
    background: #fff;
    border: 1px solid #18181b;
    border-radius: 15px;
    box-shadow: 0 10px 35px rgba(0, 0, 0, .04);
}

.label-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 17px;
    background: #18181b;
    color: #fff;
}

.label-brand {
    display: flex;
    align-items: center;
    gap: 9px;
}

.mini-logo {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, .25);
    border-radius: 9px;
    font-size: 14px;
}

.label-brand strong {
    display: block;
    font-size: 12px;
    font-weight: 900;
}

.label-brand span {
    display: block;
    color: #a1a1aa;
    font-size: 7px;
    letter-spacing: 1px;
    direction: ltr;
}

.label-number {
    text-align: left;
}

.label-number small {
    display: block;
    color: #a1a1aa;
    font-size: 7px;
    direction: ltr;
}

.label-number strong {
    font-size: 15px;
}

.label-route {
    padding: 20px;
}

.route-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #71717a;
    font-size: 9px;
    font-weight: 700;
    margin-bottom: 10px;
}

.route-title i {
    color: #18181b;
}

.route-line {
    width: 30px;
    height: 1px;
    background: #d4d4d8;
}

.receiver-name {
    font-size: 18px;
    font-weight: 900;
    margin-bottom: 4px;
}

.receiver-phone {
    color: #52525b;
    font-size: 10px;
    margin-bottom: 13px;
}

.receiver-phone i {
    margin-left: 5px;
}

.receiver-address {
    padding: 10px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    font-size: 10px;
    line-height: 1.9;
}

.receiver-location {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 9px;
    color: #52525b;
    font-size: 9px;
}

.receiver-location strong {
    color: #18181b;
    font-weight: 900;
}

.label-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 17px;
    background: #fafafa;
    border-top: 1px dashed #d4d4d8;
}

.label-bottom small {
    display: block;
    color: #a1a1aa;
    font-size: 8px;
}

.label-bottom strong {
    display: block;
    font-size: 10px;
    font-weight: 900;
}

.label-price {
    text-align: left;
}

.label-price strong {
    font-size: 13px;
}

.label-price em {
    color: #71717a;
    font-size: 8px;
    font-style: normal;
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 1000px) {
    .toolbar-content {
        padding: 12px 18px;
    }

    .toolbar-meta {
        display: none;
    }

    #printSection {
        padding: 25px 18px 50px;
    }

    .labels-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 650px) {
    .toolbar-brand {
        display: none;
    }

    .toolbar-content {
        justify-content: space-between;
    }

    .label-bottom,
    .receiver-location {
        flex-direction: column;
        align-items: flex-start;
    }

    .label-price {
        text-align: right;
    }
}

/* =========================================================
   PRINT SCREEN
========================================================= */
@media print {

    .print-wrapper {
        background: #fff;
    }

    .print-toolbar {
        display: none !important;
    }

    #printSection {
        max-width: 100%;
        padding: 0;
    }

    .print-header,
    .print-footer {
        display: block !important;
    }

    .order-card,
    .label-card {
        box-shadow: none !important;
    }
}
</style>