<script setup lang="ts">
const { board } = useBoard();

const formattedDate = computed(() => {
    if (!board.value?.date) return "";
    const date = new Date(Number(board.value.date));
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    }).format(date);
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
        <UBadge
            class="hidden md:block"
            color="neutral"
            variant="soft"
            size="xl"
        >
            Board for {{ formattedDate }}
        </UBadge>

        <template #right>
            <HeaderButtons />
        </template>
    </UHeader>
</template>
