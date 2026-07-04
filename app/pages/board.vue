<script setup lang="ts">
const { session, logout } = useAuth();
const slug = computed(() => session.value?.user?.slug);
const { board, config, connected } = useBoard();
</script>

<template>
    <div>
        <header>
            <h1>{{ slug }}</h1>
            <div>WS: {{ connected ? "Live" : "Connecting…" }}</div>
            <button @click="logout">Sign out</button>
        </header>
        <h2>Config</h2>
        <pre>{{ config }}</pre>
        <h2>Board</h2>
        <pre>{{ board }}</pre>
    </div>
</template>
