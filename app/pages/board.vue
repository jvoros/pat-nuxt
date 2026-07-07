<script setup lang="ts">
const { session, logout } = useAuth();
const slug = computed(() => session.value?.user?.slug);
const { board, config, connected } = useBoard();
</script>

<template>
    <AppHeader />
    <UMain>
        <UContainer>
            <div v-if="board" class="grid grid-cols-1 md:grid-cols-12 md:gap-8">
                <section class="order-1 md:order-2 md:col-span-5">
                    <SectionRotation :zone="board.zones.main" />
                </section>
                <section class="order-2 md:order-3 md:col-span-3">
                    <template v-for="zoneSlug in board.zoneOrder">
                        <SectionRotation
                            v-if="zoneSlug !== 'main'"
                            :zone="board.zones[zoneSlug]"
                        />
                    </template>
                </section>
                <section class="order-3 md:order-1 md:col-span-4">
                    <SectionHeader title="Timeline" />
                    <div class="mb-4"></div>
                </section>
            </div>
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
