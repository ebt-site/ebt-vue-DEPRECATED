<template>
  <div class="ebt-nav-cursor">
    <v-btn small text
        class="ebt-text-btn ebt-nav-btn"
        @click="clickCursor(cursor)"
    >{{cursorLabel}}</v-btn>
    <v-spacer/>
    <div class="text-center"><!-- center -->
      <div><!-- audio player-->
        <v-btn icon disabled
            @click="clickPlayPrevious()"
            :aria-label="$t('ariaPlayPrevious')"
            class="ebt-icon-btn" >
            <v-icon >{{mdiSkipPrevious}}</v-icon>
        </v-btn>
        <v-btn icon v-if="!audioStarted"
            @click="clickPlay()"
            :aria-label="$t('ariaPlay')"
            class="ebt-icon-btn" >
            <v-icon >{{mdiAccountVoice}}</v-icon>
        </v-btn>
        <v-btn icon v-if="audioStarted"
            @click="clickPause()"
            :aria-label="$t('ariaPause')"
            class="ebt-icon-btn" >
            <v-icon >{{mdiPause}}</v-icon>
        </v-btn>
        <v-btn icon disabled
            @click="clickPlayNext()"
            :aria-label="$t('ariaPlayNext')"
            class="ebt-icon-btn" >
            <v-icon >{{mdiSkipNext}}</v-icon>
        </v-btn>
      </div><!-- audio player-->
    </div><!-- center -->
    <v-spacer/>

    <v-btn icon
        @click="clickPageTop()"
        :aria-label="$t('ariaPageTop')"
        class="ebt-icon-btn" >
        <v-icon >{{mdiChevronUp}}</v-icon>
    </v-btn>
    <v-btn icon
        @click="clickPageBottom()"
        :aria-label="$t('ariaPageBottom')"
        class="ebt-icon-btn" >
        <v-icon >{{mdiChevronDown}}</v-icon>
    </v-btn>
  </div>
</template>

<script>
import Vue from "vue";
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronUp,
  mdiChevronDown,
  mdiAccountVoice,
  mdiPlay,
  mdiPause,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';
const {
  Settings,
  BilaraWeb,
} = require('../src/index');

export default {
  components: {
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      mdiChevronLeft,
      mdiChevronRight,
      mdiChevronUp,
      mdiChevronDown,
      mdiAccountVoice,
      mdiPlay,
      mdiPause,
      mdiSkipNext,
      mdiSkipPrevious,
      audioSource: null,
      bilaraWeb: null,
      audioStarted: null,
    };
  },
  async mounted() {
    let { $el, $refs } = this;
    this.$nuxt.$on('ebt-load-sutta', payload=>{
      $el && $el.scrollIntoView({
        block: "center",
      });
    });
    this.bilaraWeb = new this.js.BilaraWeb({fetch});
  },
  methods:{
    async fetchAudioSource(...urls) {
      urls = urls.filter(url=>!!url);
      let audioContext = new AudioContext();
      let audioSource = audioContext.createBufferSource();
      let urlBuffers = [];
      let urlAudio = [];
      let numberOfChannels = 2;
      let length = 0;
      let sampleRate = 48000;
      for (let i = 0; i < urls.length; i++) {
        try {
          let url = urls[i];
          if (url) {
              let res = await fetch(url);
              urlBuffers.push(res.arrayBuffer());
          }
        } catch(e) {
          console.log(`no audio for ${url}`);
        }
      }
      for (let i = 0; i < urlBuffers.length; i++) {
        urlAudio.push(audioContext.decodeAudioData(await urlBuffers[i]));
      }
      for (let i = 0; i < urlAudio.length; i++) {
        let ua = urlAudio[i] = await urlAudio[i];
        numberOfChannels = Math.min(numberOfChannels, ua.numberOfChannels);
        length += ua.length;
        sampleRate = Math.max(sampleRate, ua.sampleRate);
      }

      let audioBuffer = new AudioBuffer({length, numberOfChannels, sampleRate})
      for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
        let offset = 0;
        let channelData = new Float32Array(length);
        for (let i = 0; i < urlAudio.length; i++) {
          let ua = urlAudio[i];
          channelData.set(ua.getChannelData(channelNumber), offset);
          offset += ua.length;
        }
        audioBuffer.copyToChannel(channelData, channelNumber);
      }

      audioSource.buffer = audioBuffer;
      audioSource.connect(audioContext.destination);
      return audioSource;
    },
    clickPause() {
      let { audioSource } = this;
      if (audioSource) {
        audioSource.stop();
      }
    },
    async createAudioSource({vtrans, vroot}) {
      let {
        bell,
        bilaraWeb,
        cursor,
        settings,
      } = this;
      let { scid, lang, translator } = cursor;
      try {
        let audioUrls = await bilaraWeb.segmentAudioUrls({
          scid,
          lang,
          translator,
          vtrans,
          vroot,
        });
        let audioPali = settings.showPali && audioUrls.pli;
        let audioTrans = settings.showTrans && audioUrls[lang];

        return await this.fetchAudioSource(audioPali, audioTrans);
      } catch(e) {
        if (vtrans.toLowerCase() !== 'amy' && vroot.toLowerCase() !== 'aditi') {
            console.log(`createAudioSource() unavailable:${vtrans} (trying amy/aditi)`);
            return this.createAudioSource({
                vtrans: "amy", 
                vroot:"aditi", 
            });
        }
        return null;
      }
    },
    async clickPlay() {
      let {
        bell,
        bilaraWeb,
        cursor,
        settings,
        $store,
      } = this;
      let { scid, lang, translator } = cursor;
      let vtrans = lang === settings.lang
        ? settings.vnameTrans
        : bilaraWeb.langDefaultVoice(lang).name;
      let vroot = settings.vnameRoot;
      console.log(`clickPlay()`,
        `sutta:${scid}/${lang}/${translator}`,
        `narrators:${vroot}/${vtrans}`);
      let that = this;
      let audioSource = await this.createAudioSource({ vtrans, vroot, });
      if (audioSource) {
          Vue.set(that, "audioStarted", new Date());
          Vue.set(that, "audioSource", audioSource);
          audioSource.onended = evt => {
            Vue.set(that, "audioStarted", null);
            Vue.set(that, "audioSource", null);
          };
          console.log(`ebt-cursor.clickPlay()`, {scid, lang, vroot, vtrans});
          audioSource.start();
      } else {
        Vue.set(that, "audioStarted", null);
        Vue.set(that, "audioSource", null);
      }
    },
    clickPageTop() {
        let elt = document.getElementById("ebt-search-field");
        if (elt) {
            let refSearchAuto = elt.__vue__.$refs.refSearchAuto;
            let input = refSearchAuto.$refs.input;
            this.$nextTick(()=>{
                elt.scrollIntoView({block: "center"});
                input.focus();
            });
        }
    },
    clickPageBottom() {
        let elt = document.getElementById("ebt-tipitaka");
        console.log('clickPageBottom', {elt});
        elt && this.$nextTick(()=>{
            elt.scrollIntoView({block: "center"});
        });
    },
    async clickCursor(cursor) {
        let { sutta, history, $store } = this;
        let { sutta_uid, lang } = cursor;
        let updateHistory = false;
        if (sutta_uid !== sutta.sutta_uid) {
            await $store.dispatch('ebt/loadSutta', {sutta_uid, lang, updateHistory});
        }
        let elt = document.getElementById(cursor.scid);
        elt && elt.scrollIntoView({block: "center"});
    },
  },
  computed: {
    cursorLabel() {
        let { cursor } = this;
        if (!cursor) {
            return "...";
        }
        let { scid, lang } = cursor;
        return `${scid}/${lang}`;
    },
    cursor() {
        return this.$store.state.ebt.settings.cursor;
    },
    current() {
        let { history, sutta } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        return history[iCur] || sutta;
    },
    sutta() {
        return this.$store.state.ebt.sutta;
    },
    history() {
      return this.$store.state.ebt.settings.history;
    },
    bell() {
      let { ips } = this;
      return ips && Settings.IPS_CHOICES[ips];
    },
    ips() {
      return this.settings?.ips; 
    },
    settings() {
      return this.$store.state.ebt.settings; 
    },
  },
}
</script>
<style>
</style>
