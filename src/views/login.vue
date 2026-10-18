<template>
  <div class="login-page d-flex justify-content-center align-items-center vh-100">
    <!-- Animated background -->
    <div class="animated-bg"></div>

    <b-card class="login-card p-4 shadow-lg" :class="{ 'card-loaded': isLoaded }">
      <!-- Decorative icon -->
      <div class="login-icon mb-3">
        <div class="icon-circle">
          <i class="bi-shield-lock"></i>
        </div>
      </div>

      <h2 class="text-center mb-2 text-gradient">خوش آمدید</h2>
      <p class="text-center text-muted mb-4 subtitle">لطفاً اطلاعات خود را وارد کنید</p>

      <b-form @submit.prevent="handleLogin" id="loginForm">
        <!-- Username with enhanced styling -->
        <b-form-group label-for="username" class="mb-4">
          <label class="form-label fw-semibold mb-2">شماره موبایل</label>
          <div class="input-group custom-input-group">
            <b-form-input id="username" name="mobile" v-model="username" placeholder="09123456789" required
              class="custom-input" :class="{ 'input-filled': username }"></b-form-input>
            <span @click="sendOtp()" :class="{ 'disableButton': counter != 0, 'otp-btn-active': counter == 0 }"
              class="input-group-text otp-btn">
              <i v-if="counter <= 0" class="bi-send-fill"></i>
              <span v-else class="counter-text">{{ counter }}</span>
            </span>
          </div>
        </b-form-group>

        <!-- OTP Input with enhanced styling -->
        <b-form-group label-for="password" class="mb-4">
          <label class="form-label fw-semibold mb-2">کد یکبار مصرف</label>
          <v-otp-input ref="otpInput" input-classes="otp-input-enhanced" inputmode="tel" separator='-'
            inputType="letter-numeric" :num-inputs="6" v-model:value="otp" />
        </b-form-group>

        <!-- Enhanced Submit Button -->
        <b-button type="submit" variant="primary" class="w-100 btn-login-enhanced"
          :class="{ 'btn-loading': isLoading }">
          <span v-if="!isLoading">ورود به پنل</span>
          <span v-else class="loading-spinner">
            <i class="bi-arrow-repeat spin"></i> در حال ورود...
          </span>
        </b-button>
      </b-form>

      <!-- Enhanced message display -->
      <div v-if="message" class="mt-3 message-alert">
        <i class="bi-exclamation-triangle-fill me-2"></i>
        {{ message }}
      </div>

      <!-- Footer -->
      <div class="footer-text mt-4 text-center">
        <small class="text-muted">© 2024 - تمامی حقوق  برای ماه ستی محفوظ است</small>
      </div>
    </b-card>
  </div>
</template>

<script setup>
import {
  BCard,
  BForm,
  BFormGroup,
  BFormInput,
  BButton
} from 'bootstrap-vue-3';
import axios from 'axios';
import { ref, onMounted } from "vue"
import { toast } from 'vue3-toastify'
import { useRouter } from "vue-router";
import VOtpInput from "vue3-otp-input";
import { setCookie } from "../tools/methods.js"
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();

const router = useRouter();
let username = ref('');
let password = ref('');
let message = ref('');
let otp = ref();
let counter = ref(0);
let isLoading = ref(false);
let isLoaded = ref(false);

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
  }, 100);
});

function handleLogin() {
  if (!username.value || !otp) {
    toast.error("لطفا شماره تماس و کد یکبار مصرف را وارد کنید")
    return
  }
  isLoading.value = true;
  let fd = new FormData();
  fd.append("mobile", username.value)
  fd.append("token", otp.value)
  axios.post("/login-verify", fd).then(res => {
    toast.success("ورود موفقیت آمیز بود! 🎉")
    axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;
    message.value = '';
    setCookie("token", res.data.token)
    store.getAdminDetail();
    setTimeout(() => {
      router.push("/dashboard")
    }, 500);
  }).catch(err => {
    console.log(err);
    message.value = 'نام کاربری و رمز عبور اشتباه است.'
    isLoading.value = false;
    toast.error("خطا در ورود به سیستم")
  })
}

function sendOtp() {
  if (!username.value) {
    toast.warning("لطفا شماره موبایل خود را وارد کنید")
    return
  }
  counter.value = -1;
  let fd = new FormData();
  fd.append("mobile", username.value);
  axios.post("/send-token", fd).then((res) => {
    toast.success("کد یکبار مصرف برای شما ارسال شد! ✨")
    showTimer();
  }).catch((err) => {
    counter.value = 0;
    toast.error(err.response?.data?.message)
  })
}

let timer = null;
function showTimer() {
  counter.value = 60;
  clearInterval(timer);
  timer = setInterval(() => {
    counter.value--;
    if (counter.value == 0) {
      clearInterval(timer);
    }
  }, 1000);
}
</script>

<style scoped>
.login-page {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

/* Animated Background */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: pulse 10s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }
}

/* Enhanced Card */
.login-card {
  width: 420px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(20px);
  opacity: 0;
  animation: slideUp 0.6s ease-out forwards;
  z-index: 1;
}

.card-loaded {
  transform: translateY(0);
  opacity: 1;
}

@keyframes slideUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
}

/* Icon Styling */
.login-icon {
  text-align: center;
}

.icon-circle {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.icon-circle i {
  font-size: 32px;
  color: white;
}

.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}

.subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Form Labels */
.form-label {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Custom Input Group */
.custom-input-group {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.custom-input-group:focus-within {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: scale(1.02);
}

.custom-input {
  border: 2px solid #e2e8f0;
  border-right: none;
  padding: 12px 16px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.custom-input:focus {
  border-color: #667eea;
  box-shadow: none;
}

.input-filled {
  border-color: #667eea;
}

/* OTP Button */
.otp-btn {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e2e8f0;
  border-left: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  font-weight: 600;
}

.otp-btn-active {
  animation: pulse 1s infinite;
}

.otp-btn:hover:not(.disableButton) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.disableButton {
  cursor: not-allowed;
  opacity: 0.7;
}

.counter-text {
  font-size: 1.1rem;
  font-weight: 700;
}

/* Enhanced OTP Input */
:deep(.otp-input-enhanced) {
  width: 48px !important;
  height: 54px !important;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 4px;
  transition: all 0.3s ease;
}

:deep(.otp-input-enhanced:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
}

:deep(.otp-input-container) {
  display: flex;
  justify-content: center;
  direction: ltr;
  gap: 8px;
}

/* Enhanced Login Button */
.btn-login-enhanced {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-login-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-login-enhanced:hover::before {
  left: 100%;
}

.btn-login-enhanced:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.btn-login-enhanced:active {
  transform: translateY(0);
}

.btn-loading {
  opacity: 0.8;
  cursor: wait;
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* Message Alert */
.message-alert {
  background: linear-gradient(135deg, #fee2e2 0%, #ffc3c3 100%);
  color: #dc2626;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  animation: shake 0.5s ease;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

/* Footer */
.footer-text {
  font-size: 0.8rem;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.footer-text:hover {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 576px) {
  .login-card {
    width: 90%;
    margin: 0 16px;
    padding: 1.5rem;
  }

  :deep(.otp-input-enhanced) {
    width: 40px !important;
    height: 46px !important;
    font-size: 1rem;
  }

  .icon-circle {
    width: 60px;
    height: 60px;
  }

  .icon-circle i {
    font-size: 28px;
  }
}
</style>

<style>
/* Global OTP Styles */
input.otp-input-enhanced {
  width: 48px;
  height: 54px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
}

.otp-input-container {
  display: flex;
  justify-content: center;
  direction: ltr;
}

/* Bootstrap Overrides */
.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}
</style>