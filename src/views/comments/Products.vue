<template>
    <div class="container mt-4" v-if="checkPermission(['comment_products'])">
  
      <!-- باکس فیلتر -->
      <div class="card mb-3">
        <div class="card-body">
          <form @submit.prevent="getComments">
            <div class="row g-2">
              <div class="col-md-4">
                <input
                  v-model="filters.content"
                  type="text"
                  class="form-control"
                  placeholder="جستجو بر اساس متن کامنت"
                />
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary w-100" type="submit">جستجو</button>
              </div>
            </div>
          </form>
        </div>
      </div>
  
      <!-- دکمه افزودن -->
      <div class="mb-3 text-end">
        <router-link to="/comments/create" class="btn btn-success">
          افزودن کامنت
        </router-link>
      </div>
  
      <!-- جدول -->
      <div class="card">
        <div class="card-body">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">در حال بارگذاری...</span>
            </div>
          </div>
  
          <div v-else>
            <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>کاربر</th>
                  <th>متن</th>
                  <th>امتیاز</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comment in comments.data" :key="comment.id">
                  <td>{{ comment.id }}</td>
                  <td>{{ comment.user?.name || '---' }}</td>
                  <td>{{ comment.content }}</td>
                  <td>{{ comment.rating }}</td>
                  <td>
                    <span
                      :class="comment.status ? 'badge bg-success' : 'badge bg-secondary'"
                    >
                      {{ comment.status ? 'فعال' : 'غیرفعال' }}
                    </span>
                  </td>
                  <td>
                    <router-link
                      :to="`/comments/${comment.id}/edit`"
                      class="btn btn-sm btn-warning me-2"
                    >
                    <i class="bi bi-pen"></i>
                    <span>  ویرایش</span>
                    </router-link>
                    <button
                      class="btn btn-sm btn-danger"
                      @click="deleteComment(comment.id)"
                    >
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
  
            <!-- صفحه بندی -->
            <nav v-if="comments.meta">
              <ul class="pagination justify-content-center">
                <li
                  v-for="link in comments.meta.links"
                  :key="link.label"
                  :class="['page-item', { active: link.active, disabled: !link.url }]"
                >
                  <a
                    href="#"
                    class="page-link"
                    v-html="link.label"
                    @click.prevent="changePage(link.url)"
                  ></a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import axios from "axios";
  import Swal from "sweetalert2";
  
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
  const comments = ref({ data: [], meta: null });
  const loading = ref(false);
  const filters = ref({ content: "" });
  let currentUrl = "/api/comments";
  
  const getComments = async (url = currentUrl) => {
    loading.value = true;
    try {
      const { data } = await axios.get(url, { params: filters.value });
      comments.value = data;
      currentUrl = url;
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };
  
  const changePage = (url) => {
    if (url) getComments(url);
  };
  
  const deleteComment = (id) => {
    Swal.fire({
      title: "حذف کامنت",
      text: "آیا مطمئن هستید؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "بله، حذف شود",
      cancelButtonText: "انصراف",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/comments/${id}`);
          Swal.fire("موفق", "کامنت حذف شد", "success");
          getComments();
        } catch (err) {
          Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
        }
      }
    });
  };
  
  onMounted(() => {
    getComments();
  });
  </script>
  