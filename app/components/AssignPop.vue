<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
import { modes } from "../utils/modes";

const { config, send } = useBoard();

const props = defineProps<{
    shiftId: string;
    variant?: string;
    zoneSlug?: string;
}>();

const popoverOpen = ref(false);
const loading = ref(false);

const selectedMode = ref(null);
const selectedRoom = ref(null);

const isDisabled = computed<boolean>(
    () => selectedMode.value === null || selectedRoom.value === null,
);

function setMode(modeSlug) {
    selectedMode.value = modeSlug;
}

function clearSelections() {
    selectedMode.value = null;
    selectedRoom.value = null;
}

async function assign() {
    if (isDisabled.value) return;
    const action = props.variant === "shift" ? "assignToShift" : "assignToZone";
    loading.value = true;

    await send({
        action,
        payload: {
            shiftId: props.shiftId,
            zoneSlug: props.zoneSlug,
            mode: selectedMode.value,
            room: selectedRoom.value,
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
        <slot />

        <template #content>
            <div class="w-60">
                <div class="font-bold text-sm p-2">
                    <span v-if="variant === 'shift'">Assign Off Rotation</span>
                    <span v-else>Assign Patient</span>
                </div>
                <USeparator />
                <div class="flex flex-col gap-2 p-3">
                    <div v-if="variant === 'shift'" class="w-full">
                        <UAlert
                            color="warning"
                            variant="subtle"
                            description="Will not affect rotation"
                        />
                    </div>
                    <UFieldGroup class="flex">
                        <UButton
                            v-for="mode in modes"
                            color="neutral"
                            :variant="
                                selectedMode === mode.slug ? 'solid' : 'outline'
                            "
                            size="lg"
                            :title="mode.tool"
                            class="grow flex justify-center"
                            :icon="mode.icon"
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
                        :disabled="isDisabled"
                        :loading="loading"
                        @click="assign"
                    />
                </div>
            </div>
        </template>
    </UPopover>
</template>
