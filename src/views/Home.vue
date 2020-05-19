<template>
  <div>
    <v-col cols="12" sm="6" md="3">
      <v-text-field
        placeholder="User's name"
        type="text"
        solo
        v-model="name"
        @keyup.enter="createUser()"
        :disabled="loadingCreate"
        hide-details
      >
        <template v-slot:append>
          <v-fade-transition leave-absolute>
            <v-progress-circular
              v-if="loadingCreate"
              size="24"
              width="3"
              indeterminate
            ></v-progress-circular>
            <v-icon v-else @click="createUser()">mdi-account-plus</v-icon>
          </v-fade-transition>
        </template>
      </v-text-field>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <transition-group name="list" tag="p">
        <div v-for="user in users" v-bind:key="user.id" class="list-user">
          <div v-if="selectedUpdate == user.id" style="display:inline-block">
            <v-text-field
              @keyup.enter="updateUser(user.id, user.name)"
              v-model.trim="user.name"
              style="display:inline-block"
              :readonly="loadingUpdate"
              autofocus
              type="text"
              hide-details
            ></v-text-field>
          </div>
          <div
            v-else
            @click="selectedUpdate = user.id"
            style="display:inline-block"
          >
            {{ user.name }} - {{ user.created_at.substring(0, 10) }}
          </div>
          <v-btn
            icon
            v-if="selectedUpdate == user.id"
            @click="updateUser(user.id, user.name)"
            class="ml-3"
            :disabled="loadingUpdate"
            :loading="loadingUpdate"
          >
            <v-icon color="grey">mdi-content-save</v-icon>
          </v-btn>
          <v-btn
            icon
            @click="deleteUser(user.id)"
            class="ml-3"
            :disabled="selectedDelete == user.id"
            :loading="selectedDelete == user.id"
          >
            <v-icon color="grey">mdi-delete</v-icon>
          </v-btn>
        </div>
      </transition-group>
      <v-progress-linear
        indeterminate
        v-if="users.length == 0"
      ></v-progress-linear>
    </v-col>
  </div>
</template>

<script>
import gql from "graphql-tag";

export default {
  name: "Home",
  data() {
    return {
      name: "",
      loadingCreate: false,
      loadingUpdate: false,
      selectedUpdate: null,
      selectedDelete: null,
      users: [],
    };
  },
  apollo: {
    users: gql`
      query {
        users(order_by: { created_at: desc }) {
          id
          name
          created_at
        }
      }
    `,
  },
  methods: {
    createUser() {
      if (this.loadingCreate || this.name == "") return;
      this.loadingCreate = true;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($name: String!) {
              insert_users(objects: [{ name: $name }]) {
                returning {
                  id
                  created_at
                }
              }
            }
          `,
          variables: {
            name: this.name,
          },
        })
        .then((payload) => {
          this.users.unshift({
            name: this.name,
            id: payload.data.insert_users.returning[0].id,
            created_at: payload.data.insert_users.returning[0].created_at,
          });
          this.loadingCreate = false;
          this.name = "";
          this.$store.commit("setSnackbar", {
            color: "success",
            timeout: 3000,
            text: "User has been created",
          });
        })
        .catch((err) => {
          this.loadingCreate = false;
          console.log(err);
        });
    },
    updateUser(id, name) {
      this.loadingUpdate = true;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($id: uuid!, $name: String!) {
              update_users(_set: { name: $name }, where: { id: { _eq: $id } }) {
                affected_rows
              }
            }
          `,
          variables: {
            id: id,
            name: name,
          },
        })
        .then((payload) => {
          this.loadingUpdate = false;
          this.selectedUpdate = null;

          this.$store.commit("setSnackbar", {
            color: "info",
            timeout: 3000,
            text: "User has been updated",
          });
        })
        .catch((err) => {
          this.loadingUpdate = false;
          this.selectedUpdate = null;

          console.log(err);
        });
    },
    deleteUser(id) {
      this.selectedDelete = id;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($id: uuid!) {
              delete_users(where: { id: { _eq: $id } }) {
                affected_rows
              }
            }
          `,
          variables: {
            id: id,
          },
        })
        .then((payload) => {
          this.users.splice(
            this.users.findIndex((a) => a.id === id),
            1
          );
          this.selectedDelete = null;
          this.$store.commit("setSnackbar", {
            color: "info",
            timeout: 3000,
            text: "User has been deleted",
          });
        })
        .catch((err) => {
          this.selectedDelete = null;
          console.log(err);
        });
    },
  },
};
</script>
<style>
.v-input {
  margin-top: 0px !important;
  padding-top: 0px !important;
}
.list-user {
  height: 40px;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.5s;
  height: 40px;
}
.list-enter,
.list-leave-to {
  opacity: 0;
  height: 0px;
  transform: translateY(-40px);
}
</style>
