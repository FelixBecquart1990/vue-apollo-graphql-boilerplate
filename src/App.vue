<template>
  <v-app>
    <router-view></router-view>
    <snackbar />
  </v-app>
</template>

<script>
import HelloWorld from "./components/HelloWorld";
import Snackbar from "./components/Snackbar";

export default {
  name: "App",

  components: {
    Snackbar,
    HelloWorld
  },

  data: () => ({
    //
  })
};
</script>
