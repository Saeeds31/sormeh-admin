<template>
    <div class="editor-container">
      <QuillEditor
        v-model:content="editorContent"
        content-type="html"
        theme="snow"
        :options="editorOptions"
        @ready="onEditorReady"
        @update:content="onEditorChange"
        dir="rtl"
        class="quill-editor"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { QuillEditor } from '@vueup/vue-quill'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import ImageUploader from 'quill-image-uploader'
  import BlotFormatter from 'quill-blot-formatter'
  import Quill from 'quill'
  
  // ثبت پلاگین‌ها
  Quill.register('modules/imageUploader', ImageUploader)
  Quill.register('modules/blotFormatter', BlotFormatter)
  
  // props و emit برای v-model
  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    }
  })
  const emit = defineEmits(['update:modelValue'])
  
  // مقدار داخلی برای QuillEditor
  const editorContent = ref(props.modelValue)
  
  // سینک کردن تغییرات با v-model
  watch(editorContent, (newValue) => {
    emit('update:modelValue', newValue) // آپدیت مقدار به والد
  })
  
  // سینک کردن modelValue از والد به ادیتور
  watch(() => props.modelValue, (newValue) => {
    if (newValue !== editorContent.value) {
      editorContent.value = newValue
    }
  })
  
  // تنظیمات ادیتور
  const editorOptions = {
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ align: ['right', 'center', 'left', 'justify'] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ color: [] }, { background: [] }],
        ['link', 'image', 'video', 'blockquote', 'code-block'],
        [{ direction: 'rtl' }],
        ['clean']
      ],
      imageUploader: {
        upload: (file) => {
          return new Promise((resolve, reject) => {
            const formData = new FormData()
            formData.append('file', file)
            fetch('/upload', {
              method: 'POST',
              body: formData
            })
              .then((response) => response.json())
              .then((result) => resolve(result.url))
              .catch(() => reject('آپلود تصویر ناموفق بود'))
          })
        }
      },
      blotFormatter: {}
    },
    placeholder: 'متن خود را اینجا بنویسید...'
  }
  
  // ایونت‌ها
  const onEditorReady = (quill) => {
    console.log('ادیتور آماده شد:', quill)
    quill.container.style.direction = 'rtl'
    quill.container.style.textAlign = 'right'
  }
  
  const onEditorChange = () => {
    console.log('محتوا تغییر کرد:', editorContent.value)
  }
  </script>
  
  <style scoped>
  .editor-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .quill-editor {
    direction: rtl;
    text-align: right;
    font-family: 'Vazir', 'Arial', sans-serif;
  }
  
  .quill-editor :deep(.ql-editor) {
    min-height: 300px;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .quill-editor :deep(.ql-toolbar) {
    direction: ltr;
  }
  </style>