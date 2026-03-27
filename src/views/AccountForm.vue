<template>
  <div class="form-page">
    <van-nav-bar
      :title="isEdit ? '编辑账号' : '添加账号'"
      left-arrow
      @click-left="router.back()"
    />

    <van-form @submit="handleSubmit" class="account-form">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="名称"
          placeholder="例如：GitHub、Gmail"
          :rules="[{ required: true, message: '请输入名称' }]"
        />

        <van-field
          v-model="form.category"
          label="分类"
          placeholder="选择分类"
          readonly
          is-link
          @click="showCategoryPicker = true"
        />

        <van-field
          v-model="form.username"
          label="用户名"
          placeholder="邮箱或用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />

        <van-field
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          label="密码"
          placeholder="输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <template #button>
            <van-icon
              :name="showPassword ? 'eye-o' : 'closed-eye'"
              size="20"
              @click="showPassword = !showPassword"
            />
            <van-icon
              name="magic-stick"
              size="20"
              style="margin-left: 12px"
              @click="showGenerator = true"
            />
          </template>
        </van-field>

        <div v-if="form.password" class="strength-bar">
          <div class="strength-label">密码强度</div>
          <div class="strength-track">
            <div
              class="strength-fill"
              :style="{ width: strengthPercent + '%', background: passwordStrength.color }"
            />
          </div>
          <div class="strength-text" :style="{ color: passwordStrength.color }">
            {{ passwordStrength.text }}
          </div>
        </div>

        <van-field
          v-model="form.url"
          label="网址"
          placeholder="https://example.com"
        />

        <van-field
          v-model="form.notes"
          label="备注"
          type="textarea"
          placeholder="可选备注信息"
          rows="2"
          autosize
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="saving"
        >
          {{ isEdit ? '保存修改' : '添加账号' }}
        </van-button>
      </div>

      <div v-if="isEdit" class="delete-btn">
        <van-button
          round
          block
          plain
          type="danger"
          @click="confirmDelete"
        >
          删除此账号
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showCategoryPicker" position="bottom" round>
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
        :confirm-button-text="'确定'"
        :cancel-button-text="'取消'"
      />
    </van-popup>

    <van-popup v-model:show="showGenerator" position="bottom" round>
      <div class="generator-popup">
        <div class="generator-header">
          <span>密码生成器</span>
          <van-icon name="cross" size="20" @click="showGenerator = false" />
        </div>

        <div class="generator-options">
          <div class="option-row">
            <span>长度：{{ generatorLength }}</span>
            <van-slider v-model="generatorLength" :min="8" :max="32" />
          </div>
          <div class="option-row">
            <van-checkbox v-model="generatorOpts.uppercase">大写字母</van-checkbox>
          </div>
          <div class="option-row">
            <van-checkbox v-model="generatorOpts.lowercase">小写字母</van-checkbox>
          </div>
          <div class="option-row">
            <van-checkbox v-model="generatorOpts.numbers">数字</van-checkbox>
          </div>
          <div class="option-row">
            <van-checkbox v-model="generatorOpts.symbols">特殊符号</van-checkbox>
          </div>
        </div>

        <div class="generated-password">
          <van-field
            v-model="generatedPassword"
            readonly
            label="生成密码"
          >
            <template #button>
              <van-icon name="replay" size="20" @click="regenerate" />
            </template>
          </van-field>
        </div>

        <div class="generator-actions">
          <van-button type="primary" block round @click="useGeneratedPassword">
            使用此密码
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, showConfirmDialog, closeToast } from 'vant'
import { useAuthStore } from '../stores/auth'
import { useAccountsStore } from '../stores/accounts'
import { encrypt, generatePassword, checkPasswordStrength } from '../utils/crypto'
import { updateGist } from '../api/github'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()

const isEdit = computed(() => route.name === 'EditAccount')
const accountId = computed(() => route.params.id)

const categoryColumns = computed(() =>
  accountsStore.categories.map(cat => ({ text: cat, value: cat }))
)

const form = ref({
  name: '',
  category: '其他',
  username: '',
  password: '',
  url: '',
  notes: ''
})

const showPassword = ref(false)
const showCategoryPicker = ref(false)
const showGenerator = ref(false)
const saving = ref(false)

const generatorLength = ref(16)
const generatorOpts = ref({
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true
})

const generatedPassword = ref('')

const passwordStrength = computed(() => checkPasswordStrength(form.value.password))
const strengthPercent = computed(() => {
  const levels = { weak: 25, medium: 50, strong: 75, 'very-strong': 100 }
  return levels[passwordStrength.value.level] || 0
})

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }

  if (isEdit.value && accountId.value) {
    const account = accountsStore.getAccountById(accountId.value)
    if (account) {
      form.value = { ...account }
    } else {
      showToast('账号不存在')
      router.back()
    }
  }

  regenerate()
})

watch(showGenerator, (val) => {
  if (val) regenerate()
})

function regenerate() {
  generatedPassword.value = generatePassword({
    length: generatorLength.value,
    ...generatorOpts.value
  })
}

function useGeneratedPassword() {
  form.value.password = generatedPassword.value
  showGenerator.value = false
  showToast('已使用生成的密码')
}

function onCategoryConfirm({ selectedOptions }) {
  form.value.category = selectedOptions[0].value
  showCategoryPicker.value = false
}

async function handleSubmit() {
  saving.value = true
  const toast = showLoadingToast({
    message: '保存中...',
    forbidClick: true,
    duration: 0
  })

  try {
    const now = Date.now()

    if (isEdit.value) {
      accountsStore.updateAccount(accountId.value, {
        ...form.value,
        updatedAt: now
      })
    } else {
      accountsStore.addAccount({
        id: crypto.randomUUID(),
        ...form.value,
        createdAt: now,
        updatedAt: now
      })
    }

    await saveData()

    closeToast()
    showToast({
      type: 'success',
      message: isEdit.value ? '修改成功' : '添加成功'
    })
    router.back()
  } catch (error) {
    closeToast()
    showToast('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

async function saveData() {
  const data = accountsStore.exportData()
  const encrypted = await encrypt(data, authStore.masterPassword)
  await updateGist(authStore.token, authStore.gistId, encrypted)
}

async function confirmDelete() {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除 "${form.value.name}" 吗？此操作不可恢复。`,
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    accountsStore.deleteAccount(accountId.value)
    await saveData()
    showToast('删除成功')
    router.back()
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.form-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%);
}

.form-page :deep(.van-nav-bar) {
  background: rgba(10, 10, 26, 0.9);
  backdrop-filter: blur(10px);
}

.form-page :deep(.van-nav-bar__title) {
  color: #fff;
}

.form-page :deep(.van-nav-bar__arrow) {
  color: #fff;
}

.account-form {
  padding-top: 12px;
}

.account-form :deep(.van-cell-group--inset) {
  margin: 0 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.15);
}

.account-form :deep(.van-cell) {
  background: transparent;
  color: #fff;
}

.account-form :deep(.van-field__label) {
  color: rgba(255, 255, 255, 0.8);
  width: 60px;
}

.account-form :deep(.van-field__control) {
  color: #fff;
}

.account-form :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.account-form :deep(.van-field__right-icon) {
  color: rgba(255, 255, 255, 0.6);
}

.strength-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
}

.strength-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  white-space: nowrap;
}

.strength-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s;
}

.strength-text {
  font-size: 12px;
  white-space: nowrap;
}

.submit-btn {
  margin: 24px 12px 0;
}

.submit-btn :deep(.van-button--primary) {
  background: linear-gradient(90deg, #00d4ff, #0099cc);
  border: none;
  height: 48px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
}

.delete-btn {
  margin: 12px 12px 0;
}

.delete-btn :deep(.van-button--danger) {
  border-color: rgba(255, 68, 68, 0.5);
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
  height: 48px;
}

.generator-popup {
  padding: 20px;
  background: #1a1a3a;
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #fff;
  font-size: 16px;
}

.generator-options {
  margin-bottom: 20px;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.option-row .van-slider {
  width: 200px;
  margin-left: 20px;
}

.option-row :deep(.van-checkbox__label) {
  color: rgba(255, 255, 255, 0.8);
}

.generated-password :deep(.van-cell) {
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
}

.generated-password :deep(.van-field__control) {
  color: #00d4ff;
  font-family: monospace;
  font-size: 16px;
}

.generator-actions {
  margin-top: 16px;
}

.generator-actions :deep(.van-button--primary) {
  background: linear-gradient(90deg, #00d4ff, #0099cc);
  border: none;
}

:deep(.van-popup) {
  background: #1a1a3a;
}

:deep(.van-picker) {
  background: #1a1a3a;
}

:deep(.van-picker__toolbar) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.van-picker__cancel),
:deep(.van-picker__confirm) {
  color: #00d4ff;
}

:deep(.van-picker-column__item) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.van-picker-column__item--selected) {
  color: #fff;
}
</style>
