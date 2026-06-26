<script setup lang="ts">
const { fetch: refreshSession } = useUserSession();

const slug = ref("");
const code = ref("");
const error = ref("");
const loading = ref(false);

async function login() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { slug: slug.value, code: code.value },
    });
    await refreshSession();
    await navigateTo("/board");
  } catch {
    error.value = "Invalid site or access code.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1>Sign In</h1>
    <form @submit.prevent="login">
      <input
        v-model="slug"
        type="text"
        placeholder="Site"
        autocomplete="off"
        required
      />
      <input
        v-model="code"
        type="password"
        placeholder="Access code"
        required
      />
      <p v-if="error">{{ error }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? "Signing in…" : "Sign in" }}
      </button>
    </form>
  </div>
</template>
