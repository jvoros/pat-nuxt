<script setup lang="ts">
const { board } = useBoard();

const formattedDate = computed(() => {
    if (!board.value?.date) return "";

    // 1. Convert to milliseconds if your prop is in seconds
    // Standard Unix is in seconds, but JS Date expects milliseconds.
    // If your API already sends milliseconds, remove the "* 1000".
    const date = new Date(Number(board.value.date));

    // 2. Format it using the browser's built-in Intl API (no heavy libraries needed!)
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    }).format(date);
});

const date = computed(() => {
    return parseInt(board.value?.date);
});
</script>
<template>
    <UHeader
        title="Patient Assignment Tool"
        class="border-0 mb-2 md:mb-10"
        :toggle="{ class: 'hidden' }"
    >
        <template #title>
            <HeaderLogo />
        </template>
        <UBadge class="hidden md:flex" color="neutral" variant="soft" size="xl">
            Board for {{ formattedDate }}
        </UBadge>

        <template #right>
            <HeaderButtons />
        </template>
    </UHeader>
</template>
