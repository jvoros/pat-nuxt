<script setup lang="ts">
const { board, getShiftName, getShiftsAlphabetically } = useBoard();
const props = defineProps<{
    setFilter?: fn;
    filteredId?: string;
}>();

const providersMenu = [
    [{ label: "Show Only:", type: "label" }],
    getShiftsAlphabetically().map((shiftId) => ({
        label: getShiftName(shiftId),
        onSelect: () => props.setFilter(shiftId),
    })),
];

const clearMenu = [
    [
        {
            label: "Clear Filter",
            icon: "fa7-solid:close",
            onSelect: () => {
                props.setFilter("");
            },
        },
    ],
];

const menuItems = computed(() => {
    return props.filteredId === "" ? providersMenu : clearMenu;
});
</script>
<template>
    <UDropdownMenu :items="menuItems">
        <UBadge
            color="neutral"
            variant="soft"
            :label="filteredId ? getShiftName(filteredId) : 'filter'"
            trailing-icon="mingcute:filter-2-fill"
            class="uppercase text-xs mb-1 cursor-pointer"
        />
    </UDropdownMenu>
</template>
