<script setup lang="ts">
const { logout } = useAuth();
const { board, config } = useBoard();
</script>

<template>
    <AppHeader />
    <UMain>
        <UContainer>
            <template v-if="board">
                <main class="grid grid-cols-1 md:grid-cols-11 md:gap-8">
                    <section class="order-1 md:order-2 md:col-span-4">
                        <SectionRotation :zoneSlug="board.zoneOrder[0]" />
                    </section>
                    <section class="order-2 md:order-3 md:col-span-4">
                        <SectionRotation
                            v-for="zoneSlug in board.zoneOrder.slice(1)"
                            :zoneSlug="zoneSlug"
                        />
                    </section>
                    <section class="order-3 md:order-1 md:col-span-3 h-full">
                        <Timeline :timeline="board?.timeline" />
                    </section>
                </main>
            </template>
        </UContainer>
    </UMain>
    <AppFooter />
</template>
