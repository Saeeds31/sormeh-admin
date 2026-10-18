<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 comments-page" v-if="checkPermission(['comment_view'])">

    <!-- فیلتر و آمار -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-chat-dots"></i>
            <span>مدیریت کامنت‌ها</span>
          </h3>

          <!-- آمار -->
          <div class="stats-wrapper">
            <span class="stat-badge stat-pending">
              <i class="bi bi-clock-history"></i>
              در انتظار: {{ stats.pending }}
            </span>
            <span class="stat-badge stat-approved">
              <i class="bi bi-check-circle-fill"></i>
              تایید شده: {{ stats.approved }}
            </span>
            <span class="stat-badge stat-rejected">
              <i class="bi bi-x-circle-fill"></i>
              رد شده: {{ stats.rejected }}
            </span>
            <span class="stat-badge stat-total">
              <i class="bi bi-collection"></i>
              کل: {{ stats.total_comments }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-2 p-md-3">
        <form @submit.prevent="getComments()">
          <div class="row g-2">
            <div class="col-12 col-sm-6 col-md-3">
              <input
                v-model="filters.search"
                type="text"
                class="form-control search-input"
                placeholder="جستجو در محتوا..."
              />
            </div>
            <div class="col-6 col-sm-3 col-md-2">
              <select v-model="filters.status" class="form-select">
                <option value="">همه وضعیت‌ها</option>
                <option value="0">در انتظار</option>
                <option value="1">تایید شده</option>
                <option value="2">رد شده</option>
              </select>
            </div>
            <div class="col-6 col-sm-3 col-md-2">
              <select v-model="filters.type" class="form-select">
                <option value="">همه انواع</option>
                <option value="Modules\\Articles\\Models\\Article">مقاله</option>
                <option value="Modules\\Products\\Models\\Product">محصول</option>
              </select>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <input v-model="filters.date_from" type="date" class="form-control" placeholder="از تاریخ" />
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <button class="btn btn-primary w-100 search-btn" type="submit">
                <i class="bi bi-search"></i>
                <span>جستجو</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- لیست کامنت‌ها -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">در حال بارگذاری...</span>
          </div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!comments.data || comments.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>هیچ کامنتی یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style="width: 60px;">#</th>
                    <th>محتوا</th>
                    <th style="width: 130px;">کاربر</th>
                    <th style="width: 150px;">کامنت برای</th>
                    <th style="width: 80px;">امتیاز</th>
                    <th style="width: 100px;">وضعیت</th>
                    <th style="width: 140px;">تاریخ</th>
                    <th style="width: 200px;">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="comment in comments.data" :key="comment.id">
                    <td>{{ comment.id }}</td>
                    <td>
                      <div class="comment-content">
                        <div>{{ truncateText(comment.content, 80) }}</div>
                        <small v-if="comment.replies_count > 0" class="text-muted">
                          <i class="bi bi-reply"></i> {{ comment.replies_count }} پاسخ
                        </small>
                      </div>
                    </td>
                    <td>{{ comment.user?.full_name || 'ناشناس' }}</td>
                    <td>
                      <span class="badge" :class="getTypeBadgeClass(comment.commentable_type)">
                        {{ getTypeLabel(comment.commentable_type) }}
                        {{ comment.commentable ? comment.commentable.title : '' }}
                      </span>
                      <div v-if="comment.commentable" class="small text-muted">
                      </div>
                    </td>
                    <td>
                      <span v-if="comment.rating" class="rating-badge">
                        <i class="bi bi-star-fill"></i> {{ comment.rating }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(comment.status)">
                        {{ getStatusLabel(comment.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="small">{{ formatDate(comment.created_at) }}</div>
                      <div class="small text-muted">{{ formatTime(comment.created_at) }}</div>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm action-buttons" role="group">
                        <button v-if="comment.status === 0 || comment.status === 2" class="btn btn-success"
                          @click="changeStatus(comment.id, 1)" title="تایید">
                          <i class="bi bi-check-lg"></i>
                        </button>
                        <button v-if="comment.status === 0 || comment.status === 1" class="btn btn-danger"
                          @click="changeStatus(comment.id, 2)" title="رد">
                          <i class="bi bi-x-lg"></i>
                        </button>
                        <button v-if="comment.status !== 0" class="btn btn-warning" @click="changeStatus(comment.id, 0)"
                          title="برگشت به در انتظار">
                          <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button class="btn btn-info" @click="showReplyModal(comment)" title="پاسخ">
                          <i class="bi bi-reply"></i>
                        </button>
                        <button class="btn btn-danger" @click="deleteComment(comment.id)" title="حذف">
                          <i class="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== کارت موبایل ===== -->
            <div class="d-md-none comment-cards">
              <div
                v-for="comment in comments.data"
                :key="comment.id"
                class="comment-card"
              >
                <div class="comment-card-header">
                  <div class="comment-icon" :class="`icon-status-${comment.status}`">
                    <i class="bi bi-chat-quote-fill"></i>
                  </div>
                  <div class="comment-info">
                    <div class="comment-user">
                      <i class="bi bi-person-circle"></i>
                      {{ comment.user?.full_name || 'ناشناس' }}
                    </div>
                    <div class="comment-meta">
                      <span class="comment-id">#{{ comment.id }}</span>
                      <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                      <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                    </div>
                  </div>
                  <span
                    class="status-badge-sm"
                    :class="getStatusBadgeClass(comment.status)"
                  >
                    {{ getStatusLabel(comment.status) }}
                  </span>
                </div>

                <div class="comment-card-body">
                  <div class="comment-text">{{ comment.content }}</div>

                  <div class="comment-meta-row">
                    <!-- نوع کامنت -->
                    <span class="badge" :class="getTypeBadgeClass(comment.commentable_type)">
                      <i class="bi bi-tag-fill"></i>
                      {{ getTypeLabel(comment.commentable_type) }}
                      {{ comment.commentable ? '- ' + comment.commentable.title : '' }}
                    </span>

                    <!-- امتیاز -->
                    <span v-if="comment.rating" class="rating-badge">
                      <i class="bi bi-star-fill"></i> {{ comment.rating }}
                    </span>

                    <!-- تعداد پاسخ -->
                    <span v-if="comment.replies_count > 0" class="replies-badge">
                      <i class="bi bi-reply"></i>
                      {{ comment.replies_count }} پاسخ
                    </span>
                  </div>
                </div>

                <div class="comment-card-actions">
                  <button v-if="comment.status === 0 || comment.status === 2" class="btn btn-sm btn-success"
                    @click="changeStatus(comment.id, 1)">
                    <i class="bi bi-check-lg"></i>
                    <span>تایید</span>
                  </button>
                  <button v-if="comment.status === 0 || comment.status === 1" class="btn btn-sm btn-danger"
                    @click="changeStatus(comment.id, 2)">
                    <i class="bi bi-x-lg"></i>
                    <span>رد</span>
                  </button>
                  <button v-if="comment.status !== 0" class="btn btn-sm btn-warning" @click="changeStatus(comment.id, 0)">
                    <i class="bi bi-arrow-counterclockwise"></i>
                    <span>در انتظار</span>
                  </button>
                  <button class="btn btn-sm btn-info" @click="showReplyModal(comment)">
                    <i class="bi bi-reply"></i>
                    <span>پاسخ</span>
                  </button>
                  <button class="btn btn-sm btn-danger" @click="deleteComment(comment.id)">
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- صفحه‌بندی -->
          <b-pagination v-model="currentPage" :total-rows="comments.total"
            v-if="comments.last_page && comments.last_page > 1" :per-page="comments.per_page"
            @update:modelValue="changePage" align="center" class="mt-3 pagination-responsive">
          </b-pagination>
        </div>
      </div>
    </div>

    <!-- ===== مودال پاسخ ===== -->
    <div class="modal fade" id="replyModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-reply-fill"></i>
              پاسخ به کامنت
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">
                <i class="bi bi-chat-quote"></i>
                کامنت اصلی
              </label>
              <div class="reply-target-box">{{ replyTarget?.content }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">
                <i class="bi bi-pencil-square"></i>
                پاسخ شما
              </label>
              <textarea
                v-model="replyContent"
                class="form-control"
                rows="4"
                placeholder="متن پاسخ خود را وارد کنید..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x"></i>
              <span>انصراف</span>
            </button>
            <button type="button" class="btn btn-primary" @click="submitReply">
              <i class="bi bi-send-fill"></i>
              <span>ارسال پاسخ</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== مودال مشاهده ===== -->
    <div class="modal fade" id="viewModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-eye-fill"></i>
              جزئیات کامنت
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="viewComment">
              <div class="row g-2">
                <div class="col-12 col-md-6">
                  <strong>کاربر:</strong> {{ viewComment.user?.name || 'ناشناس' }}
                </div>
                <div class="col-12 col-md-6">
                  <strong>وضعیت:</strong>
                  <span class="badge" :class="getStatusBadgeClass(viewComment.status)">
                    {{ getStatusLabel(viewComment.status) }}
                  </span>
                </div>
              </div>
              <div class="row g-2 mt-2">
                <div class="col-12 col-md-6">
                  <strong>نوع:</strong> {{ getTypeLabel(viewComment.commentable_type) }}
                </div>
                <div class="col-12 col-md-6">
                  <strong>آی‌پی:</strong> {{ viewComment.ip || '-' }}
                </div>
              </div>
              <div class="mt-3">
                <strong>محتوا:</strong>
                <div class="view-content-box">{{ viewComment.content }}</div>
              </div>
              <div v-if="viewComment.rating" class="mt-2">
                <strong>امتیاز:</strong>
                <span class="text-warning">
                  <i class="bi bi-star-fill" v-for="n in viewComment.rating" :key="n"></i>
                </span>
              </div>
              <div v-if="viewComment.replies && viewComment.replies.length" class="mt-3">
                <strong>پاسخ‌ها:</strong>
                <div v-for="reply in viewComment.replies" :key="reply.id" class="reply-item">
                  {{ reply.content }}
                  <small class="text-muted d-block">
                    <i class="bi bi-person"></i>
                    {{ reply.user?.name || 'ناشناس' }}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary w-100 w-sm-auto" data-bs-dismiss="modal">
              <i class="bi bi-x"></i>
              <span>بستن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useAdmin } from '@/stores/modules/admin';
import { Modal } from 'bootstrap';

const store = useAdmin();
const checkPermission = store.checkPermission;

const comments = ref({ data: [], total: 0, per_page: 10, last_page: 1 });
const stats = ref({
  total_comments: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
  with_rating: 0,
  average_rating: 0,
  today_comments: 0,
  this_month: 0
});
const loading = ref(false);
const currentPage = ref(1);
const filters = ref({
  search: "",
  status: "",
  type: "",
  date_from: "",
  date_to: ""
});

const replyTarget = ref(null);
const replyContent = ref("");
const replyModal = ref(null);

const viewComment = ref(null);
const viewModal = ref(null);

async function getComments(url) {
  loading.value = true;
  try {
    const { data } = await axios.get(url || '/comments', {
      params: filters.value
    });
    comments.value = data;
    currentPage.value = data.current_page || 1;
  } catch (err) {
    console.error(err);
    Swal.fire("خطا", "مشکلی در دریافت کامنت‌ها پیش آمد", "error");
  } finally {
    loading.value = false;
  }
}

async function getStats() {
  try {
    const { data } = await axios.get('/comments-stats');
    stats.value = data;
  } catch (err) {
    console.error(err);
  }
}

async function changeStatus(id, status) {
  const statusMap = {
    0: 'در انتظار',
    1: 'تایید شده',
    2: 'رد شده'
  };

  const result = await Swal.fire({
    title: "تغییر وضعیت",
    text: `آیا می‌خواهید وضعیت این کامنت را به "${statusMap[status]}" تغییر دهید؟`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "بله، تغییر کن",
    cancelButtonText: "انصراف",
  });

  if (result.isConfirmed) {
    try {
      await axios.post(`/comments/${id}/status`, { status });
      Swal.fire("موفق", "وضعیت کامنت تغییر کرد", "success");
      getComments();
      getStats();
    } catch (err) {
      Swal.fire("خطا", "مشکلی در تغییر وضعیت پیش آمد", "error");
    }
  }
}

function showReplyModal(comment) {
  replyTarget.value = comment;
  replyContent.value = "";
  if (!replyModal.value) {
    const modalElement = document.getElementById('replyModal');
    replyModal.value = new Modal(modalElement);
  }
  replyModal.value.show();
}

async function submitReply() {
  if (!replyContent.value.trim()) {
    Swal.fire("خطا", "لطفاً متن پاسخ را وارد کنید", "error");
    return;
  }

  try {
    await axios.post(`/comments/${replyTarget.value.id}/reply`, {
      content: replyContent.value
    });
    Swal.fire("موفق", "پاسخ با موفقیت ثبت شد", "success");
    replyModal.value.hide();
    getComments();
    getStats();
  } catch (err) {
    Swal.fire("خطا", "مشکلی در ارسال پاسخ پیش آمد", "error");
  }
}

async function deleteComment(id) {
  const result = await Swal.fire({
    title: "حذف کامنت",
    text: "آیا مطمئن هستید؟ این کامنت به همراه پاسخ‌های آن حذف خواهد شد.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  });

  if (result.isConfirmed) {
    try {
      await axios.post(`/comments/${id}/delete`);
      Swal.fire("موفق", "کامنت حذف شد", "success");
      getComments();
      getStats();
    } catch (err) {
      Swal.fire("خطا", err.response?.data?.message || "مشکلی در حذف پیش آمد", "error");
    }
  }
}

const changePage = (page) => {
  if (page) getComments(`/comments?page=${page}`);
};

function getStatusLabel(status) {
  const map = { 0: 'در انتظار', 1: 'تایید شده', 2: 'رد شده' };
  return map[status] || 'نامشخص';
}

function getStatusBadgeClass(status) {
  const map = { 0: 'bg-warning', 1: 'bg-success', 2: 'bg-danger' };
  return map[status] || 'bg-secondary';
}

function getTypeLabel(type) {
  if (type === 'Modules\\Articles\\Models\\Article') return 'مقاله';
  if (type === 'Modules\\Products\\Models\\Product') return 'محصول';
  return 'سایر';
}

function getTypeBadgeClass(type) {
  if (type === 'Modules\\Articles\\Models\\Article') return 'bg-primary';
  if (type === 'Modules\\Products\\Models\\Product') return 'bg-success';
  return 'bg-secondary';
}

function truncateText(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR');
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  getComments();
  getStats();
});
</script>

<style scoped>
/* ===== هدر ===== */
.header-card .card-header {
  padding: 16px 20px 8px;
  background: transparent;
  border-bottom: none;
}

.header-card .card-body {
  padding: 8px 20px 16px;
}

.page-title {
  font-weight: 700;
  color: #2d3436;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== آمار ===== */
.stats-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.stat-pending {
  background: #fef3c7;
  color: #b45309;
}

.stat-approved {
  background: #dcfce7;
  color: #16a34a;
}

.stat-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.stat-total {
  background: #e2e8f0;
  color: #475569;
}

/* ===== فیلتر ===== */
.search-input {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
}

.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
}

/* ===== جدول ===== */
.table th,
.table td {
  vertical-align: middle;
}

.table td {
  padding: 0.5rem;
}

.table thead th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d3436;
  white-space: nowrap;
  font-size: 0.9rem;
}

.comment-content {
  max-width: 250px;
}

.comment-content div {
  word-wrap: break-word;
}

.badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.7rem;
}

/* بج امتیاز */
.rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

/* دکمه‌های عملیات جدول */
.action-buttons .btn {
  padding: 0.25rem 0.5rem;
  border-radius: 6px !important;
}

.action-buttons .btn:hover {
  transform: translateY(-1px);
  transition: all 0.15s ease;
}

/* ===== کارت‌های موبایل ===== */
.comment-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.comment-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.comment-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.comment-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.icon-status-0 {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.icon-status-1 {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}

.icon-status-2 {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.comment-info {
  flex: 1;
  min-width: 0;
}

.comment-user {
  font-weight: 700;
  color: #2d3436;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-user i {
  color: #6c5ce7;
  flex-shrink: 0;
}

.comment-meta {
  display: flex;
  gap: 8px;
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 3px;
  flex-wrap: wrap;
}

.comment-id {
  background: #f1f5f9;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 700;
}

.comment-date,
.comment-time {
  display: inline-flex;
  align-items: center;
}

.status-badge-sm {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* بدنه کارت */
.comment-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.comment-text {
  background: #f8fafc;
  border-right: 3px solid #6c5ce7;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.6;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.comment-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.replies-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

/* دکمه‌ها */
.comment-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comment-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 7px 10px;
  font-weight: 600;
  flex: 1 1 calc(50% - 3px);
  border-radius: 8px;
}

/* ===== مودال ===== */
.reply-target-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
  word-break: break-word;
}

.view-content-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  word-break: break-word;
}

.reply-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 6px;
  font-size: 0.85rem;
  color: #334155;
  word-break: break-word;
}

/* ===== Pagination ===== */
.pagination-responsive {
  flex-wrap: wrap;
  justify-content: center;
}

/* ========================================= */
/* ===== موبایل (کمتر از 768px) ===== */
/* ========================================= */
@media (max-width: 767.98px) {
  .header-card .card-header {
    padding: 12px 14px 6px;
  }

  .header-card .card-body {
    padding: 6px 14px 14px;
  }

  .page-title {
    font-size: 1.15rem;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .stats-wrapper {
    justify-content: center;
  }

  .stat-badge {
    font-size: 0.7rem;
    padding: 4px 10px;
  }

  /* دکمه‌های مودال تمام عرض */
  .modal-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .modal-footer .btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .page-title {
    font-size: 1rem;
  }

  .stat-badge {
    font-size: 0.65rem;
    padding: 3px 8px;
  }

  .comment-card {
    padding: 12px;
  }

  .comment-icon {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .comment-text {
    font-size: 0.8rem;
    padding: 8px 10px;
  }

  .comment-card-actions .btn {
    font-size: 0.7rem;
    padding: 6px 8px;
  }

  .comment-card-actions .btn span {
    display: none;
  }

  .comment-card-actions .btn i {
    font-size: 0.9rem;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .comment-cards {
    display: none;
  }
}
</style>