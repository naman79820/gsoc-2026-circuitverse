/**
 * useTauriAuth — handles authentication for the Tauri desktop app.
 * 
 * Flow:
 * 1. User clicks Login → opens browser to circuitverse.org/users/sign_in?tauri=1
 * 2. User logs in via normal Rails/Devise flow
 * 3. Rails redirects to circuitverse://auth?token=JWT_TOKEN
 * 4. OS routes the deep link to the Tauri app
 * 5. Tauri emits 'tauri://cv-auth-token' event with the token
 * 6. We verify the token via /api/v1/me and populate authStore
 */
import { ref } from 'vue'
import { useAuthStore } from '#/store/authStore'

// True when running inside the Tauri desktop app
export const isTauri = () => '__TAURI_INTERNALS__' in window

const TOKEN_STORAGE_KEY = 'cv_tauri_jwt'

export function useTauriAuth() {
  const authStore = useAuthStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Opens the browser login page and listens for the token callback.
   * The deep link brings the token back to lib.rs which emits 'tauri://cv-auth-token'.
   */
  async function startLogin() {
    if (!isTauri()) {
      console.warn('[useTauriAuth] Not running in Tauri, skipping')
      return
    }

    error.value = null

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const { listen } = await import('@tauri-apps/api/event')

      // Open browser to login page
      await invoke('open_login_browser')

      // Listen for the token that comes back via deep link → lib.rs → emit
      const unlisten = await listen<string>('tauri://cv-auth-token', async (event) => {
        unlisten() // one-shot listener
        await handleToken(event.payload)
      })
    } catch (e) {
      error.value = `Login failed: ${e}`
    }
  }

  /**
   * Verifies the token against the API and populates the auth store.
   */
  async function handleToken(token: string) {
    isLoading.value = true
    error.value = null

    try {
      const { invoke } = await import('@tauri-apps/api/core')

      // Verify token is valid and get user info
      const userData = await invoke<{ data: any }>('verify_cv_token', { token })

      // Persist for next app launch
      localStorage.setItem(TOKEN_STORAGE_KEY, token)

      // Populate auth store — same setUserInfo used by web session
      authStore.setUserInfo(userData.data)
      // Also set JWT so save.js getToken() works via authStore
      authStore.setToken(token)

      ;(window as any).isUserLoggedIn = true
    } catch (e) {
      error.value = `Token verification failed: ${e}`
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * On app launch, try to restore a previously saved session.
   * Called from simulatorHandler.vue onBeforeMount.
   */
  async function restoreSession() {
    if (!isTauri()) return

    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!stored) return

    await handleToken(stored)
  }

  function signOut() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    authStore.signOut()
    ;(window as any).isUserLoggedIn = false
  }

  return {
    startLogin,
    restoreSession,
    signOut,
    isLoading,
    error,
    isTauri,
  }
}
