<template>
  <div>
    <v-col cols="12" sm="6" md="3">
      <v-text-field
        label="Solo"
        placeholder="User's name"
        solo
        v-model="name"
        @keyup.enter="createUser()"
        :disabled="loadingCreate"
        hide-details
      >
        <template v-slot:append>
          <v-progress-circular v-if="loadingCreate" size="24" width="3" indeterminate></v-progress-circular>
          <v-icon v-else>mdi-account-plus</v-icon>
        </template>
      </v-text-field>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <div v-if="users">
        <div v-for="(user, index) in users" :key="index">
          <div v-if="selectedUpdate == user.id" style="display:inline-block">
            <v-text-field v-model="user.name" style="display:inline-block"></v-text-field>
          </div>
          <div v-else @click="selectedUpdate = user.id" style="display:inline-block">{{user.name}}</div>
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
      </div>
      <v-progress-linear indeterminate v-else></v-progress-linear>
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
      selectedDelete: null
    };
  },
  apollo: {
    users: gql`
      query {
        users {
          id
          name
          created_at
        }
      }
    `
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
                }
              }
            }
          `,
          variables: {
            name: this.name
          }
        })
        .then(payload => {
          this.users.push({
            name: this.name,
            id: payload.data.insert_users.returning[0].id
          });
          this.loadingCreate = false;
          this.name = "";
          this.$store.commit("setSnackbar", {
            color: "success",
            timeout: 3000,
            text: "User has been created"
          });
        })
        .catch(err => {
          this.loadingCreate = false;
          console.log(err);
        });
    },
    updateUser(id, name) {
      this.loadingUpdate = true;
      this.selectedUpdate = null;
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
            name: name
          }
        })
        .then(payload => {
          this.loadingUpdate = false;
          this.$store.commit("setSnackbar", {
            color: "success",
            timeout: 3000,
            text: "User has been updated"
          });
        })
        .catch(err => {
          this.loadingUpdate = false;
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
            id: id
          }
        })
        .then(payload => {
          this.users.splice(
            this.users.findIndex(a => a.id === id),
            1
          );
          this.selectedDelete = null;
          this.$store.commit("setSnackbar", {
            color: "success",
            timeout: 3000,
            text: "User has been deleted"
          });
        })
        .catch(err => {
          this.selectedDelete = null;
          console.log(err);
        });
    }
  }
};
</script>

