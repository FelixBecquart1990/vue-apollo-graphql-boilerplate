<template>
  <v-sparkline
    class="mt-12"
    :value="getValue()"
    :gradient="['blue', 'red']"
    smooth="50"
    padding="4"
    line-width="2"
    stroke-linecap="round"
    gradient-direction="top"
    :fill="false"
    type="trend"
    :auto-line-width="false"
    auto-draw
  ></v-sparkline>
</template>

<script>
export default {
  props: ["votes"],
  methods: {
    getValue() {
      if (this.votes.length == 0) return [0, 0];
      let values = [];
      this.votes.forEach(function(vote) {
        vote.content ? values.unshift(1) : values.unshift(-1);
      });
      if (values.length <= 10) values.unshift(0);

      return values;
    },
  },
};
</script>
