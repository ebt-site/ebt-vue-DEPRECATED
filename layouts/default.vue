<template>
  <v-app >
    <div class="test-main"> <!-- TEST -->
      <ebt-picker :labelIndex="-1" ></ebt-picker>
      SN12.23/en
      <ebt-picker :labelIndex="0" ></ebt-picker>
    </div> <!-- TEST -->
  <!--
    <v-app-bar dark :clipped-left="clipped" fixed app hide-on-scroll >
      <ebt-app-bar 
        :title="ebtSiteTitle"
        :imgUrl="ebtSiteImage"
        :monolingual="ebtLang"
        home="/suttas"
        >
        <v-btn icon class="ebt-icon-btn" 
          title="Github"
          :href="githubUrl" target="_blank">
          <v-icon>{{ mdiGithub }}</v-icon>
        </v-btn>
        <v-btn icon to="/components" class="ebt-icon-btn" >
          <v-icon class="ebt-settings-icon">{{mdiMenu}}</v-icon>
        </v-btn>
      </ebt-app-bar>
    </v-app-bar>
    <div class="site-main">
      <v-container class="site-content">
        <nuxt />
      </v-container>
    </div>
-->
  </v-app>
</template>

<script>
import Vue from 'vue';
const { version } = require('~/package.json');
import { EbtVue } from '../index';
const JS = {
  BilaraWeb: require('../src/bilara-web'),
  Tipitaka: require('scv-bilara/src/tipitaka'),
}
import {
  mdiMenu,
  mdiGithub,
} from "@mdi/js";
let {
  EbtAppBar,
  EbtCursor,
  EbtPicker,
} = EbtVue;

export default {
  components: {
    EbtCursor,
    EbtAppBar,
    EbtPicker,
  },
  data () {
    return {
      clipped: false,
      mdiMenu,
      mdiGithub,
    }
  },
  methods: {
  },
  computed: {
    js() { 
      return JS;
    },
    version() {
      return version;
    },
    ebtLang() {
        return this.$nuxt.context.env.ebt_lang;
    },
    ebtSiteImage() {
        return this.$nuxt.context.env.ebt_site_image;
    },
    ebtSiteTitle() {
        return this.$nuxt.context.env.ebt_site_title;
    },
    githubUrl() {
        let {
          ebt_repository,
          ebt_account,
        } = this.$nuxt.context.env;
        return `https://github.com/${ebt_account}/${ebt_repository}`;
    },
  },
}
</script>
<style>
.test-main {
  padding: 1em;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
.site-main {
}
.site-content {
  margin-top: 90px;
  padding: 0;
  padding-bottom: 60px;
}
</style>
