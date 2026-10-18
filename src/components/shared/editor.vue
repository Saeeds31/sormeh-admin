<template>
  <div class="editor-container">
    <!-- ورودی HTML -->
    <div class="html-input-section">
      <textarea
        v-model="htmlInput"
        placeholder="کد HTML خود را اینجا وارد کنید..."
        class="html-textarea"
        dir="ltr"
      ></textarea>
      <button @click="insertHtml" type="button" class="insert-btn">درج HTML</button>
    </div>

    <!-- ظرف ادیتور Quill -->
    <div ref="editorContainer" class="quill-editor" dir="rtl"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

// quill-table-better (نسخه سازگار با Quill 2)
import QuillTableBetter from 'quill-table-better'
import 'quill-table-better/dist/quill-table-better.css'

// ثبت پلاگین جدول
Quill.register({
  'modules/table-better': QuillTableBetter
}, true)

// props و emit
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue'])

// رفرنس‌ها
const editorContainer = ref(null)
let quillInstance = null
const htmlInput = ref('')

// ========== تنظیمات ادیتور ==========
const toolbarOptions = [
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
  ['table-better'],   // دکمه درج جدول
  ['clean']
]

const editorOptions = {
  theme: 'snow',
  placeholder: 'متن خود را اینجا بنویسید...',
  modules: {
    table: false,           // غیرفعال کردن جدول پیش‌فرض Quill
    toolbar: toolbarOptions,
    'table-better': {
      language: 'en_US',    // زبان پیش‌فرض؛ اگر فارسی پشتیبانی نشد
      menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'delete'],
      toolbarTable: true
    },
    keyboard: {
      bindings: QuillTableBetter.keyboardBindings
    }
  }
}

// ========== راه‌اندازی ادیتور ==========
onMounted(() => {
  if (!editorContainer.value) return

  // ساخت نمونه Quill
  quillInstance = new Quill(editorContainer.value, editorOptions)

  // تنظیم RTL
  quillInstance.container.style.direction = 'rtl'
  quillInstance.container.style.textAlign = 'right'

  // اگر مقدار اولیه از والد آمده، بارگذاری کن
  if (props.modelValue) {
    const delta = quillInstance.clipboard.convert({ html: props.modelValue })
    const [range] = quillInstance.selection.getRange()
    quillInstance.updateContents(delta, Quill.sources.USER)
    quillInstance.setSelection(
      delta.length() - (range?.length || 0),
      Quill.sources.SILENT
    )
    quillInstance.scrollSelectionIntoView()
  }

  // گوش دادن به تغییرات محتوا
  quillInstance.on('text-change', () => {
    const html = quillInstance.root.innerHTML
    emit('update:modelValue', html)
  })
})

onBeforeUnmount(() => {
  if (quillInstance) {
    quillInstance = null
  }
})

// ========== درج HTML ==========
const insertHtml = () => {
  if (!quillInstance || !htmlInput.value.trim()) return

  try {
    const clipboard = quillInstance.getModule('clipboard')
    const range = quillInstance.getSelection(true)

    if (range) {
      clipboard.dangerouslyPasteHTML(range.index, htmlInput.value)
      quillInstance.setSelection(range.index + htmlInput.value.length, 0)
    } else {
      const length = quillInstance.getLength()
      clipboard.dangerouslyPasteHTML(length - 1, htmlInput.value)
    }

    htmlInput.value = ''
  } catch (error) {
    console.error('خطا در درج HTML:', error)
    alert('خطا در درج HTML. لطفاً کد را بررسی کنید.')
  }
}

// ========== متدهای عمومی برای والد ==========
const insertHtmlProgrammatically = (html) => {
  if (!quillInstance) return
  try {
    const clipboard = quillInstance.getModule('clipboard')
    const range = quillInstance.getSelection(true)
    if (range) {
      clipboard.dangerouslyPasteHTML(range.index, html)
    } else {
      const length = quillInstance.getLength()
      clipboard.dangerouslyPasteHTML(length - 1, html)
    }
  } catch (error) {
    console.error('خطا در درج HTML:', error)
  }
}

const setHtmlContent = (html) => {
  if (!quillInstance) return
  const delta = quillInstance.clipboard.convert({ html })
  const [range] = quillInstance.selection.getRange()
  quillInstance.updateContents(delta, Quill.sources.USER)
  quillInstance.setSelection(
    delta.length() - (range?.length || 0),
    Quill.sources.SILENT
  )
  quillInstance.scrollSelectionIntoView()
}

defineExpose({
  insertHtml: insertHtmlProgrammatically,
  setHtmlContent
})
</script>

<style scoped>
.editor-container {
  max-width: 800px;
  margin: 0 auto;
}

.html-input-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.html-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  direction: ltr;
  text-align: left;
}

.insert-btn {
  padding: 8px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Vazir', 'Arial', sans-serif;
  transition: background-color 0.3s;
}

.insert-btn:hover {
  background-color: #45a049;
}

.quill-editor {
  direction: rtl;
  text-align: right;
  font-family: 'Vazir', 'Arial', sans-serif;
  min-height: 300px;
}

.quill-editor :deep(.ql-toolbar) {
  direction: ltr;
}

/* استایل جدول داخل ادیتور */
.quill-editor :deep(.ql-editor table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}

.quill-editor :deep(.ql-editor table td),
.quill-editor :deep(.ql-editor table th) {
  border: 1px solid #ccc;
  padding: 6px 10px;
  min-width: 40px;
}

.quill-editor :deep(.ql-editor table th) {
  background-color: #f0f0f0;
  font-weight: bold;
}
</style>