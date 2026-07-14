<script setup>
const { logout } = useAuth();
const hideSmall = "hidden md:flex";
</script>
<template>
    <UButton
        color="neutral"
        size="lg"
        variant="soft"
        label="Quick Reference"
        icon="fa7-solid:bookmark"
        :class="hideSmall"
    />

    <HeaderAddPop />

    <UTooltip text="Logout">
        <UButton
            color="neutral"
            variant="outline"
            size="lg"
            trailing-icon="fa7-solid:sign-out-alt"
            :class="hideSmall"
            @click="logout"
        />
    </UTooltip>

    <UTooltip text="Dark mode">
        <UColorModeButton variant="outline" :class="hideSmall" />
    </UTooltip>
</template>
