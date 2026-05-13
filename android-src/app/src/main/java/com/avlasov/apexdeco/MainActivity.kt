package com.avlasov.apexdeco

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.ActivityNotFoundException
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var container: FrameLayout
    private lateinit var insetsController: WindowInsetsControllerCompat

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_ApexDeco)
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        insetsController = WindowInsetsControllerCompat(window, window.decorView)
        // ApexDeco web UI uses a light background; match status/navigation icons.
        insetsController.isAppearanceLightStatusBars = true
        insetsController.isAppearanceLightNavigationBars = true

        setContentView(R.layout.activity_main)

        container = findViewById(R.id.container)
        webView = findViewById(R.id.webView)

        ViewCompat.setOnApplyWindowInsetsListener(container) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            WindowInsetsCompat.CONSUMED
        }

        val lightColor = Color.parseColor("#f5f5f5")
        container.setBackgroundColor(lightColor)

        webView.apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            setBackgroundColor(lightColor)

            addJavascriptInterface(NativeBridge(), "Android")

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val uri = request?.url ?: return false
                    val url = uri.toString()
                    val scheme = uri.scheme?.lowercase() ?: return false
                    // Keep in-app navigation (tests.html, same-origin links) inside WebView.
                    if (url.startsWith("file:///android_asset/") ||
                        url.startsWith("about:") ||
                        url.startsWith("javascript:")) {
                        return false
                    }
                    if (scheme == "mailto") {
                        return launchExternal(Intent(Intent.ACTION_SENDTO, uri))
                    }
                    if (scheme == "tel") {
                        return launchExternal(Intent(Intent.ACTION_DIAL, uri))
                    }
                    if (scheme == "http" || scheme == "https") {
                        return launchExternal(Intent(Intent.ACTION_VIEW, uri))
                    }
                    return false
                }
            }
            loadUrl("file:///android_asset/index.html")
        }
    }

    private fun launchExternal(intent: Intent): Boolean {
        return try {
            startActivity(intent)
            true
        } catch (_: ActivityNotFoundException) {
            false
        }
    }

    inner class NativeBridge {
        @JavascriptInterface
        fun haptic() {
            val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                val vm = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(VIBRATOR_SERVICE) as Vibrator
            }
            vibrator.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE))
        }

        @JavascriptInterface
        fun getClipboardText(): String {
            return try {
                val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                val clip = clipboard.primaryClip ?: return ""
                if (clip.itemCount == 0) return ""
                clip.getItemAt(0).coerceToText(this@MainActivity)?.toString() ?: ""
            } catch (e: Exception) {
                ""
            }
        }

        @JavascriptInterface
        fun setClipboardText(text: String): Boolean {
            return try {
                runOnUiThread {
                    val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("ApexDeco", text))
                }
                true
            } catch (e: Exception) {
                false
            }
        }

        @JavascriptInterface
        fun onThemeChanged(isDark: Boolean) {
            runOnUiThread {
                if (isDark) {
                    val darkColor = Color.parseColor("#1e1e1f")
                    insetsController.isAppearanceLightStatusBars = false
                    insetsController.isAppearanceLightNavigationBars = false
                    webView.setBackgroundColor(darkColor)
                    container.setBackgroundColor(darkColor)
                } else {
                    val lightColor = Color.parseColor("#f5f5f5")
                    insetsController.isAppearanceLightStatusBars = true
                    insetsController.isAppearanceLightNavigationBars = true
                    webView.setBackgroundColor(lightColor)
                    container.setBackgroundColor(lightColor)
                }
            }
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        webView.post {
            webView.requestLayout()
            webView.evaluateJavascript(
                "document.body.style.display='none';" +
                "document.body.offsetHeight;" +
                "document.body.style.display='';",
                null
            )
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
