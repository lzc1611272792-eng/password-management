<template>
  <div class="login-page">
    <div class="login-container">
      <div class="logo">
        <div class="logo-icon">🔐</div>
        <h1>密码管理器</h1>
        <p class="subtitle">安全存储 · 随时访问</p>
      </div>

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
          <van-checkbox v-model="rememberToken" icon-size="16">
            记住Token
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
const rememberToken = ref(false)
const loading = ref(false)
const isNewUser = ref(false)

onMounted(() => {
  authStore.loadFromStorage()
  if (authStore.token) {
    token.value = authStore.token
    rememberToken.value = true
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

    if (rememberToken.value) {
      authStore.saveTokenToStorage()
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
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a2a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 40px 20px;
}

.logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.5));
}

.logo h1 {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 2px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 8px;
}

.login-form :deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.login-form :deep(.van-cell) {
  background: transparent;
  color: #fff;
}

.login-form :deep(.van-field__label) {
  color: rgba(255, 255, 255, 0.8);
  width: 60px;
}

.login-form :deep(.van-field__control) {
  color: #fff;
}

.login-form :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.remember-row {
  margin: 16px 0;
  padding: 0 16px;
}

.remember-row :deep(.van-checkbox__label) {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.submit-btn {
  margin-top: 24px;
  padding: 0 16px;
}

.submit-btn :deep(.van-button--primary) {
  background: linear-gradient(90deg, #00d4ff, #0099cc);
  border: none;
  height: 48px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
}

.tips {
  margin-top: 40px;
  text-align: center;
}

.tips p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  margin: 4px 0;
}
</style>
