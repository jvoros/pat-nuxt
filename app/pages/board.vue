<script setup lang="ts">
const { session, logout } = useAuth();
const slug = computed(() => session.value?.user?.slug);
const { board, config, connected } = useBoard();
</script>

<template>
    <AppHeader />
    <UMain>
        <UContainer>
            <div class="grid grid-cols-1 border border-red-200">container</div>
        </UContainer>
        <UCollapsible>
            <UButton variant="subtle">Config JSON</UButton>
            <template #content>
                <pre>{{ config }}</pre>
            </template>
        </UCollapsible>
        <UCollapsible>
            <UButton variant="subtle">Board JSON</UButton>
            <template #content>
                <pre>{{ board }}</pre>
            </template>
        </UCollapsible>
    </UMain>
    <UFooter>
        <template #left>
            <div><b>slug:</b> {{ slug }}</div>

            <div>
                <b>websocket: </b> {{ connected ? "Live" : "Connecting…" }}
            </div>
        </template>
    </UFooter>
</template>
