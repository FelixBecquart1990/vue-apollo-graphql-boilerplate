import Vue from "vue";
import Vuex from "vuex";
import User from "./modules/user.js";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    snackbar: { active: false, color: "", mode: "", timeout: 0, text: "" },
  },
  mutations: {
    setSnackbar(state, val) {
      state.snackbar = Object.assign({}, val, { active: true });
    },
  },
  actions: {},
  modules: {
    User,
  },
});
