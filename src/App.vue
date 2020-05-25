<template>
  <v-app>
    <router-view></router-view>
    <snackbar />
  </v-app>
</template>

<script>
import Snackbar from "./components/Snackbar";

export default {
  name: "App",

  components: {
    Snackbar,
  },

  data: () => ({
    //
  }),
};
</script>
