<template>
  <v-container>
    <v-row no-gutters class="ma-3 mt-5" justify="center">
      <v-col cols="12" lg="7">
        <v-text-field
          placeholder="Ajouter une question"
          type="text"
          solo
          v-model="content"
          @keyup.enter="createQuestion()"
          :disabled="loadingCreate"
          hide-details
        >
          <template v-slot:append>
            <v-fade-transition leave-absolute>
              <v-progress-circular v-if="loadingCreate" size="24" width="3" indeterminate></v-progress-circular>
              <v-icon v-else @click="createQuestion()">mdi-comment-plus</v-icon>
            </v-fade-transition>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="12" lg="7">
        <transition-group name="list" tag="p">
          <div v-for="question in questions" v-bind:key="question.id" class="list-question">
            <v-row no-gutters>
              <v-col>
                <sparkline :votes="question.votes" />
              </v-col>
              <v-col cols="auto" class="d-flex flex-column justify-center">
                <v-btn
                  icon
                  @click="vote(question, true)"
                  class="ml-3"
                  :disabled="selectedVote == question.id + true"
                  :loading="selectedVote == question.id + true"
                  large
                >
                  <v-icon color="blue">mdi-arrow-up-bold</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="vote(question, false)"
                  class="ml-3"
                  :disabled="selectedVote == question.id + false"
                  :loading="selectedVote == question.id + false"
                  large
                >
                  <v-icon color="red">mdi-arrow-down-bold</v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <div v-if="selectedUpdate == question.id" style="display:inline-block">
              <v-text-field
                @keyup.enter="updateQuestion(question.id, question.content)"
                v-model.trim="question.content"
                style="display:inline-block"
                :readonly="loadingUpdate"
                autofocus
                type="text"
                hide-details
                class="display-1"
              ></v-text-field>
            </div>

            <div
              v-else
              @click="selectedUpdate = question.id"
              style="display:inline-block"
              class="display-1"
            >{{ question.content }}</div>
            <v-btn
              icon
              v-if="selectedUpdate == question.id"
              @click="updateQuestion(question.id, question.content)"
              class="ml-3"
              :disabled="loadingUpdate"
              :loading="loadingUpdate"
            >
              <v-icon color="grey">mdi-content-save</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="deleteQuestion(question.id)"
              v-if="
                !(selectedUpdate == question.id) && question.votes.length == 0
              "
              class="ml-3"
              :disabled="selectedDelete == question.id"
              :loading="selectedDelete == question.id"
            >
              <v-icon color="grey">mdi-delete</v-icon>
            </v-btn>
          </div>
        </transition-group>
        <v-progress-linear indeterminate v-if="questions.length == 0"></v-progress-linear>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import gql from "graphql-tag";
import Sparkline from "../components/Sparkline";

export default {
  name: "Home",
  components: {
    Sparkline
  },
  data() {
    return {
      content: "",
      loadingCreate: false,
      loadingUpdate: false,
      selectedUpdate: null,
      selectedDelete: null,
      selectedVote: null,
      questions: []
    };
  },
  apollo: {
    questions: gql`
      query {
        questions(limit: 20, order_by: { created_at: desc }) {
          votes(limit: 20, order_by: { created_at: desc }) {
            content
            created_at
          }
          content
          id
        }
      }
    `
  },
  methods: {
    vote(question, content) {
      this.selectedVote = question.id + content;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($content: Boolean!, $question_id: uuid!, $user_id: uuid!) {
              insert_votes(
                objects: [
                  {
                    content: $content
                    question_id: $question_id
                    user_id: $user_id
                  }
                ]
              ) {
                returning {
                  id
                  created_at
                }
              }
            }
          `,
          variables: {
            content: content,
            question_id: question.id,
            user_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
          }
        })
        .then(payload => {
          this.selectedVote = null;
          question.votes.unshift({
            content: content,
            id: payload.data.insert_votes.returning[0].id,
            created_at: payload.data.insert_votes.returning[0].created_at
          });
          this.$store.commit("setSnackbar", {
            color: "success",
            timeout: 3000,
            text: "Voted!"
          });
        })
        .catch(err => {
          this.selectedVote = null;
          console.log(err);
        });
    },
    createQuestion() {
      if (this.loadingCreate || this.content == "") return;
      this.loadingCreate = true;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($content: String!, $user_id: uuid!) {
              insert_questions(
                objects: [{ content: $content, user_id: $user_id }]
              ) {
                returning {
                  id
                  created_at
                }
              }
            }
          `,
          variables: {
            content: this.content,
            user_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
          }
        })
        .then(payload => {
          this.questions.unshift({
            content: this.content,
            id: payload.data.insert_questions.returning[0].id,
            created_at: payload.data.insert_questions.returning[0].created_at,
            votes: []
          });
          this.loadingCreate = false;
          this.content = "";
          this.$store.commit("setSnackbar", {
            color: "success",
            timeout: 3000,
            text: "Question has been created"
          });
        })
        .catch(err => {
          this.loadingCreate = false;
          console.log(err);
        });
    },
    updateQuestion(id, content) {
      if (content == "") return;

      this.loadingUpdate = true;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($id: uuid!, $content: String!) {
              update_questions(
                _set: { content: $content }
                where: { id: { _eq: $id } }
              ) {
                affected_rows
              }
            }
          `,
          variables: {
            id: id,
            content: content
          }
        })
        .then(payload => {
          this.loadingUpdate = false;
          this.selectedUpdate = null;

          this.$store.commit("setSnackbar", {
            color: "info",
            timeout: 3000,
            text: "Question has been updated"
          });
        })
        .catch(err => {
          this.loadingUpdate = false;
          this.selectedUpdate = null;

          console.log(err);
        });
    },
    deleteQuestion(id) {
      this.selectedDelete = id;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($id: uuid!) {
              delete_questions(where: { id: { _eq: $id } }) {
                affected_rows
              }
            }
          `,
          variables: {
            id: id
          }
        })
        .then(payload => {
          this.questions.splice(
            this.questions.findIndex(a => a.id === id),
            1
          );
          this.selectedDelete = null;
          this.$store.commit("setSnackbar", {
            color: "info",
            timeout: 3000,
            text: "Question has been deleted"
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
<style>
.v-input {
  margin-top: 0px !important;
  padding-top: 0px !important;
}
.list-question {
  height: 300px;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.5s;
  height: 300px;
}
.list-enter,
.list-leave-to {
  opacity: 0;
  height: 0px;
  transform: translateY(-300px);
}

/* * {
  border: solid 1px red;
} */
</style>
