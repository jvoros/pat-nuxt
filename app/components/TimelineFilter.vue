<script setup lang="ts">
import type { Shift } from "../../server/core/types";
const { board, getShiftName, getShiftsAlphabetically } = useBoard();
const props = defineProps<{
    filtered?: string;
}>();

const emit = defineEmits(["set-filter"]);

const providersMenu = computed(() => [
    [{ label: "Show Only:", type: "label" }],
    getShiftsAlphabetically().map((shiftId) => ({
        label: getShiftName(shiftId),
        onSelect: () => handleClick(shiftId),
    })),
]);

const clearMenu = [
    [
        {
            label: "Clear Filter",
            icon: "fa7-solid:close",
            onSelect: () => {
                handleClick("");
            },
        },
    ],
];

const menuItems = computed(() => {
    return props.filtered === "" ? providersMenu.value : clearMenu;
});

function handleClick(shiftId: Shift.id) {
    emit("set-filter", shiftId);
}
</script>
<template>
    <UDropdownMenu :items="menuItems">
        <UBadge
            color="neutral"
            :variant="filtered ? 'solid' : 'soft'"
            :label="filtered ? filtered : 'filter'"
            trailing-icon="mingcute:filter-2-fill"
            class="uppercase text-xs mb-1 cursor-pointer"
        />
    </UDropdownMenu>
</template>
