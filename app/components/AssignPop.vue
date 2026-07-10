<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";

const { config, send } = useBoard();

const props = defineProps<{
    variant: string;
}>();

const popoverOpen = ref(false);
const loading = ref(false);
const selectedMode = ref();
const selectedRoom = ref();

const modes = [
    { tool: "Walk In", slug: "walkin", icon: "user-plus" },
    { tool: "Fast Track", slug: "ft", icon: "bolt-lightning" },
    { tool: "Ambo", slug: "ambo", icon: "truck-medical" },
    { tool: "Police", slug: "police", icon: "shield" },
    { tool: "Helicopter", slug: "heli", icon: "helicopter" },
];

const isDisabled = computed<boolean>(
    () => selectedProvider.value === null || selectedSchedule.value === null,
);

function setMode(modeSlug) {
    selectedMode.value = modeSlug;
}

function clearSelections() {
    selectedMode.value = null;
    selectedRoom.value = null;
}

async function signIn() {
    if (!selectedProvider.value || !selectedSchedule.value) return;
    loading.value = true;
    await send({
        action: "signIn",
        payload: {
            provider: selectedProvider.value,
            schedule: selectedSchedule.value,
        },
    });
    loading.value = false;
    popoverOpen.value = false;
    clearSelections();
}
</script>

<template>
    <UPopover
        v-model:open="popoverOpen"
        @update:open="(open) => !open && clearSelections()"
    >
        <UButton
            v-if="variant !== 'shift'"
            color="neutral"
            title="Assign Patient"
            leading-icon="fa7-solid:user-plus"
            trailing-icon="fa7-solid:caret-down"
        >
            <span class="flex md:hidden"></span>
            <span class="hidden md:flex">Assign</span>
        </UButton>
        <UIcon
            v-if="variant === 'shift'"
            class="cursor-pointer size-5"
            name="fa7-solid:user-plus"
            title="Assign off rotation"
        />

        <template #content>
            <div class="flex flex-col gap-2 p-3 w-60">
                {{ selectedMode }} {{ selectedRoom }}
                <div v-if="variant === 'shift'" class="w-full">
                    <UAlert
                        color="info"
                        variant="subtle"
                        title="Assign Off Rotation"
                        description="Will not affect rotation"
                    />
                </div>
                <UFieldGroup class="flex">
                    <UButton
                        v-for="mode in modes"
                        color="neutral"
                        variant="outline"
                        size="lg"
                        :title="mode.tool"
                        class="grow flex justify-center"
                        :icon="`fa7-solid:${mode.icon}`"
                        @click="setMode(mode.slug)"
                    />
                </UFieldGroup>
                <USelect
                    placeholder="Room"
                    size="lg"
                    v-model="selectedRoom"
                    :items="config.rooms"
                />
                <UButton
                    color="neutral"
                    label="Assign"
                    size="lg"
                    class="justify-center"
                />
            </div>
        </template>
    </UPopover>
</template>
