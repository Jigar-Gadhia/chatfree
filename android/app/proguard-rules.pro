# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ──────────────────────────────────────────────
# React Native core
# ──────────────────────────────────────────────
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# ──────────────────────────────────────────────
# llama.rn  ← CRITICAL: JNI bridge stripped by R8
# The native librnllama.so calls back into these
# Java/Kotlin classes; without this rule R8 renames
# them and the JNI lookup fails silently at runtime.
# ──────────────────────────────────────────────
-keep class com.rnllama.** { *; }
-keepclassmembers class com.rnllama.** { *; }
-dontwarn com.rnllama.**

# ──────────────────────────────────────────────
# expo-file-system (legacy + new API)
# createDownloadResumable is backed by these classes
# ──────────────────────────────────────────────
-keep class expo.modules.filesystem.** { *; }
-keepclassmembers class expo.modules.filesystem.** { *; }
-dontwarn expo.modules.filesystem.**

# ──────────────────────────────────────────────
# OkHttp3 + Okio  ← used internally by expo-file-system
# for all network downloads; R8 strips these in release
# ──────────────────────────────────────────────
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keepclassmembers class okhttp3.** { *; }
-dontwarn okhttp3.**

-keep class okio.** { *; }
-keep interface okio.** { *; }
-dontwarn okio.**

# ──────────────────────────────────────────────
# expo-secure-store  ← used to persist downloads + selected model
# ──────────────────────────────────────────────
-keep class expo.modules.securestore.** { *; }
-keepclassmembers class expo.modules.securestore.** { *; }
-dontwarn expo.modules.securestore.**

# ──────────────────────────────────────────────
# Expo Modules Core (underlying bridge for all Expo modules)
# ──────────────────────────────────────────────
-keep class expo.modules.core.** { *; }
-keep class expo.modules.kotlin.** { *; }
-dontwarn expo.modules.core.**
-dontwarn expo.modules.kotlin.**

# ──────────────────────────────────────────────
# PDFBox
# ──────────────────────────────────────────────
-keep class com.tom_roush.pdfbox.** { *; }
-dontwarn com.tom_roush.pdfbox.**
-dontwarn com.gemalto.jp2.**