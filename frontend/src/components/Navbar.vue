<template>
    <div class="title">
        Talking Avatar
    </div>
    <nav class="navbar">
        <!-- <div class="items-container">
            <p>item 1</p>
            <p>item 2</p>
            <p>item 3</p>
        </div> -->

        <div class="theme-button">
            <ThemeSwitcher />
        </div>
    </nav>
</template>

<script>
import ThemeSwitcher from './ThemeSwitcher.vue';

export default {
    name: 'Navbar',
    components: {
        ThemeSwitcher,
    }
}
</script>

<style scoped>
.navbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 1rem;
    background-color: inherit;
}

.items-container {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-left: 30px;
}

.title {
    font-size: 42px;
    font-weight: bold;
    text-align:center;
    padding-top: 15px;
    color: inherit;
}

.theme-button {
    padding-right: 35px;
}
</style>