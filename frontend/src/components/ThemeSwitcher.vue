<!-- ThemeSwitcher.vue -->
<template>
    <div
      class="theme-switcher"
      @click="toggleTheme"
      :aria-label="`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`"
      role="button"
      tabindex="0"
      @keydown.enter="toggleTheme"
      @keydown.space.prevent="toggleTheme"
    >
      <div :class="['toggle', currentTheme]">
        <span v-if="currentTheme === 'light'">
          <!-- Moon Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
          </svg>
        </span>
        <span v-else>
          <!-- Sun Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 4.5V2m0 20v-2.5m5.66-15.16l1.77-1.77m-14.14 0l1.77 1.77M22 12h-2.5M4.5 12H2m15.16 5.66l1.77 1.77m-14.14 0l1.77-1.77M12 7a5 5 0 100 10 5 5 0 000-10z"
            />
          </svg>
        </span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ThemeSwitcher',
    data() {
      return {
        currentTheme: 'light',
      };
    },
    mounted() {
      // Check for saved theme in localStorage
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.currentTheme = savedTheme;
      }
      this.applyTheme();
    },
    methods: {
      toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
      },
      applyTheme() {
        const app = document.getElementById('app');
        if (this.currentTheme === 'light') {
          app.classList.add('light-mode');
          app.classList.remove('dark-mode');
        } else {
          app.classList.add('dark-mode');
          app.classList.remove('light-mode');
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .theme-switcher {
    cursor: pointer;
    width: 60px;
    height: 30px;
    background-color: #ccc;
    border-radius: 15px;
    position: relative;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
    padding: 0 5px;
  }
  
  .toggle {
    width: 26px;
    height: 26px;
    background-color: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease, background-color 0.3s ease;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }
  
  .toggle.dark {
    transform: translateX(30px);
  }
  
  .icon {
    width: 16px;
    height: 16px;
    color: #f1c40f; /* Sun color */
  }
  
  .toggle.dark .icon {
    color: #f39c12; /* Moon color */
  }
  
  /* Optional: Change background color based on theme */
  .theme-switcher.light {
    background-color: #ccc;
  }
  
  .theme-switcher.dark {
    background-color: #555;
  }
  </style>
  