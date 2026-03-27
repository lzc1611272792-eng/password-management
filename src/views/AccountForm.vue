<template>
  <div class="form-page">
    <van-nav-bar
      :title="isEdit ? '编辑账号' : '添加账号'"
      left-arrow
      @click-left="router.back()"
    />

    <van-form @submit="handleSubmit" class="account-form">
      <div class="form-card glass">
        <van-cell-group inset>
          <div class="account-icon-display" @click="showIconPicker = true">
            <span v-if="form.icon.startsWith('si:')" class="icon-avatar">
               <img :src="getBrandIconUrl(form.icon)" class="brand-icon-avatar" />
            </span>
            <span v-else class="icon-avatar">{{ form.icon }}</span>
            <div class="icon-edit-tag">点击更换</div>
          </div>
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
          >
            <template #right-icon>
              <van-icon name="plus" @click.stop="showAddCategory = true" />
            </template>
          </van-field>

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
      </div>

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

    <!-- 快捷添加分类 -->
    <van-dialog
      v-model:show="showAddCategory"
      title="快速添加分类"
      show-cancel-button
      @confirm="handleAddCategory"
      class="custom-dialog"
    >
      <div class="cat-dialog-content">
        <van-field
          v-model="catForm.name"
          placeholder="输入新分类名称"
          class="dialog-field"
          autofocus
        />
      </div>
    </van-dialog>

    <van-popup v-model:show="showIconPicker" position="bottom" round class="icon-picker-popup">
      <div class="icon-picker-header">
        <span>选择账号图标</span>
        <van-icon name="cross" size="20" @click="showIconPicker = false" />
      </div>
      <div class="icon-selector-wrap">
        <div class="icon-tabs">
          <span
            class="icon-tab" :class="{ active: iconTab === 'brand' }"
            @click="iconTab = 'brand'"
          >品牌 Logo</span>
          <span
            class="icon-tab" :class="{ active: iconTab === 'emoji' }"
            @click="iconTab = 'emoji'"
          >Emoji 图标</span>
        </div>

        <div v-if="iconTab === 'brand'" class="icon-grid brand-grid">
          <div
            v-for="brand in brandIcons"
            :key="brand.id"
            class="icon-cell brand-cell"
            :class="{ 'active': form.icon === 'si:' + brand.id }"
            @click="form.icon = 'si:' + brand.id"
            :title="brand.label"
          >
            <img :src="'https://api.iconify.design/simple-icons/' + brand.id + '.svg?color=white'" class="brand-icon-picker" />
          </div>
        </div>

        <div v-if="iconTab === 'emoji'" class="icon-grid">
          <div
            v-for="emoji in presetIcons"
            :key="emoji"
            class="icon-cell"
            :class="{ 'active': form.icon === emoji }"
            @click="form.icon = emoji"
          >
            {{ emoji }}
          </div>
        </div>

        <div class="custom-icon-row">
          <span class="custom-label">自定义：</span>
          <van-field
            v-model="form.icon"
            placeholder="输入 Emoji 或 si:品牌名"
            class="custom-icon-input"
          />
        </div>
      </div>
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

const defaultCategoryParam = computed(() => route.query.defaultCategory)

const categoryColumns = computed(() =>
  accountsStore.categories.map(cat => ({ text: cat, value: cat }))
)

const form = ref({
  name: '',
  icon: '📂',
  category: '其他',
  username: '',
  password: '',
  url: '',
  notes: ''
})

const showPassword = ref(false)
const showCategoryPicker = ref(false)
const showIconPicker = ref(false)
const showGenerator = ref(false)
const showAddCategory = ref(false)
const saving = ref(false)

const catForm = ref({
  name: ''
})

const iconTab = ref('brand')

const brandIcons = [
  { id: 'apple', label: 'Apple' },
  { id: 'xiaomi', label: '小米' },
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'github', label: 'GitHub' },
  { id: 'steam', label: 'Steam' },
  { id: 'wechat', label: '微信' },
  { id: 'tencentqq', label: '腾讯' },
  { id: 'alipay', label: '支付宝' },
  { id: 'bilibili', label: 'Bilibili' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'meta', label: 'Meta' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'discord', label: 'Discord' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'samsung', label: '三星' },
  { id: 'huawei', label: '华为' },
  { id: 'sony', label: 'Sony' },
  { id: 'nvidia', label: 'Nvidia' },
  { id: 'adobe', label: 'Adobe' },
  { id: 'gitlab', label: 'GitLab' },
  { id: 'docker', label: 'Docker' },
  { id: 'cloudflare', label: 'Cloudflare' },
  { id: 'epicgames', label: 'Epic Games' },
]

const presetIcons = [
  '👥', '📧', '🏦', '💻', '🛒', '🎮', '📁', '📂',
  '📱', '🎵', '📷', '🎥', '🚀', '🔒', '❤️', '⭐',
  '🏠', '📚', '✈️', '🌍', '💰', '🎯', '💡', '💎',
  '🌟', '🌈', '🔥', '⚡', '🌿', '🎀', '🏆', '🎁',
  '🎓', '💼', '🛠️', '⚙️', '📦', '📊', '📈', '📝',
  '📌', '🔍', '🎨', '🎬', '🎮', '🏀', '⚽', '🚗',
  '🍔', '☕', '🍻', '🎂', '🐶', '🐱', '🌸', '🎶',
  '🌙', '☀️', '🌊', '❄️', '🍂', '🌋', '🙌', '😎'
]

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
  } else {
    if (defaultCategoryParam.value) {
      form.value.category = defaultCategoryParam.value
    } else if (accountsStore.categories.length > 0) {
      form.value.category = accountsStore.categories[0].name
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

function getBrandIconUrl(iconValue) {
  const brandId = iconValue.replace('si:', '')
  return `https://api.iconify.design/simple-icons/${brandId}.svg?color=white`
}

async function handleAddCategory() {
  const name = catForm.value.name.trim()
  if (!name) return
  if (accountsStore.addCategory(name)) {
    form.value.category = name
    catForm.value = { name: '' }
    showToast('分类已添加并选中')
    // 异步保存到 Gist
    try {
      const data = accountsStore.exportData()
      const encrypted = await encrypt(data, authStore.masterPassword)
      await updateGist(authStore.token, authStore.gistId, encrypted)
    } catch {
      // 失败也不影响当前操作，下次保存数据时会一并保存
    }
  } else {
    showToast('分类已存在')
  }
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
  position: relative;
  z-index: 1;
}

/* 导航栏 */
.form-page :deep(.van-nav-bar) {
  background: rgba(9, 9, 11, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
}

.form-page :deep(.van-nav-bar__title) {
  color: var(--text-primary);
  font-weight: 600;
}

.form-page :deep(.van-nav-bar__arrow) {
  color: var(--text-secondary);
}

/* 表单区域 */
.account-form {
  padding-top: 12px;
}

/* 顶部图标展示区 */
.account-icon-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.account-icon-display:active {
  transform: scale(0.95);
}

.icon-avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-glow-sm);
  margin-bottom: 8px;
}

.brand-icon-avatar {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.icon-edit-tag {
  font-size: 12px;
  color: var(--primary);
  background: rgba(167, 139, 250, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}

/* 独立图标选择弹窗 */
.icon-picker-popup {
  padding: 16px 20px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.icon-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.icon-selector-wrap {
  flex: 1;
  overflow-y: auto;
}

/* 图标网格复用 */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.icon-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  color: var(--text-muted);
  transition: all 0.2s ease;
  cursor: pointer;
}

.icon-cell.active {
  background: rgba(167, 139, 250, 0.15);
  border-color: var(--primary);
  color: var(--primary);
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.3);
}

.icon-grid::-webkit-scrollbar { width: 4px; }
.icon-grid::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }

.form-card {
  margin: 0 12px;
  border-radius: var(--radius-lg);
  padding: 8px 0;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

/* 卡片顶部渐变装饰线 */
.form-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0.5;
}

.form-card :deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: 0;
  background: transparent;
  border: none;
}

.form-card :deep(.van-cell) {
  background: transparent;
  color: var(--text-primary);
  padding: 14px 16px;
}

.form-card :deep(.van-cell::after) {
  border-color: var(--border-subtle);
}

.form-card :deep(.van-field__label) {
  color: var(--text-secondary);
  width: 60px;
  font-weight: 500;
}

.form-card :deep(.van-field__control) {
  color: var(--text-primary);
}

.form-card :deep(.van-field__control::placeholder) {
  color: var(--text-muted);
}

.form-card :deep(.van-field__right-icon),
.form-card :deep(.van-field__button .van-icon) {
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.form-card :deep(.van-field__button .van-icon:active) {
  color: var(--primary);
}

/* 密码强度条 */
.strength-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.02);
}

.strength-label {
  color: var(--text-muted);
  font-size: 13px;
  white-space: nowrap;
  font-weight: 500;
}

.strength-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px currentColor;
}

.strength-text {
  font-size: 12px;
  white-space: nowrap;
  font-weight: 600;
}

/* 提交按钮 */
.submit-btn {
  margin: 24px 12px 0;
}

.submit-btn :deep(.van-button--primary) {
  background: var(--gradient-primary);
  border: none;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  box-shadow: 0 6px 25px rgba(124, 58, 237, 0.4);
  transition: var(--transition-normal);
}

.submit-btn :deep(.van-button--primary:active) {
  transform: scale(0.97);
  box-shadow: 0 3px 15px rgba(124, 58, 237, 0.3);
}

/* 删除按钮 */
.delete-btn {
  margin: 12px 12px 0;
}

.delete-btn :deep(.van-button--danger) {
  border-color: rgba(248, 113, 113, 0.3);
  color: var(--danger);
  background: rgba(248, 113, 113, 0.06);
  height: 50px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.delete-btn :deep(.van-button--danger:active) {
  background: rgba(248, 113, 113, 0.15);
  transform: scale(0.97);
}

/* 密码生成器弹窗 */
.generator-popup {
  padding: 24px 20px;
  background: rgba(20, 20, 30, 0.98);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.generator-header .van-icon {
  color: var(--text-muted);
}

.generator-options {
  margin-bottom: 20px;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.option-row .van-slider {
  width: 200px;
  margin-left: 20px;
}

.option-row :deep(.van-slider__bar) {
  background: var(--gradient-primary);
}

.option-row :deep(.van-slider__button) {
  box-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
}

.option-row :deep(.van-checkbox__label) {
  color: var(--text-secondary);
}

.option-row :deep(.van-checkbox__icon--checked .van-icon) {
  background-color: var(--primary);
  border-color: var(--primary);
}

.generated-password :deep(.van-cell) {
  background: rgba(167, 139, 250, 0.08);
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: var(--radius-sm);
}

.generated-password :deep(.van-field__control) {
  color: var(--primary-light);
  font-family: 'Inter', monospace;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
}

.generated-password :deep(.van-field__label) {
  color: var(--text-secondary);
}

.generated-password :deep(.van-icon) {
  color: var(--primary);
}

.generator-actions {
  margin-top: 20px;
}

.generator-actions :deep(.van-button--primary) {
  background: var(--gradient-primary);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
}

/* 弹窗及选择器优化 */
:deep(.van-popup) {
  background: rgba(20, 20, 30, 0.98);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}

:deep(.van-dialog) {
  background: rgba(20, 20, 30, 0.98);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  color: #fff;
}

:deep(.van-dialog__header) {
  color: #fff;
  padding-top: 24px;
}

:deep(.van-dialog__content) {
  background: transparent;
}

:deep(.dialog-field) {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

:deep(.van-picker) {
  background: transparent;
}

:deep(.van-picker__toolbar) {
  border-bottom: 1px solid var(--border-subtle);
}

:deep(.van-picker__mask) {
  background-image: linear-gradient(180deg, rgba(20, 20, 30, 0.95), transparent), 
                    linear-gradient(0deg, rgba(20, 20, 30, 0.95), transparent) !important;
}

:deep(.van-picker__cancel),
:deep(.van-picker__confirm) {
  color: var(--primary);
  font-weight: 500;
}

:deep(.van-picker-column__item) {
  color: var(--text-muted);
}

:deep(.van-picker-column__item--selected) {
  color: var(--text-primary);
  font-weight: 600;
}

.icon-cell {
  font-size: 24px;
  line-height: 1;
}

.custom-icon-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.custom-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.custom-icon-input {
  flex: 1;
  background: var(--glass-bg);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 20px;
}

.custom-icon-input :deep(.van-field__control) {
  text-align: center;
  font-size: 20px;
}

/* 品牌图标相关 */
.brand-grid {
  grid-template-columns: repeat(4, 1fr);
  max-height: 240px;
}

.brand-cell {
  flex-direction: column;
  gap: 4px;
  padding: 8px 4px;
}

.brand-icon-picker {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

/* 标签页切换 */
.icon-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  padding: 3px;
}

.icon-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-muted);
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-tab.active {
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}
</style>
