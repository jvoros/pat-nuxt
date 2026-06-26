<script setup lang="ts">
const { session, clear: clearSession } = useUserSession();
const { board, connected } = useSocket();

async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    await clearSession();
    await navigateTo("/login");
}
</script>

<template>
    <div>
        <header>
            <span>{{ session?.slug }}</span>
            <span>{{ connected ? "Live" : "Connecting…" }}</span>
            <button @click="logout">Sign out</button>
        </header>
        <pre>{{ board }}</pre>
    </div>
</template>
