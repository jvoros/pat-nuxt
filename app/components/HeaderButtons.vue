<script setup>
const { logout } = useAuth();
const hideSmall = "hidden md:flex";
</script>
<template>
    <UButton color="neutral" size="lg" variant="ghost" :class="hideSmall">
        Quick Reference
    </UButton>

    <HeaderAddPop />

    <UTooltip text="Logout">
        <UButton
            color="neutral"
            variant="outline"
            size="lg"
            trailing-icon="lucide:log-out"
            :class="hideSmall"
            title="logout"
            @click="logout"
        />
    </UTooltip>

    <UTooltip text="Dark mode">
        <UColorModeButton variant="outline" :class="hideSmall" />
    </UTooltip>
</template>
