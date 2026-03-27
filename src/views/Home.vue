<template>
  <div class="home-page">
    <div class="nav-glass">
      <van-nav-bar title="密码管理器" fixed>
        <template #right>
          <van-icon name="setting-o" size="20" @click="showSettings = true" />
        </template>
      </van-nav-bar>
    </div>

    <div class="content">
      <van-search
        v-model="searchQuery"
        placeholder="搜索账号..."
        shape="round"
        background="transparent"
        @update:model-value="handleSearch"
      />

      <div class="category-tabs">
        <van-tabs v-model:active="activeCategory" shrink @change="handleCategoryChange">
          <van-tab title="全部" name="" />
          <van-tab
            v-for="cat in accountsStore.categories"
            :key="cat"
            :title="cat"
            :name="cat"
          />
        </van-tabs>
      </div>

      <div class="account-list">
        <van-swipe-cell
          v-for="(account, index) in accountsStore.filteredAccounts"
          :key="account.id"
          class="account-card"
          :style="{ animationDelay: index * 0.06 + 's' }"
        >
          <div class="card-content" @click="goEdit(account.id)">
            <div class="card-header">
              <div class="card-icon">{{ getCategoryIcon(account.category) }}</div>
              <div class="card-info">
                <div class="card-name">{{ account.name }}</div>
                <div class="card-username">{{ maskUsername(account.username) }}</div>
              </div>
              <van-icon name="arrow" color="rgba(255,255,255,0.2)" />
            </div>
            <div class="card-actions">
              <button class="action-chip" @click.stop="copyText(account.username, '用户名')">
                <span class="chip-icon">👤</span>
                <span>复制用户名</span>
              </button>
              <button class="action-chip" @click.stop="copyText(account.password, '密码')">
                <span class="chip-icon">🔑</span>
                <span>复制密码</span>
              </button>
              <button v-if="account.url" class="action-chip" @click.stop="openUrl(account.url)">
                <span class="chip-icon">🔗</span>
                <span>访问</span>
              </button>
            </div>
          </div>
          <template #right>
            <van-button
              square
              type="danger"
              text="删除"
              class="delete-btn"
              @click="confirmDelete(account)"
            />
          </template>
        </van-swipe-cell>

        <van-empty
          v-if="accountsStore.filteredAccounts.length === 0"
          description="暂无账号数据"
          image="search"
        />
      </div>
    </div>

    <div class="fab-wrapper" @click="goAdd">
      <div class="fab-pulse"></div>
      <van-floating-bubble
        axis="xy"
        icon="plus"
        magnetic="x"
        @click="goAdd"
      />
    </div>

    <van-action-sheet
      v-model:show="showSettings"
      title="设置"
      :actions="settingsActions"
      @select="onSettingSelect"
      cancel-text="取消"
    />

    <!-- 分类管理弹窗 -->
    <van-popup v-model:show="showCategoryManager" position="bottom" round class="manager-popup">
      <div class="manager-header">
        <span>管理分类</span>
        <van-icon name="cross" size="20" @click="showCategoryManager = false" />
      </div>

      <div class="manager-content">
        <div class="add-category">
          <van-field
            v-model="newCategoryName"
            placeholder="新分类名称"
            autofocus
            @keyup.enter="handleAddCategory"
          >
            <template #button>
              <van-button size="small" type="primary" @click="handleAddCategory">添加</van-button>
            </template>
          </van-field>
        </div>

        <div class="category-list">
          <div v-for="cat in accountsStore.categories" :key="cat" class="category-item">
            <span class="cat-name">{{ cat }}</span>
            <van-icon
              v-if="cat !== '其他'"
              name="delete-o"
              color="#f87171"
              size="18"
              @click="handleDeleteCategory(cat)"
            />
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useAuthStore } from '../stores/auth'
import { useAccountsStore } from '../stores/accounts'
import { encrypt } from '../utils/crypto'
import { updateGist } from '../api/github'

const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()

const searchQuery = ref('')
const activeCategory = ref('')
const showSettings = ref(false)
const showCategoryManager = ref(false)
const newCategoryName = ref('')

const settingsActions = [
  { name: '管理分类类型', value: 'manage_categories' },
  { name: '导出备份文件', value: 'export' },
  { name: '退出登录', value: 'logout', color: '#f87171' }
]

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
  }
})

function getCategoryIcon(category) {
  const icons = {
    '社交': '👥',
    '邮箱': '📧',
    '银行': '🏦',
    '开发': '💻',
    '购物': '🛒',
    '游戏': '🎮',
    '其他': '📁'
  }
  return icons[category] || '📁'
}

function maskUsername(username) {
  if (!username) return ''
  if (username.includes('@')) {
    const [name, domain] = username.split('@')
    return `${name.slice(0, 2)}***@${domain}`
  }
  return `${username.slice(0, 3)}****${username.slice(-2)}`
}

function handleSearch(value) {
  accountsStore.setSearchQuery(value)
}

function handleCategoryChange(name) {
  accountsStore.setSelectedCategory(name)
}

function goAdd() {
  router.push('/account/add')
}

function goEdit(id) {
  router.push(`/account/edit/${id}`)
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text)
    showToast(`${label}已复制`)
  } catch {
    showToast('复制失败')
  }
}

function openUrl(url) {
  if (!url.startsWith('http')) {
    url = 'https://' + url
  }
  window.open(url, '_blank')
}

async function confirmDelete(account) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除 "${account.name}" 吗？`,
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    accountsStore.deleteAccount(account.id)
    await saveData()
    showToast('删除成功')
  } catch {
    // 用户取消
  }
}

async function saveData() {
  try {
    const data = accountsStore.exportData()
    const encrypted = await encrypt(data, authStore.masterPassword)
    await updateGist(authStore.token, authStore.gistId, encrypted)
  } catch (error) {
    showToast('保存失败：' + error.message)
  }
}

function onSettingSelect(action) {
  if (action.value === 'manage_categories') {
    showCategoryManager.value = true
  } else if (action.value === 'export') {
    exportBackup()
  } else if (action.value === 'logout') {
    authStore.logout()
    router.push('/')
  }
}

async function handleAddCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  if (accountsStore.addCategory(name)) {
    newCategoryName.value = ''
    await saveData()
    showToast('添加成功')
  } else {
    showToast('分类已存在')
  }
}

async function handleDeleteCategory(name) {
  try {
    await showConfirmDialog({
      title: '删除分类',
      message: `确定要删除分类 "${name}" 吗？该分类下的账号将归入 "其他"。`,
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    if (accountsStore.deleteCategory(name)) {
      await saveData()
      showToast('删除成功')
    }
  } catch {
    //
  }
}

function exportBackup() {
  const data = JSON.stringify(accountsStore.exportData(), null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `passwords-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('备份已导出（未加密）')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-top: 46px;
  padding-bottom: 80px;
  position: relative;
  z-index: 1;
}

/* 导航栏毒砂玻璃 */
.home-page :deep(.van-nav-bar) {
  background: rgba(9, 9, 11, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
}

.home-page :deep(.van-nav-bar__title) {
  color: var(--text-primary);
  font-weight: 600;
  letter-spacing: 1px;
}

.home-page :deep(.van-nav-bar .van-icon) {
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.home-page :deep(.van-nav-bar .van-icon:active) {
  color: var(--primary);
}

.content {
  padding: 0 12px;
}

/* 搜索栏 */
.van-search :deep(.van-search__content) {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.van-search :deep(.van-search__content:focus-within) {
  border-color: var(--border-glow);
  box-shadow: var(--shadow-glow-sm);
}

.van-search :deep(.van-field__control) {
  color: var(--text-primary);
}

.van-search :deep(.van-field__control::placeholder) {
  color: var(--text-muted);
}

/* 分类标签 */
.category-tabs {
  margin: 12px 0;
}

.category-tabs :deep(.van-tabs__wrap) {
  background: transparent;
}

.category-tabs :deep(.van-tab) {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.category-tabs :deep(.van-tab--active) {
  color: var(--primary-light);
}

.category-tabs :deep(.van-tabs__line) {
  background: var(--gradient-primary);
  height: 3px;
  border-radius: 2px;
  bottom: 0;
}

/* 账号列表 */
.account-card {
  margin-bottom: 12px;
  border-radius: var(--radius-md);
  overflow: hidden;
  animation: fadeInUp 0.5s ease-out both;
}

.card-content {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}

/* 卡片顶部渐变装饰线 */
.card-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.3), transparent);
  opacity: 0;
  transition: var(--transition-normal);
}

.card-content:active {
  transform: scale(0.98);
  border-color: var(--border-glow);
  box-shadow: var(--shadow-glow-sm);
}

.card-content:active::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 46px;
  height: 46px;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(124, 58, 237, 0.08));
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.card-username {
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 4px;
  font-family: 'Inter', monospace;
}

/* 快捷操作按钮 */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.action-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 34px;
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: var(--radius-sm);
  background: rgba(167, 139, 250, 0.06);
  color: var(--primary-light);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
  padding: 0 6px;
}

.action-chip:active {
  background: rgba(167, 139, 250, 0.2);
  border-color: var(--border-glow);
  transform: scale(0.95);
}

.chip-icon {
  font-size: 12px;
}

.delete-btn {
  height: 100%;
}

/* 浮动按钮 */
:deep(.van-floating-bubble) {
  background: var(--gradient-primary) !important;
  box-shadow: 0 6px 25px rgba(124, 58, 237, 0.45);
}

/* 设置面板 */
:deep(.van-action-sheet) {
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}

:deep(.van-action-sheet__item) {
  color: var(--text-primary);
  background: transparent;
  font-weight: 500;
}

:deep(.van-action-sheet__cancel) {
  color: var(--text-secondary);
  background: transparent;
}

:deep(.van-action-sheet__header) {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 600;
}

:deep(.van-action-sheet__gap) {
  background: var(--border-subtle);
}

/* 分类管理弹窗 */
.manager-popup {
  padding: 24px 20px;
  background: rgba(20, 20, 30, 0.98);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.manager-header .van-icon {
  color: var(--text-muted);
}

.add-category {
  margin-bottom: 24px;
}

.add-category :deep(.van-cell) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.add-category :deep(.van-field__control) {
  color: var(--text-primary);
}

.category-list {
  max-height: 250px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.cat-name {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 空状态 */
:deep(.van-empty__description) {
  color: var(--text-muted);
}
</style>
