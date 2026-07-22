<script setup lang="ts">
const { board } = useBoard();
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

        <template #right>
            <HeaderButtons />
        </template>
    </UHeader>
</template>
