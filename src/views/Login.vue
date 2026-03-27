<template>
  <div class="login-page">
    <!-- 装饰光球 -->
    <div class="login-orbs">
      <div class="login-orb login-orb-1"></div>
      <div class="login-orb login-orb-2"></div>
    </div>

    <div class="login-container">
      <div class="logo" >
        <div class="logo-glow"></div>
        <div class="logo-icon">🔐</div>
        <h1>密码管理器</h1>
        <p class="subtitle">安全存储 · 随时访问</p>
      </div>

      <div class="form-card glass">
        <van-form @submit="handleLogin" class="login-form">
          <van-cell-group inset>
            <van-field
              v-model="token"
              type="password"
              label="Token"
              placeholder="GitHub Personal Access Token"
              :rules="[{ required: true, message: '请输入Token' }]"
            />
            <van-field
              v-model="password"
              type="password"
              label="主密码"
              placeholder="输入主密码"
              :rules="[{ required: true, message: '请输入主密码' }]"
            />
          </van-cell-group>

          <div class="remember-row">
            <van-checkbox v-model="rememberMe" icon-size="16">
              记住登录信息
            </van-checkbox>
          </div>

          <div class="submit-btn">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              loading-text="验证中..."
            >
              {{ isNewUser ? '创建存储并登录' : '解锁' }}
            </van-button>
          </div>
        </van-form>
      </div>

      <div class="tips">
        <p>首次使用将自动创建私有Gist存储数据</p>
        <p>数据使用AES-256加密，仅存储密文</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useAuthStore } from '../stores/auth'
import { useAccountsStore } from '../stores/accounts'
import { validateToken, findGistId, readGist, createGist } from '../api/github'
import { encrypt, decrypt } from '../utils/crypto'

const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()

const token = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const isNewUser = ref(false)

onMounted(() => {
  authStore.loadFromStorage()
  if (authStore.token) {
    token.value = authStore.token
    password.value = authStore.masterPassword || ''
    rememberMe.value = true
  }
})

async function handleLogin() {
  loading.value = true
  const toast = showLoadingToast({
    message: '验证Token...',
    forbidClick: true,
    duration: 0
  })

  try {
    const isValid = await validateToken(token.value)
    if (!isValid) {
      closeToast()
      showToast('Token无效，请检查')
      loading.value = false
      return
    }

    toast.message = '查找数据...'
    const gistId = await findGistId(token.value)

    if (gistId) {
      toast.message = '解密数据...'
      const encryptedData = await readGist(token.value, gistId)
      const data = await decrypt(encryptedData, password.value)

      authStore.setToken(token.value)
      authStore.setMasterPassword(password.value)
      authStore.setGistId(gistId)
      accountsStore.setAccounts(data)
      isNewUser.value = false
    } else {
      isNewUser.value = true
      toast.message = '创建存储...'

      const initialData = {
        version: 1,
        categories: ['社交', '邮箱', '银行', '开发', '购物', '游戏', '其他'],
        accounts: []
      }

      const encryptedData = await encrypt(initialData, password.value)
      const newGistId = await createGist(token.value, encryptedData)

      authStore.setToken(token.value)
      authStore.setMasterPassword(password.value)
      authStore.setGistId(newGistId)
      accountsStore.setAccounts(initialData)
    }

    if (rememberMe.value) {
      authStore.saveToStorage()
    } else {
      // 如果不记住，清理掉之前的
      localStorage.removeItem('pm_token')
      localStorage.removeItem('pm_gist_id')
      localStorage.removeItem('pm_master_password')
      localStorage.removeItem('pm_password_saved_at')
    }

    closeToast()
    showToast({
      type: 'success',
      message: isNewUser.value ? '创建成功' : '解锁成功'
    })

    router.push('/home')
  } catch (error) {
    closeToast()
    showToast({
      type: 'fail',
      message: error.message || '登录失败'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;
}

/* 登录页专属装饰光球 */
.login-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.login-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.login-orb-1 {
  width: 350px;
  height: 350px;
  background: rgba(124, 58, 237, 0.2);
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  animation: breathe 6s ease-in-out infinite;
}

.login-orb-2 {
  width: 200px;
  height: 200px;
  background: rgba(245, 158, 11, 0.1);
  bottom: 15%;
  right: 10%;
  animation: breathe 8s ease-in-out infinite 2s;
}

.login-container {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

/* Logo 区域 */
.logo {
  text-align: center;
  margin-bottom: 36px;
  position: relative;
}

.logo-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(20px);
  animation: breathe 4s ease-in-out infinite;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
  animation: float 5s ease-in-out infinite;
  filter: drop-shadow(0 0 25px rgba(167, 139, 250, 0.5));
}

.logo h1 {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 3px;
  background: linear-gradient(135deg, #fff 30%, var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 8px;
  font-weight: 300;
  letter-spacing: 4px;
}

/* 表单卡片 */
.form-card {
  border-radius: var(--radius-lg);
  padding: 24px 4px;
  box-shadow: var(--shadow-card), var(--shadow-glow-sm);
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
  opacity: 0.6;
}

.login-form :deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
}

.login-form :deep(.van-cell) {
  background: transparent;
  color: var(--text-primary);
  padding: 14px 16px;
}

.login-form :deep(.van-cell::after) {
  border-color: var(--border-subtle);
}

.login-form :deep(.van-field__label) {
  color: var(--text-secondary);
  width: 60px;
  font-weight: 500;
}

.login-form :deep(.van-field__control) {
  color: var(--text-primary);
}

.login-form :deep(.van-field__control::placeholder) {
  color: var(--text-muted);
}

.remember-row {
  margin: 16px 16px 0;
}

.remember-row :deep(.van-checkbox__label) {
  color: var(--text-secondary);
  font-size: 13px;
}

.remember-row :deep(.van-checkbox__icon--checked .van-icon) {
  background-color: var(--primary);
  border-color: var(--primary);
}

.submit-btn {
  margin-top: 24px;
  padding: 0 16px;
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

.tips {
  margin-top: 36px;
  text-align: center;
}

.tips p {
  color: var(--text-muted);
  font-size: 12px;
  margin: 6px 0;
  font-weight: 300;
  letter-spacing: 0.5px;
}
</style>
