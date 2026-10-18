<template>
  <b-container fluid class="py-3 py-md-4 px-2 px-md-3 order-detail-page" v-if="checkPermission(['order_view'])">
    <!-- هدر -->
    <div class="order-header mb-3 mb-md-4">
      <div
        class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2">
        <div>
          <h4 class="mb-1 page-title">
            <i class="fas fa-shopping-bag me-2"></i>
            جزئیات سفارش
            <span class="badge bg-primary ms-2 order-badge">#{{ order?.id || '---' }}</span>
          </h4>
          <small class="text-muted order-date">
            <i class="bi bi-calendar-check me-1"></i>
            تاریخ ثبت: {{ formatDate(order?.created_at) }}
          </small>
        </div>
        <div class="d-flex gap-2 header-actions">
          <b-button variant="outline-secondary" size="sm" @click="$router.back()" class="back-btn">
            <i class="bi bi-arrow-right me-1"></i>
            <span>بازگشت</span>
          </b-button>
        </div>
      </div>
    </div>

    <b-row class="g-3">
      <b-col cols="12" lg="8">
        <b-card class="detail-card h-100" header-tag="header">
          <template #header>
            <div
              class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2">
              <div class="d-flex align-items-center">
                <i class="fas fa-user-circle me-2 text-primary"></i>
                <span class="fw-bold">اطلاعات مشتری</span>
              </div>
              <span class="badge bg-secondary user-badge">
                <i class="bi bi-person-fill me-1"></i>
                {{ order?.user?.full_name || 'نامشخص' }}
                {{ order?.user?.mobile || 'نامشخص' }}
              </span>
            </div>
          </template>

          <!-- آدرس -->
          <div class="info-item">
            <span class="info-label">
              <i class="bi bi-geo-alt-fill"></i>
              آدرس
            </span>
            <span class="info-value">
              <span class="value-text">{{ getAddressText(order?.address) }} <span><b> -کدپستی: </b>{{
                order?.address?.postal_code
              }}</span>
                <span><b> -شماره تماس: </b>{{
                  order?.address?.phone
                }}</span>

              </span>

              <b-button v-if="canEdit" variant="outline-primary" size="sm" class="edit-btn"
                @click="showAddressModalFunc()" title="ویرایش آدرس">
                <i class="bi bi-pencil"></i>
              </b-button>
            </span>
          </div>

          <!-- روش حمل -->
          <div class="info-item">
            <span class="info-label">
              <i class="bi bi-truck"></i>
              روش حمل
            </span>
            <span class="info-value">
              <span class="value-text">
                <i class="fas fa-truck me-1"></i>
                {{ order?.shipping?.title || 'نامشخص' }}
                <span class="text-muted ms-1">({{ formatPrice(order?.shipping_cost) }})</span>
              </span>
              <b-button v-if="canEdit" variant="outline-primary" size="sm" class="edit-btn"
                @click="showShippingModalFunc()" title="ویرایش روش حمل">
                <i class="bi bi-pencil"></i>
              </b-button>
            </span>
          </div>

          <!-- نوع سفارش (ویرایش) -->
          <div class="info-item" v-if="canEdit">
            <span class="info-label">
              <i class="bi bi-bookmark-fill"></i>
              نوع سفارش
            </span>
            <span class="info-value reservation-value">
              <b-form-select v-model="order.reservation_type" :options="reservationTypeOptions" size="sm"
                :disabled="loadingReservation" class="reservation-select" />
              <b-button variant="outline-primary" size="md" @click="changeReservationType"
                :disabled="loadingReservation">
                <i v-if="loadingReservation" class="bi bi-three-dots"></i>
                <span v-else>بروز رسانی</span>
              </b-button>
            </span>
          </div>
          <div class="info-item" v-else>
            <span class="info-label">
              <i class="bi bi-bookmark-fill"></i>
              نوع سفارش
            </span>
            <span class="info-value">
              <span class="value-text">{{ getReservationTypeText(order?.reservation_type) }}</span>
            </span>
          </div>

          <!-- روش پرداخت -->
          <div class="info-item">
            <span class="info-label">
              <i class="bi bi-credit-card-2-front"></i>
              روش پرداخت
            </span>
            <span class="info-value">
              <span class="value-text">
                <i class="fas fa-credit-card me-1"></i>
                {{ paymentMethods[order?.payment_method] || 'نامشخص' }}
                {{
                  order.gateway_transactions && order.gateway_transactions.length ?
                    " - " +
                    findGateWayName(order.gateway_transactions) : ""

                }}
              </span>
            </span>
          </div>

          <!-- وضعیت -->
          <div class="info-item">
            <span class="info-label">
              <i class="bi bi-info-circle-fill"></i>
              وضعیت
            </span>
            <span class="info-value">
              <span :class="getStatusClass(order?.status)">{{ getStatusText(order?.status) }}</span>
            </span>
          </div>
          <!-- توضیحات -->
          <div class="info-item">
            <span class="info-label">
              <i class="bi bi-pencil"></i>
              توضیحات
            </span>
            <span class="info-value">
              <span>{{ order?.user_note }}</span>
            </span>
          </div>
          <div v-if="order?.status == 'reserved'" class="alert alert-info mt-3 mb-0 reserved-alert">
            <i class="fas fa-clock me-1"></i>
            تاریخ اتمام رزرو: {{ formatDate(order?.reserved_until) }}
          </div>
        </b-card>
      </b-col>

      <b-col cols="12" lg="4">
        <b-card class="detail-card h-100 actions-card" header-tag="header">
          <template #header>
            <div class="d-flex align-items-center">
              <i class="fas fa-cogs me-2 text-warning"></i>
              <span class="fw-bold">عملیات</span>
            </div>
          </template>

          <b-form-group label="تغییر وضعیت" label-for="order-status" class="status-form">
            <b-form-select id="order-status" v-model="order.status" :options="orderStatusOptions"
              :class="getStatusClass(order?.status)" :disabled="updating" class="status-select" />
          </b-form-group>

          <div class="mt-3 d-grid gap-2 action-buttons">
            <b-button variant="primary" @click="updateOrderStatus" :disabled="updating || !order?.id"
              class="action-btn">
              <i v-if="updating" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-save me-1"></i>
              ذخیره تغییرات
            </b-button>

            <router-link variant="info" class="btn btn-info action-btn" :to="`/orders/print?ids=${order.id}&type=full`"
              target="_blank">
              <i class="fas fa-print me-1"></i>
              چاپ فاکتور
            </router-link>
          </div>
        </b-card>
      </b-col>
    </b-row>

    <!-- جدول آیتم‌های سفارش -->
    <b-row class="mt-3 mt-md-4">
      <b-col cols="12">
        <b-card class="detail-card" header-tag="header">
          <template #header>
            <div
              class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2">
              <div class="d-flex align-items-center flex-wrap gap-2">
                <i class="fas fa-list me-2 text-primary"></i>
                <span class="fw-bold">آیتم‌های سفارش</span>
                <span class="badge bg-secondary items-badge">
                  <i class="bi bi-box-seam me-1"></i>
                  {{ order?.items?.length || 0 }} آیتم
                </span>
              </div>
              <div>
                <b-button v-if="canEdit" variant="outline-primary" size="sm" @click="showItemModal = true"
                  class="add-item-btn">
                  <i class="fas fa-plus me-1"></i>
                  <span>افزودن محصول</span>
                </b-button>
              </div>
            </div>
          </template>

          <!-- ===== جدول دسکتاپ ===== -->
          <div class="table-responsive d-none d-md-block">
            <table class="table table-bordered table-hover align-middle text-center mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 50px;">#</th>
                  <th style="width: 60px;">تصویر</th>
                  <th class="text-start">محصول</th>
                  <th style="width: 120px;">تعداد</th>
                  <th style="width: 150px;">قیمت واحد</th>
                  <th style="width: 150px;">مجموع</th>
                  <th v-if="canEdit" style="width: 150px;">عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in order?.items || []" :key="item.id">
                  <td class="row-index">{{ index + 1 }}</td>
                  <td>
                    <img width="50" height="50" class="product-thumb" :src="getProductImage(item)"
                      :alt="getProductTitle(item)" />
                  </td>
                  <td class="text-start">
                    <span class="fw-bold product-title">{{ getProductTitle(item) }}</span>
                    <div class="text-muted small variant-text">{{ getVariantText(item) }}</div>
                  </td>
                  <td>
                    <template v-if="editingItem === item.id">
                      <input type="number" class="form-control form-control-sm text-center edit-input"
                        v-model.number="itemEditForm.quantity" min="1" />
                    </template>
                    <template v-else>
                      <span class="quantity-badge">{{ item.quantity }}</span>
                    </template>
                  </td>
                  <td>
                    <template v-if="editingItem === item.id">
                      <input type="number" class="form-control form-control-sm text-center edit-input"
                        v-model.number="itemEditForm.price" min="0" />
                    </template>
                    <template v-else>
                      <span class="price-text">{{ formatPrice(item.price) }}</span>
                    </template>
                  </td>
                  <td class="fw-bold total-cell">{{ formatPrice((item.price || 0) * (item.quantity || 0)) }}</td>
                  <td v-if="canEdit">
                    <template v-if="editingItem === item.id">
                      <div class="d-flex justify-content-center gap-1">
                        <b-button variant="success" size="sm" @click="saveItemEdit(item)" :disabled="itemSaving"
                          class="icon-btn">
                          <i v-if="itemSaving" class="bi bi-circle-fill"></i>
                          <i v-else class="bi bi-check"></i>
                        </b-button>
                        <b-button variant="secondary" size="sm" @click="editingItem = null" class="icon-btn">
                          <i class="bi bi-x-circle"></i>
                        </b-button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="d-flex justify-content-center gap-1">
                        <b-button variant="outline-primary" size="sm" @click="startEditItem(item)" title="ویرایش آیتم"
                          class="icon-btn">
                          <i class="bi bi-pencil"></i>
                        </b-button>
                        <b-button variant="outline-danger" size="sm" @click="removeItem(item.id)" title="حذف آیتم"
                          :disabled="itemRemoving === item.id" class="icon-btn">
                          <i v-if="itemRemoving === item.id" class="bi bi-dot"></i>
                          <i v-else class="bi bi-trash"></i>
                        </b-button>
                      </div>
                    </template>
                  </td>
                </tr>

                <tr v-if="!order?.items?.length">
                  <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-box-open fa-2x mb-2 d-block"></i>
                    هیچ محصولی در سفارش وجود ندارد
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ===== کارت‌های موبایل برای آیتم‌ها ===== -->
          <div class="d-md-none item-cards">
            <div v-for="(item, index) in order?.items || []" :key="item.id" class="item-card">
              <div class="item-card-header">
                <span class="item-index">#{{ index + 1 }}</span>
                <img width="56" height="56" class="product-thumb" :src="getProductImage(item)"
                  :alt="getProductTitle(item)" />
                <div class="item-info">
                  <div class="product-title">{{ getProductTitle(item) }}</div>
                  <div class="variant-text" v-if="getVariantText(item)">{{ getVariantText(item) }}</div>
                </div>
              </div>

              <div class="item-card-body">
                <div class="info-row">
                  <i class="bi bi-box-seam"></i>
                  <span class="info-label">تعداد:</span>
                  <template v-if="editingItem === item.id">
                    <input type="number" class="form-control form-control-sm edit-input"
                      v-model.number="itemEditForm.quantity" min="1" />
                  </template>
                  <template v-else>
                    <span class="info-value quantity-badge">{{ item.quantity }}</span>
                  </template>
                </div>

                <div class="info-row">
                  <i class="bi bi-tag-fill"></i>
                  <span class="info-label">قیمت واحد:</span>
                  <template v-if="editingItem === item.id">
                    <input type="number" class="form-control form-control-sm edit-input"
                      v-model.number="itemEditForm.price" min="0" />
                  </template>
                  <template v-else>
                    <span class="info-value price-text">{{ formatPrice(item.price) }}</span>
                  </template>
                </div>

                <div class="info-row total-row">
                  <i class="bi bi-cash-coin"></i>
                  <span class="info-label">مجموع:</span>
                  <span class="info-value total-value">{{ formatPrice((item.price || 0) * (item.quantity || 0))
                  }}</span>
                </div>
              </div>

              <div v-if="canEdit" class="item-card-actions">
                <template v-if="editingItem === item.id">
                  <b-button variant="success" size="sm" @click="saveItemEdit(item)" :disabled="itemSaving"
                    class="flex-fill action-btn-sm">
                    <i v-if="itemSaving" class="bi bi-circle-fill"></i>
                    <i v-else class="bi bi-check"></i>
                    <span>ذخیره</span>
                  </b-button>
                  <b-button variant="secondary" size="sm" @click="editingItem = null" class="flex-fill action-btn-sm">
                    <i class="bi bi-x-circle"></i>
                    <span>انصراف</span>
                  </b-button>
                </template>
                <template v-else>
                  <b-button variant="outline-primary" size="sm" @click="startEditItem(item)"
                    class="flex-fill action-btn-sm">
                    <i class="bi bi-pencil"></i>
                    <span>ویرایش</span>
                  </b-button>
                  <b-button variant="outline-danger" size="sm" @click="removeItem(item.id)"
                    :disabled="itemRemoving === item.id" class="flex-fill action-btn-sm">
                    <i v-if="itemRemoving === item.id" class="bi bi-dot"></i>
                    <i v-else class="bi bi-trash"></i>
                    <span>حذف</span>
                  </b-button>
                </template>
              </div>
            </div>

            <!-- حالت خالی -->
            <div v-if="!order?.items?.length" class="empty-items text-center text-muted py-5">
              <i class="fas fa-box-open fa-2x mb-3 d-block"></i>
              <p>هیچ محصولی در سفارش وجود ندارد</p>
            </div>
          </div>

          <!-- خلاصه مالی -->
          <div v-if="order?.items?.length" class="financial-summary mt-3">
            <div class="summary-card">
              <div class="summary-header">
                <i class="fas fa-chart-pie me-2 text-success"></i>
                <span class="fw-bold">خلاصه مالی</span>
              </div>

              <div class="info-item">
                <span class="info-label">
                  <i class="bi bi-cart3"></i>
                  جمع جزء
                </span>
                <span class="info-value">{{ formatPrice(order?.subtotal) }}</span>
              </div>

              <div class="info-item text-success">
                <span class="info-label">
                  <i class="fas fa-tag me-1"></i>
                  تخفیف
                </span>
                <span class="info-value discount-value">-{{ formatPrice(order?.discount_amount) }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">
                  <i class="bi bi-truck"></i>
                  هزینه ارسال
                </span>
                <span class="info-value">{{ formatPrice(order?.shipping_cost) }}</span>
              </div>

              <hr class="my-2">

              <div class="info-item total-item">
                <span class="info-label fw-bold">
                  <i class="bi bi-cash-stack"></i>
                  جمع کل
                </span>
                <span class="info-value total-price">{{ formatPrice(order?.total) }}</span>
              </div>
            </div>
          </div>
        </b-card>
      </b-col>
    </b-row>
    <!-- ===== سفارشات فرزند ===== -->
    <b-row v-if="order?.child_orders?.length" class="mt-3 mt-md-4">
      <b-col cols="12">
        <b-card class="detail-card" header-tag="header">
          <template #header>
            <div class="d-flex align-items-center flex-wrap gap-2">
              <i class="fas fa-sitemap me-2 text-info"></i>
              <span class="fw-bold">سفارشات فرزند</span>
              <span class="badge bg-info items-badge">
                <i class="bi bi-diagram-3 me-1"></i>
                {{ order.child_orders.length }} سفارش
              </span>
            </div>
          </template>

          <div v-for="child in order.child_orders" :key="child.id" class="child-order-block mb-3">
            <!-- هدر سفارش فرزند -->
            <div class="child-order-header d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 mb-2">
              <div>
                <span class="badge bg-primary me-2">#{{ child.id }}</span>
                <span :class="getStatusClass(child.status)">{{ getStatusText(child.status) }}</span>
                <small class="text-muted ms-2">
                  <i class="bi bi-calendar-check me-1"></i>
                  {{ formatDate(child.created_at) }}
                </small>
              </div>
              <div>
                هزینه حمل و نقل:
                {{ formatPrice(child.shipping_cost) }}
              </div>
              <div class="fw-bold text-success">
                {{ formatPrice(child.total) }}
              </div>
            </div>

            <!-- آیتم‌های سفارش فرزند -->
            <div class="table-responsive">
              <table class="table table-sm table-bordered align-middle text-center mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 60px;">تصویر</th>
                    <th class="text-start">محصول</th>
                    <th style="width: 80px;">تعداد</th>
                    <th style="width: 120px;">قیمت واحد</th>
                    <th style="width: 120px;">مجموع</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in child.items || []" :key="item.id">
                    <td class="row-index">{{ index + 1 }}</td>
                    <td>
                      <img width="50" height="50" class="product-thumb" :src="getProductImage(item)"
                        :alt="getProductTitle(item)" />
                    </td>
                    <td class="text-start">
                      <span class="fw-bold product-title">{{ getProductTitle(item) }}</span>
                      <div class="text-muted small variant-text">{{ getVariantText(item) }}</div>
                    </td>
                    <td><span class="quantity-badge">{{ item.quantity }}</span></td>
                    <td><span class="price-text">{{ formatPrice(item.price) }}</span></td>
                    <td class="fw-bold total-cell">
                      {{ formatPrice((item.price || 0) * (item.quantity || 0)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </b-card>
      </b-col>
    </b-row>
    <!-- ===== مودال ویرایش آدرس ===== -->
    <Modal v-if="showAddressModal" id="addressModal" @closeModal="() => { showAddressModal = false }"
      title="ویرایش آدرس">
      <div>
        <div class="mb-3">
          <label class="form-label">
            <i class="bi bi-geo-alt-fill me-1"></i>
            انتخاب آدرس جدید
          </label>
          <Treeselect v-model="addressForm.address_id" :multiple="false" :options="addressOptions"
            placeholder="انتخاب آدرس..." />
        </div>
        <div v-if="addressForm.current_address" class="current-info">
          <i class="bi bi-info-circle me-1"></i>
          آدرس فعلی: {{ getAddressText(addressForm.current_address) }}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary action-btn" @click="() => { showAddressModal = false; resetAddressModal(); }">
          <i class="bi bi-x"></i>
          <span>لغو</span>
        </button>
        <button class="btn btn-primary action-btn" @click="saveAddress" :disabled="savingAddress">
          <i v-if="savingAddress" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="bi bi-save2"></i>
          <span>ذخیره تغییرات</span>
        </button>
      </div>
    </Modal>

    <!-- ===== مودال ویرایش روش حمل ===== -->
    <Modal v-if="showShippingModal" id="shippingModal"
      @closeModal="() => { showShippingModal = false; resetShippingModal(); }" title="ویرایش روش حمل">
      <div>
        <div class="mb-3">
          <label class="form-label">
            <i class="bi bi-truck me-1"></i>
            انتخاب روش حمل
          </label>
          <Treeselect v-model="shippingForm.shipping_id" :multiple="false" :options="shippingOptions"
            placeholder="انتخاب روش حمل..." :normalizer="shippingNormalizer" />
        </div>
        <div v-if="shippingForm.current_shipping" class="current-info">
          <i class="bi bi-info-circle me-1"></i>
          روش فعلی: {{ shippingForm.current_shipping.title }} ({{ formatPrice(shippingForm.current_shipping.cost) }})
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary action-btn"
          @click="() => { showShippingModal = false; resetShippingModal(); }">
          <i class="bi bi-x"></i>
          <span>لغو</span>
        </button>
        <button class="btn btn-primary action-btn" @click="saveShipping" :disabled="savingShipping">
          <i v-if="savingShipping" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="bi bi-save2"></i>
          <span>ذخیره تغییرات</span>
        </button>
      </div>
    </Modal>

    <!-- ===== مودال افزودن آیتم ===== -->
    <Modal v-if="showItemModal" id="itemModal" @closeModal="() => { showItemModal = false; resetItemModal(); }"
      title="افزودن محصول جدید" size="lg">
      <div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">
              <i class="bi bi-box-seam me-1"></i>
              انتخاب محصول
            </label>
            <multiselect @search-change="loadProducts" v-model="itemForm._selectedProduct" placeholder="جستجوی محصول..."
              open-direction="bottom" :options="productOptions" label="title" track-by="id" :searchable="true"
              :multiple="false" :close-on-select="true" :show-labels="false" @select="onProductSelect">
              <template slot="noOptions">جستجو کنید</template>
              <template slot="noResult">
                <span v-if="isRequesting" v-text="'در حال جستجو...'" />
                <span v-else v-text="'موردی یافت نشد'"></span>
              </template>
            </multiselect>
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">
              <i class="bi bi-box me-1"></i>
              تعداد
            </label>
            <input type="number" class="form-control" v-model.number="itemForm.quantity" min="1" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">
              <i class="bi bi-tag me-1"></i>
              قیمت واحد
            </label>
            <input type="number" class="form-control" v-model.number="itemForm.price" min="0" />
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary action-btn" @click="() => { showItemModal = false; resetItemModal(); }">
          <i class="bi bi-x"></i>
          <span>لغو</span>
        </button>
        <button class="btn btn-success action-btn" @click="saveItem" :disabled="savingItem">
          <i v-if="savingItem" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="bi bi-plus-circle"></i>
          <span>افزودن محصول</span>
        </button>
      </div>
    </Modal>
  </b-container>
</template>

<script setup>
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, computed, onMounted } from "vue"
import axios from "axios"
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"
import { useRoute, useRouter } from "vue-router"
import { useAdmin } from '@/stores/modules/admin'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import Modal from '@/components/shared/modal.vue'
function findGateWayName(gateway_transactions) {
  let names = {
    parsian: 'پارسیان',
    zarinpal: 'زرین پال',
  }
  let finded = gateway_transactions.find(i => i.status == "paid")
  if (finded)
    return names[finded.gateway]
  return "-"
}
const store = useAdmin()
const checkPermission = store.checkPermission
const route = useRoute()
const router = useRouter()

const order = ref({ items: [], user: {}, address: {}, shipping: {} })
const updating = ref(false)
const isRequesting = ref(false)
const baseImageAddress = ''

const showAddressModal = ref(false)
const showShippingModal = ref(false)
const showItemModal = ref(false)
const savingAddress = ref(false)
const savingShipping = ref(false)
const savingItem = ref(false)

const addressForm = ref({ address_id: null, current_address: null })
const shippingForm = ref({ shipping_id: null, current_shipping: null })
const itemForm = ref({ product_id: null, product_variant_id: null, quantity: 1, price: 0, _selectedProduct: null })

const editingItem = ref(null)
const itemEditForm = ref({ quantity: 1, price: 0 })
const itemSaving = ref(false)
const itemRemoving = ref(null)
const loadingReservation = ref(false)

const addressOptions = ref([])
const shippingOptions = ref([])
const productOptions = ref([])

const canEdit = computed(() => {
  if (!order.value) return false
  return !['completed', 'failed', 'shipped'].includes(order.value.status)
})

const orderStatusOptions = [
  { value: "pending", text: "در انتظار" },
  { value: "reserved", text: "رزرو شده" },
  { value: "processing", text: "در حال پردازش" },
  { value: "shipped", text: "ارسال شده" },
  { value: "paid", text: "پرداخت شده" },
  { value: "completed", text: "تکمیل شده" },
  { value: "failed", text: "لغو شده" },
  { value: "returned", text: "مرجوع شده" },
]

const reservationTypeOptions = [
  { value: "none", text: "عادی" },
  { value: "three_days", text: "رزرو سه روزه" },
  { value: "seven_days", text: "رزرو هفت روزه" },
]

const paymentMethods = {
  online: "پرداخت آنلاین",
  wallet: "کیف پول",
  cod: "پرداخت در محل",
}
function showAddressModalFunc() {
  addressForm.value.current_address = order.value.address
  showAddressModal.value = true
}
function showShippingModalFunc() {
  showShippingModal.value = true;
  shippingForm.value.current_shipping = {
    id: order.value.shipping_id,
    title: order.value.shipping?.title,
    cost: order.value.shipping_cost
  }
}
const loadAddresses = async () => {
  try {
    const response = await axios.get(`/orders/${order.value.id}/addresses`)
    addressOptions.value = response.data.data.map(a => ({
      id: a.id,
      label: `${a.receiver_name} - ${a.address_line}`
    }))
    addressForm.value.current_address = order.value.address
  } catch (error) {
    console.error('Error loading addresses:', error)
  }
}

const saveAddress = async () => {
  if (!addressForm.value.address_id) {
    toast.error('لطفاً یک آدرس انتخاب کنید')
    return
  }

  savingAddress.value = true
  try {
    const response = await axios.put(`/orders/${order.value.id}/change-address`, {
      address_id: addressForm.value.address_id
    })

    if (response.data.success) {
      toast.success('آدرس با موفقیت تغییر کرد')
      await fetchOrder()
      showAddressModal.value = false
      resetAddressModal()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'خطا در تغییر آدرس')
  } finally {
    savingAddress.value = false
  }
}


const resetAddressModal = () => {
  addressForm.value = { address_id: null, current_address: null }
}

const loadShippings = async () => {
  try {
    const response = await axios.get(`/orders/${order.value.id}/available-shippings`)
    shippingOptions.value = response.data.data.map(s => ({
      id: s.id,
      name: s.name,
      cost: s.cost,
      is_current: s.is_current
    }))
    shippingForm.value.current_shipping = {
      id: order.value.shipping_id,
      title: order.value.shipping?.title,
      cost: order.value.shipping_cost
    }
  } catch (error) {
    console.error('Error loading shippings:', error)
  }
}

const saveShipping = async () => {
  if (!shippingForm.value.shipping_id) {
    toast.error('لطفاً یک روش حمل انتخاب کنید')
    return
  }

  savingShipping.value = true
  try {
    const response = await axios.put(`/orders/${order.value.id}/change-shipping`, {
      shipping_id: shippingForm.value.shipping_id
    })

    if (response.data.success) {
      toast.success('روش حمل با موفقیت تغییر کرد')
      await fetchOrder()
      showShippingModal.value = false
      resetShippingModal()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'خطا در تغییر روش حمل')
  } finally {
    savingShipping.value = false
  }
}

const resetShippingModal = () => {
  shippingForm.value = { shipping_id: null, current_shipping: null }
}

const changeReservationType = async () => {
  loadingReservation.value = true
  try {
    const response = await axios.put(`/orders/${order.value.id}/change-reservation-type`, {
      reservation_type: order.value.reservation_type
    })

    if (response.data.success) {
      toast.success('نوع سفارش با موفقیت تغییر کرد')
      await fetchOrder()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'خطا در تغییر نوع سفارش')
  } finally {
    loadingReservation.value = false
  }
}

const getReservationTypeText = (type) => {
  const map = {
    three_days: 'رزرو سه روزه',
    seven_days: 'رزرو هفت روزه'
  }
  return map[type] || 'عادی'
}

const startEditItem = (item) => {
  editingItem.value = item.id
  itemEditForm.value = {
    quantity: item.quantity,
    price: item.price
  }
}

const saveItemEdit = async (item) => {
  if (itemEditForm.value.quantity < 1) {
    toast.error('تعداد باید حداقل 1 باشد')
    return
  }
  if (itemEditForm.value.price < 0) {
    toast.error('قیمت نمی‌تواند منفی باشد')
    return
  }

  itemSaving.value = true
  try {
    const response = await axios.put(`/orders/${order.value.id}/items/${item.id}`, {
      quantity: itemEditForm.value.quantity,
      price: itemEditForm.value.price
    })

    if (response.data.success) {
      toast.success('آیتم با موفقیت به‌روزرسانی شد')
      await fetchOrder()
      editingItem.value = null
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'خطا در به‌روزرسانی آیتم')
  } finally {
    itemSaving.value = false
  }
}

const removeItem = async (itemId) => {
  if (!confirm('آیا از حذف این آیتم مطمئن هستید؟')) return

  itemRemoving.value = itemId
  try {
    const response = await axios.delete(`/orders/${order.value.id}/items/${itemId}`)

    if (response.data.success) {
      toast.success('آیتم با موفقیت حذف شد')
      await fetchOrder()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'خطا در حذف آیتم')
  } finally {
    itemRemoving.value = null
  }
}

const onProductSelect = (product) => {
  if (product) {
    itemForm.value.product_id = product.product_id
    itemForm.value.product_variant_id = product.id
    itemForm.value.price = product.price
    itemForm.value._selectedProduct = product
  }
}

const saveItem = async () => {
  if (!itemForm.value._selectedProduct) {
    toast.error('لطفاً یک محصول انتخاب کنید')
    return
  }
  if (itemForm.value.quantity < 1) {
    toast.error('تعداد باید حداقل 1 باشد')
    return
  }
  if (itemForm.value.price < 0) {
    toast.error('قیمت نمی‌تواند منفی باشد')
    return
  }

  savingItem.value = true
  try {
    const response = await axios.post(`/orders/${order.value.id}/items`, {
      product_id: itemForm.value.product_id,
      product_variant_id: itemForm.value.product_variant_id,
      quantity: itemForm.value.quantity,
      price: itemForm.value.price
    })

    if (response.data.success) {
      toast.success('آیتم با موفقیت اضافه شد')
      await fetchOrder()
      showItemModal.value = false
      resetItemModal()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'خطا در افزودن آیتم')
  } finally {
    savingItem.value = false
  }
}
const resetItemModal = () => {
  itemForm.value = {
    product_id: null,
    product_variant_id: null,
    quantity: 1,
    price: 0,
    _selectedProduct: null
  }
}

const loadProducts = async (search) => {
  if (!search || search.length < 2) return
  isRequesting.value = true
  try {
    const { data } = await axios.get('/products', { params: { search } })
    productOptions.value = await convertToSelectableProduct(data.data)
  } catch (error) {
    console.error('Error loading products:', error)
  } finally {
    isRequesting.value = false
  }
}

async function convertToSelectableProduct(productList) {
  let finalList = []
  productList.forEach(product => {
    if (product.variants.length > 1) {
      product.variants.forEach((variant) => {
        let obj = {
          id: variant.id,
          product_id: product.id,
          price: variant.price,
          title: `${product.title} || ${variant.values.map((att) => att.value).join("-")} || موجودی: ${variant.stock}`,
          isDisabled: variant.stock > 0 ? false : true
        }
        finalList.push(obj)
      })
    } else {
      let obj = {
        isDisabled: product.variants[0].stock > 0 ? false : true,
        id: product.variants[0].id,
        title: product.title,
        price: product.price,
        product_id: product.id
      }
      finalList.push(obj)
    }
  })
  return finalList
}

const shippingNormalizer = (node) => {
  return {
    id: node.id,
    label: node.name + (node.cost !== undefined ? ` (${node.cost.toLocaleString()} تومان)` : ''),
  }
}

const updateOrderStatus = async () => {
  if (!order.value?.id) {
    toast.error("شناسه سفارش نامعتبر")
    return
  }

  updating.value = true
  try {
    let fd = new FormData()
    fd.append("status", order.value.status)
    await axios.post(`/orders-change-status/${order.value.id}`, fd)
    toast.success("وضعیت سفارش با موفقیت بروزرسانی شد")
    await fetchOrder()
  } catch (e) {
    toast.error("خطا در بروزرسانی وضعیت سفارش")
    console.error(e)
  } finally {
    updating.value = false
  }
}

const fetchOrder = async () => {
  try {
    const res = await axios.get(`/orders/${route.params.id}`)
    order.value = res.data.data || {}

    if (!order.value.items) order.value.items = []
    if (!order.value.user) order.value.user = {}
    if (!order.value.address) order.value.address = {}
    if (!order.value.shipping) order.value.shipping = {}

    if (canEdit.value) {
      await loadAddresses()
      await loadShippings()
    }
  } catch (e) {
    toast.error("خطا در گرفتن اطلاعات سفارش")
    console.error(e)
  }
}

const getAddressText = (address) => {
  if (!address) return '---'
  return `${address.province?.name || ''} - ${address.city?.name || ''} - ${address.address_line || ''}`
}

const getStatusText = (status) => {
  const map = {
    pending: 'در انتظار',
    reserved: 'رزرو شده',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    paid: 'پرداخت شده',
    completed: 'تکمیل شده',
    failed: 'لغو شده',
    returned: 'مرجوع شده'
  }
  return map[status] || status || 'نامشخص'
}

const getStatusClass = (status) => {
  const map = {
    pending: 'badge bg-warning text-dark',
    reserved: 'badge bg-info text-white',
    processing: 'badge bg-primary text-white',
    shipped: 'badge bg-purple text-white',
    completed: 'badge bg-success text-white',
    failed: 'badge bg-danger text-white',
    returned: 'badge bg-secondary text-white'
  }
  return map[status] || ''
}

const formatDate = (date) => {
  if (!date) return '---'
  try {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return date
  }
}

const formatPrice = (val) => {
  if (!val && val !== 0) return "۰"
  return new Intl.NumberFormat("fa-IR").format(val) + " تومان"
}

const getProductTitle = (item) => {
  if (!item?.product) return 'نامشخص'
  let title = item.product.title || 'نامشخص'
  if (item.variant?.values?.length) {
    title += ` [${item.variant.values.map(v => decodeURIComponent(v.value)).join(' - ')}]`
  }
  return title
}

const getVariantText = (item) => {
  if (!item?.variant?.values?.length) return ''
  return item.variant.values
    .map(v => {
      const name = v.attribute_id === 1 ? 'سایز' : v.attribute_id === 2 ? 'رنگ' : 'ویژگی'
      return `${name}: ${decodeURIComponent(v.value)}`
    })
    .join(' - ')
}

const getProductImage = (item) => {
  if (!item?.product) return ''
  if (item.product.main_image && item.product.main_image.includes('http'))
    return item.product.main_image
  return window.baseImageAddress + item.product.main_image
}

const handleImageError = (e) => {
  e.target.src = '/images/no-image.png'
}

onMounted(fetchOrder)
</script>

<style scoped>
/* ===== هدر ===== */
.order-header {
  padding: 12px 0;
  border-bottom: 2px solid #f0f0f0;
}

.page-title {
  font-weight: 700;
  color: #2d3436;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.order-badge {
  font-size: 0.8rem;
  padding: 5px 12px;
  border-radius: 20px;
}

.order-date {
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

/* ===== کارت‌ها ===== */
.detail-card {
  border: none;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.detail-card :deep(.card-header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 2px solid #e2e8f0;
  padding: 14px 18px;
}

.user-badge {
  font-size: 0.78rem;
  padding: 5px 12px;
  border-radius: 20px;
}

.items-badge {
  font-size: 0.78rem;
  padding: 5px 12px;
  border-radius: 20px;
}

/* ===== info-item ===== */
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  flex-wrap: wrap;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}

.info-label i {
  color: #667eea;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  text-align: left;
  min-width: 0;
}

.value-text {
  word-break: break-word;
  text-align: left;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  flex-shrink: 0;
}

.reservation-value {
  flex-wrap: nowrap;
  gap: 6px;
}

.reservation-select {
  flex: 1;
  min-width: 0;
  max-width: 200px;
  border-radius: 8px;
}

/* ===== کارت عملیات ===== */
.actions-card {
  background: linear-gradient(135deg, #fffbf0, #fff8e6);
}

.status-form {
  margin-bottom: 0;
}

.status-select {
  border-radius: 10px;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  font-weight: 600;
}

.status-select:focus {
  border-color: #f39c12;
  box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.1);
}

.action-buttons .action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
}

/* ===== جدول ===== */
.table {
  margin-bottom: 0;
}

.table thead th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d3436;
  white-space: nowrap;
  font-size: 0.85rem;
  vertical-align: middle;
}

.table tbody td {
  vertical-align: middle;
  font-size: 0.85rem;
  padding: 10px 8px;
}

.row-index {
  font-weight: 700;
  color: #6c757d;
}

.product-thumb {
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.product-title {
  display: block;
  font-size: 0.88rem;
  line-height: 1.4;
  word-break: break-word;
}

.variant-text {
  font-size: 0.72rem;
  margin-top: 3px;
  line-height: 1.4;
}

.quantity-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 3px 10px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.78rem;
}

.price-text {
  color: #16a34a;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
}

.total-cell {
  color: #16a34a;
  font-size: 0.85rem;
  white-space: nowrap;
}

.edit-input {
  border-radius: 6px;
  max-width: 110px;
  margin: 0 auto;
  text-align: center;
  font-size: 0.82rem;
  padding: 5px 8px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
}

/* ===== کارت‌های آیتم موبایل ===== */
.item-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.item-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.item-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.item-index {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.item-card-header .product-thumb {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info .product-title {
  font-weight: 700;
  font-size: 0.85rem;
  color: #2d3436;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}

.item-info .variant-text {
  color: #6c757d;
  font-size: 0.7rem;
  margin-top: 3px;
}

.item-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}

.info-row>i {
  color: #667eea;
  font-size: 0.9rem;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.info-row .info-label {
  min-width: auto;
  font-size: 0.78rem;
}

.info-row .info-value {
  margin-right: auto;
  flex: none;
}

.total-row {
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
  margin-top: 4px;
}

.total-value {
  color: #16a34a;
  font-weight: 700;
  font-size: 0.9rem;
}

.item-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.78rem;
  padding: 8px 10px;
  font-weight: 600;
  border-radius: 8px;
}

.empty-items {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 30px 15px;
}

.empty-items i {
  color: #94a3b8;
}

/* ===== خلاصه مالی ===== */
.financial-summary {
  margin-top: 16px;
}

.summary-card {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #86efac;
  border-radius: 14px;
  padding: 16px;
}

.summary-header {
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 2px solid #86efac;
  margin-bottom: 12px;
  color: #15803d;
  font-size: 1rem;
}

.summary-card .info-item {
  padding: 8px 0;
  border-bottom: 1px dashed #a7f3d0;
}

.summary-card .info-label {
  color: #166534;
}

.summary-card .info-label i {
  color: #16a34a;
}

.summary-card .info-value {
  color: #065f46;
  font-weight: 700;
  justify-content: flex-end;
}

.discount-value {
  color: #16a34a;
}

.total-item {
  padding: 12px 0 0;
  border-bottom: none !important;
  border-top: 2px solid #86efac;
  margin-top: 4px;
}

.total-price {
  font-size: 1.15rem;
  color: #15803d !important;
  font-weight: 800;
}

.bg-purple {
  background-color: #6f42c1;
}

/* ===== مودال ===== */
.current-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.82rem;
  color: #64748b;
  border-right: 3px solid #667eea;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.modal-actions .action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 600;
}

/* ========================================= */
/* ===== موبایل (کمتر از 768px) ===== */
/* ========================================= */
@media (max-width: 767.98px) {
  .page-title {
    font-size: 1.1rem;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .order-date {
    justify-content: center;
    width: 100%;
  }

  .header-actions {
    justify-content: center;
    width: 100%;
  }

  .back-btn {
    width: 100%;
    justify-content: center;
  }

  /* info-item موبایل: زیر هم */
  .info-item {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 12px 0;
  }

  .info-label {
    min-width: auto;
    font-size: 0.8rem;
  }

  .info-value {
    justify-content: flex-start;
    text-align: right;
    flex-direction: row-reverse;
    gap: 6px;
  }

  .value-text {
    flex: 1;
  }

  .reservation-value {
    flex-wrap: nowrap;
  }

  .reservation-select {
    max-width: 100%;
    flex: 1;
  }

  /* خلاصه مالی موبایل */
  .summary-card .info-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .summary-card .info-value {
    justify-content: flex-end;
    flex-direction: row;
    text-align: left;
  }

  /* مودال موبایل: دکمه‌ها تمام عرض */
  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .action-btn {
    width: 100%;
  }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .page-title {
    font-size: 0.95rem;
  }

  .detail-card :deep(.card-header) {
    padding: 10px 12px;
  }

  .item-card {
    padding: 10px;
  }

  .item-card-header .product-thumb {
    width: 48px;
    height: 48px;
  }

  .item-info .product-title {
    font-size: 0.8rem;
  }

  .info-row {
    font-size: 0.75rem;
  }

  .summary-card {
    padding: 12px;
  }

  .total-price {
    font-size: 1rem;
  }
}

/* ========================================= */
/* ===== چاپ ===== */
/* ========================================= */
@media print {

  .btn,
  .alert {
    display: none !important;
  }

  .card {
    border: 1px solid #ddd !important;
    box-shadow: none !important;
  }

  .table {
    font-size: 12px !important;
  }
}
</style>