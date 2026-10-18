<template>
  <b-navbar id="mainNavbar" variant="light" class="bg-white border-bottom px-3">
    <div class="navbar-wrapper d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between w-100 gap-2">
      
      <!-- بخش شارژ -->
      <div class="d-flex align-items-center justify-content-between justify-content-md-start gap-2 gap-md-3 credit-section">
        <div class="d-flex align-items-center gap-1 flex-wrap">
          <span class="fw-bold">شارژ پنل پیامک:</span>
          <span class="text-success">{{ smsCredit }}</span>
          <span>ریال</span>
        </div>

        <b-button
          variant="warning"
          class="AddCharge d-flex gap-2 align-items-center"
          size="sm"
          href="https://console.kavenegar.com/"
          target="_blank"
        >
          <i class="bi bi-plus"></i>
          <span>افزایش شارژ</span>
        </b-button>
      </div>

      <!-- بخش دکمه‌ها -->
      <b-navbar-nav class="d-flex align-items-center justify-content-center justify-content-md-end gap-2 action-buttons">
        
        <b-button variant="info" @click="router.go(-1)">
          <i class="bi-arrow-left"></i>
        </b-button>

        <b-button
          variant="outline-primary"
          size="sm"
          pill
          class="position-relative"
          @click="showNotificationModal"
        >
          <i class="bi bi-bell-fill"></i>
          <b-badge
            v-if="unseenCount > 0"
            class="bg-primary position-absolute top-0 start-100 translate-middle"
            style="font-size: 0.65rem; width: 24px;"
          >
            {{ unseenCount > 99 ? '99+' : unseenCount }}
          </b-badge>
        </b-button>

        <b-button variant="danger" @click="logout">
          <i class="bi-box-arrow-left"></i>
        </b-button>
      </b-navbar-nav>

    </div>
  </b-navbar>

  <Modal v-if="modalShow" id="detailModal" @closeModal="() => modalShow = false" title="مشاهده پیام">
    <b-tabs content-class="mt-3" justified pills>
      <b-tab title="جدید" active>
        <template #title>
          <span>جدید</span>
          <b-badge v-if="unseenCount > 0" pill bg="danger" class="me-1" style="font-size: 0.65rem;">
            {{ unseenCount }}
          </b-badge>
        </template>

        <div class="notification-list" style="max-height: 60vh; overflow-y: auto;">
          <div v-if="unseenNotifications.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-bell-slash fs-1 d-block mb-3"></i>
            <p>اعلان جدیدی وجود ندارد</p>
          </div>

          <div
            v-for="notif in unseenNotifications"
            :key="notif.id"
            class="notif-item p-3 border-bottom bg-light bg-opacity-75"
          >
            <div class="d-flex flex-column flex-sm-row gap-2 gap-sm-0">
              <div class="flex-shrink-0">
                <div class="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                  <i class="bi bi-bell-fill text-primary"></i>
                </div>
              </div>
              <div class="flex-grow-1 ms-sm-3">
                <h6 class="mb-1 fw-bold text-dark">{{ notif.title }}</h6>
                <p class="mb-1 small text-muted">{{ notif.message }}</p>
                <small class="text-primary fw-medium">
                  {{ formatJalaliTimeAgo(notif.created_at) }}
                </small>
              </div>
              <div class="align-self-start align-self-sm-center">
                <button class="badge bg-danger rounded-pill" @click="markAsSeen(notif)">
                  <span>دیده شد</span>
                  <i class="bi-check"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </b-tab>
    </b-tabs>

    <div class="p-3 border-top bg-light" v-if="unseenCount > 0">
      <b-button size="sm" variant="outline-primary" block @click="markAllAsSeen">
        <i class="bi bi-check2-all me-1"></i>
        علامت‌گذاری همه به عنوان خوانده شده
      </b-button>
    </div>
  </Modal>
</template>

<script setup>
import { BNavbar, BNavbarBrand, BNavbarNav, BButton } from 'bootstrap-vue-3'
import { useRouter } from "vue-router"
import { ref, computed, onMounted } from 'vue'
import { deleteCookie } from '../../tools/methods'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import { useAdmin } from '@/stores/modules/admin'
import Modal from '@/components/shared/modal.vue'

const smsCredit = ref("...");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchSmsCredit = async () => {
  while (true) {
    try {
      const { data } = await axios.get(
        "https://api.kavenegar.com/v1/766E333435704B712F6D626858324876395A396A79574F58584669374C4E7450634F613364505A4A6D2F453D/client/fetch.json?apikey=58734E58626A776F504146536367354A643863484F7A5A34703838694E66336B6B5156546333665135524D3D"
      );

      smsCredit.value = Number(data.entries.remaincredit).toLocaleString("en-US");
      return;
    } catch (error) {
      console.error("خطا در دریافت شارژ پنل پیامک، تلاش مجدد...");
      await sleep(3000);
    }
  }
};
const router = useRouter()
const store = useAdmin()

const modalShow = ref(false)

// داده‌های اعلان
const notifications = computed(() => store.notifications || [])

// جدا کردن دیده نشده و دیده شده
const unseenNotifications = computed(() =>
  notifications.value.filter(n => !n.seen)
)
const seenNotifications = computed(() =>
  notifications.value.filter(n => n.seen)
)

const unseenCount = computed(() => unseenNotifications.value.length)

// باز کردن مودال
const showNotificationModal = () => {
  modalShow.value = true
}

// یکی رو خونده شده کن
const markAsSeen = (notif) => {
  if (!notif.seen) {
    notif.seen = true
    toast.success('اعلان خوانده شد')
    axios.get(`notifications/${notif.id}/as-read`);
  }
}

// همه رو خونده شده کن
const markAllAsSeen = () => {
  const fd = new FormData();
  notifications.value.forEach(n => {
    if (!n.seen) {
      fd.append('ids[]', n.id)
      n.seen = true
    }
  })
  toast.success('همه اعلان‌ها خوانده شدند')
  axios.post('notifications/mark-many-read', fd);
}

// تبدیل تاریخ به حالت "چند دقیقه پیش"
const formatJalaliTimeAgo = (dateString) => {
  const now = new Date()
  const created = new Date(dateString)
  const diffMs = now - created
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'همین الان'
  if (diffMin < 60) return `${diffMin} دقیقه پیش`
  if (diffHour < 24) return `${diffHour} ساعت پیش`
  if (diffDay < 7) return `${diffDay} روز پیش`
  return created.toLocaleDateString('fa-IR')
}
const logout = () => {
  toast.success("با موفقیت خارج شدید")
  deleteCookie("token")
  delete axios.defaults.headers.common.Authorization
  router.push('/login')
}
onMounted(() => {
  fetchSmsCredit();
});
</script>

<style scoped>
/* ===== Navbar ===== */
#mainNavbar {
  position: sticky;
  top: 0;
  z-index: 1030;
}

/* ===== دکمه افزایش شارژ ===== */
.AddCharge {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  display: flex !important;
  align-items: center !important;
  padding: 0.625rem 1.25rem !important;
  border-radius: 10px !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  white-space: nowrap;
}

.AddCharge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}

/* ===== آواتار اعلان ===== */
.avatar-sm {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

/* ===== آیتم اعلان ===== */
.notif-item {
  transition: background 0.15s ease;
}

.notif-item:hover {
  background: #f8f9fa !important;
}

/* ===== موبایل (کمتر از 768px) ===== */
@media (max-width: 767.98px) {
  /* همه چیز زیر هم */
  .navbar-wrapper {
    flex-direction: column !important;
  }

  /* بخش شارژ */
  .credit-section {
    width: 100%;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 0.5rem !important;
  }

  .credit-section > div:first-child {
    justify-content: center;
    text-align: center;
  }

  .AddCharge {
    width: 100% !important;
    justify-content: center !important;
    margin: 0 !important;
  }

  /* دکمه‌های عملیات */
  .action-buttons {
    width: 100%;
    justify-content: center !important;
    padding-top: 0.5rem;
    border-top: 1px solid #e9ecef;
  }

  /* لیست اعلان‌ها */
  .notification-list {
    -webkit-overflow-scrolling: touch;
  }
}

/* ===== اسکرول‌بار سفارشی ===== */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>