<template>
  <div class="home-page">
    <van-nav-bar title="密码管理器" fixed>
      <template #right>
        <van-icon name="setting-o" size="20" @click="showSettings = true" />
      </template>
    </van-nav-bar>

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
          v-for="account in accountsStore.filteredAccounts"
          :key="account.id"
          class="account-card"
        >
          <div class="card-content" @click="goEdit(account.id)">
            <div class="card-header">
              <div class="card-icon">{{ getCategoryIcon(account.category) }}</div>
              <div class="card-info">
                <div class="card-name">{{ account.name }}</div>
                <div class="card-username">{{ maskUsername(account.username) }}</div>
              </div>
              <van-icon name="arrow" color="rgba(255,255,255,0.3)" />
            </div>
            <div class="card-actions">
              <van-button
                size="small"
                type="primary"
                plain
                @click.stop="copyText(account.username, '用户名')"
              >
                用户名
              </van-button>
              <van-button
                size="small"
                type="primary"
                plain
                @click.stop="copyText(account.password, '密码')"
              >
                密码
              </van-button>
              <van-button
                v-if="account.url"
                size="small"
                type="primary"
                plain
                @click.stop="openUrl(account.url)"
              >
                访问
              </van-button>
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

    <van-floating-bubble
      axis="xy"
      icon="plus"
      magnetic="x"
      @click="goAdd"
    />

    <van-action-sheet
      v-model:show="showSettings"
      title="设置"
      :actions="settingsActions"
      @select="onSettingSelect"
      cancel-text="取消"
    />
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

const settingsActions = [
  { name: '导出备份文件', value: 'export' },
  { name: '退出登录', value: 'logout', color: '#ee0a24' }
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
  if (action.value === 'export') {
    exportBackup()
  } else if (action.value === 'logout') {
    authStore.logout()
    router.push('/')
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
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%);
  padding-top: 46px;
  padding-bottom: 80px;
}

.home-page :deep(.van-nav-bar) {
  background: rgba(10, 10, 26, 0.9);
  backdrop-filter: blur(10px);
}

.home-page :deep(.van-nav-bar__title) {
  color: #fff;
}

.content {
  padding: 0 12px;
}

.van-search :deep(.van-search__content) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.van-search :deep(.van-field__control) {
  color: #fff;
}

.van-search :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.category-tabs {
  margin: 12px 0;
}

.category-tabs :deep(.van-tabs__wrap) {
  background: transparent;
}

.category-tabs :deep(.van-tab) {
  color: rgba(255, 255, 255, 0.6);
}

.category-tabs :deep(.van-tab--active) {
  color: #00d4ff;
}

.category-tabs :deep(.van-tabs__line) {
  background: #00d4ff;
}

.account-card {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.card-content {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.card-content:hover {
  border-color: rgba(0, 212, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 44px;
  height: 44px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.card-info {
  flex: 1;
}

.card-name {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.card-username {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-top: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.card-actions :deep(.van-button) {
  flex: 1;
  height: 32px;
  font-size: 12px;
  border-color: rgba(0, 212, 255, 0.4);
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.delete-btn {
  height: 100%;
}

:deep(.van-floating-bubble) {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
}

:deep(.van-action-sheet) {
  background: #1a1a3a;
}

:deep(.van-action-sheet__item) {
  color: #fff;
  background: transparent;
}

:deep(.van-action-sheet__cancel) {
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
}

:deep(.van-action-sheet__header) {
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
