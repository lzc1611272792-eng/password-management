const GIST_FILENAME = 'password-manager-data.enc'
const GIST_DESCRIPTION = 'Password Manager Encrypted Data'

export async function validateToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    return response.ok
  } catch {
    return false
  }
}

export async function findGistId(token) {
  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) return null

    const gists = await response.json()
    const gist = gists.find(g =>
      g.description === GIST_DESCRIPTION &&
      g.files[GIST_FILENAME]
    )

    return gist ? gist.id : null
  } catch {
    return null
  }
}

export async function readGist(token, gistId) {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) throw new Error('读取Gist失败')

    const gist = await response.json()
    const file = gist.files[GIST_FILENAME]

    if (!file) throw new Error('Gist中找不到数据文件')

    return file.content
  } catch (error) {
    throw new Error('读取数据失败：' + error.message)
  }
}

export async function createGist(token, encryptedContent) {
  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: encryptedContent
          }
        }
      })
    })

    if (!response.ok) throw new Error('创建Gist失败')

    const gist = await response.json()
    return gist.id
  } catch (error) {
    throw new Error('创建数据存储失败：' + error.message)
  }
}

export async function updateGist(token, gistId, encryptedContent) {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: encryptedContent
          }
        }
      })
    })

    if (!response.ok) throw new Error('更新Gist失败')

    return true
  } catch (error) {
    throw new Error('保存数据失败：' + error.message)
  }
}
