<!-- App.vue -->
<template>
  <div id="app" :class="currentTheme">
    <header>
      <Navbar />
    </header>
    <main>
      <Avatar />
    </main>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import Avatar from './components/Avatar.vue';


export default {
  name: 'App',
  components: {
    Navbar,
    Avatar
  },
  data() {
    return {
      currentTheme: 'light',
    };
  },
};
</script>

<!-- <style>
/* Your existing styles, including the ones you provided */
.light-mode {
  background-color: #ffffff;
  color: #000000;
}

.dark-mode {
  background-color: #000000;
  color: #ffffff;
}

#app {
  transition: background-color 0.3s ease, color 0.3s ease;
  min-height: 100vh;
}
</style> -->
