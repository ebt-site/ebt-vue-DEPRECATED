<template>
  <div class="ebt-nav-cursor">
    <div class="ebt-audio-bottom">
      <v-btn icon 
        id="ebt-play-pause"
        ref="ebt-play-pause"
        @click="clickPlayPause()"
        @touchstart="clickTouchStart()"
        @touchend="clickTouchEnd()"
        :aria-label="$t('ariaPlay')"
        class="ebt-icon-btn" >
        <v-icon>{{playPauseIcon}}</v-icon>
      </v-btn>
    </div>
    <div class="ebt-play-time">{{playTime}}</div>
    <v-icon class="mr-1" v-if="audioStarted" small>{{mdiVolumeHigh}}</v-icon>
    <v-icon v-if="audioStarted && playToEnd" small>{{mdiInfinity}}</v-icon>
    <v-icon v-if="audioStarted && !playToEnd" small>{{mdiNumeric1}}</v-icon>

    <v-spacer/>
    <ebt-history :js="js" >
    </ebt-history>
    <v-spacer/>

    <div class="ebt-page-bottom" >
      <v-btn icon dark
          @click="clickPageTop()"
          :aria-label="$t('ariaPageTop')"
          class="ebt-icon-btn" >
          <v-icon >{{mdiChevronUp}}</v-icon>
      </v-btn>
      <v-btn icon dark
          @click="clickPageBottom()"
          :aria-label="$t('ariaPageBottom')"
          class="ebt-icon-btn" >
          <v-icon >{{mdiChevronDown}}</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import {
  mdiNumeric1,
  mdiVolumeHigh,
  mdiVoicemail,
  mdiInfinity,
  mdiAccountVoice,
  mdiChevronDown,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronUp,
  mdiPause,
  mdiPlay,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';
const {
  Settings,
  BilaraWeb,
} = require('../src/index');
class UrlError extends Error {
  constructor(message, url) {
    super(message);
    this.url = url;
  }
}
import EbtHistory from './ebt-history';

const PAT_NOAUDIO = ['ac87a767581710d97b8bf190fd5e109c']; // Amy
const LENGTH_NOAUDIO = 5000; // actually 3761
const URL_NOAUDIO = "audio/383542__alixgaus__turn-page.mp3"
// TODO: Apple doesn't support AudioContext symbol
const AudioContext = window.AudioContext || window.webkitAudioContext;

export default {
  components: {
    EbtHistory,
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      mdiNumeric1,
      mdiVolumeHigh,
      mdiVoicemail,
      mdiInfinity,
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
      audioScid: null,
      playPauseIcon: mdiAccountVoice,
      playToEnd: false,
      playTime: null,
      clock: null,
      theAudioContext: null,
      patNoAudio: PAT_NOAUDIO,
      reNoAudio: new RegExp(PAT_NOAUDIO.join('|')),
    };
  },
  async mounted() {
    this.bilaraWeb = new this.js.BilaraWeb({fetch});
    let that = this;
    this.clock = this.clock || setInterval(()=>{
      let { audioStarted } = that;
      if (audioStarted == null) {
        return;
      }

      let elapsed = Date.now() - audioStarted;
      let totalSeconds = Math.round(elapsed / 1000);
      let seconds = totalSeconds % 60;
      let minutes = (totalSeconds - seconds) / 60;
      let s = `0${seconds}`;
      Vue.set(that, 'playTime',  `${minutes}:${s.substring(s.length-2)}`);
    }, 1000);
  },
  methods:{
    async clickTouchStart() {
      let { audioContext } = this;
      
      if (audioContext.state === 'suspended') {
        console.log(`ebt-cursor.clickTouchStart() suspended => resume()`);
        audioContext.resume();
      } else {
        console.log(`ebt-cursor.clickTouchStart() ${audioContext.state}`);
      }
    },
    clickTouchEnd() {
      console.log(`ebt-cursor.clickTouchEnd() ${audioContext.state}`);
    },
    async playUrl(url) { 
      try {
        let { patNoAudio, reNoAudio, audioContext } = this;
        let length = 0;
        let numberOfChannels = 2;
        let sampleRate = 48000;

        if (reNoAudio.test(url)) {
          url = URL_NOAUDIO;
        }
        let headers = new Headers();
        headers.append('Accept',  'audio/mpeg');
        let res = await fetch(url, { headers });
        if (!res.ok) {
           let e = new Error(`playUrl(${url}) ERROR => HTTP${res.status}`);
           e.url = url;
           throw e;
        }
        let urlBuf = await res.arrayBuffer();
        let audioSource = audioContext.createBufferSource();
        Vue.set(this, "audioSource", audioSource);
        let urlAudio = await new Promise((resolve, reject)=>{
          audioContext.decodeAudioData(urlBuf, resolve, reject);
        });
        numberOfChannels = Math.min(numberOfChannels, urlAudio.numberOfChannels);
        length += urlAudio.length;
        sampleRate = Math.max(sampleRate, urlAudio.sampleRate);
        console.debug(`playUrl(${url})`, {sampleRate, length, numberOfChannels});
        if (length < LENGTH_NOAUDIO) {
          let guid = url.split('/').pop();
          patNoAudio.push(guid);
          console.log(`ebt-cursor.playUrl() patNoAudio => `, patNoAudio);
          Vue.set(this, "reNoAudio", new RegExp(patNoAudio.join('|')));
          return await this.playUrl(URL_NOAUDIO);
        }

        let msg = [
          `audioContext.createBuffer`,
          JSON.stringify({numberOfChannels, length, sampleRate}),
        ].join(' ');
        let audioBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
          let offset = 0;
          msg = [
            `new Float32Array`,
            typeof Float32Array,
            typeof window.Float32Array,
            Float32Array == null ? "null" : "OK",
          ].join(' ');
          let channelData = new Float32Array(length);
          channelData.set(urlAudio.getChannelData(channelNumber), offset);
          offset += urlAudio.length;
          audioBuffer.getChannelData(channelNumber).set(channelData);
        }

        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        return new Promise((resolve, reject) => { try {
          audioSource.onended = evt => {
            console.log(`playUrl(${url}) => OK`);
            resolve();
          };
          audioSource.start();
        } catch(e) {
          let msg = `playUrl(ERROR) ${url} could not start() => ${e.message}`;
          console.error(msg);
          alert(msg);
          reject(e);
        }}); // Promise
      } catch(e) {
        let msg = `playURL(ERROR) ${url} => ${e.message}`;
        console.debug(msg);
        throw e;
      }
    }, // playUrl()
    async playCursor(context) {
      let { vtrans, vroot } = context;
      let { bilaraWeb, cursor, settings, } = this;
      let { scid, lang, translator } = cursor;
      try {
        var audioUrls = await bilaraWeb.segmentAudioUrls({
          scid, lang, translator, vtrans, vroot });
        var urlPali = settings.showPali && audioUrls.pli;
        var urlTrans = settings.showTrans && audioUrls[lang];

        if (urlPali) {
          await this.playUrl(urlPali);
          if (!this.audioStarted) {
            console.log(`ebt-cursor.playCursor (paused)`);
            return false; 
          }
        }

        if (urlTrans) {
          await this.playUrl(urlTrans);
        } else if (!urlPali) {
          // empty segment
          this.playUrl(URL_NOAUDIO); 
        }

        let that = this;
        let { audioStarted, playToEnd } = that;
        let advanceSegment = true;
        if (playToEnd) {
          console.debug(`ebt-cursor.playCursor playToEnd`);
          if (!audioStarted) {
            Vue.set(that, "playToEnd", false);
          }
        } else if (!audioStarted) { // paused
          console.log(`ebt-cursor.playCursor paused`);
          Vue.set(that, "playPauseIcon", mdiAccountVoice);
          Vue.set(that, "audioSource", null);
          advanceSegment = false;
        } else { // normal end
          console.log(`ebt-cursor.playCursor segment end`);
          Vue.set(that, "audioStarted", null);
          Vue.set(that, "playPauseIcon", mdiAccountVoice);
          Vue.set(that, "audioSource", null);
        }
        if (!advanceSegment) {
          console.log(`ebt-cursor.playCursor advanceSegment:${advanceSegment}`);
          return false;
        }
        let advanced = await that.nextSegment();
        if (!advanced) {
          console.debug(`ebt-cursor.playCursor advanced:${advanced}`);
          return false;
        }
        console.debug(`ebt-cursor.playCursor playToEnd:${this.playToEnd}`);
        return this.playToEnd;
      } catch(e) {
        if (e.url === urlPali && vroot.toLowerCase() !== 'aditi') {
          let vrootAlt = 'aditi';
          console.log(`ebt-cursor.playCursor ${vroot} unavailable`,
            `(trying ${vtrans}/${vrootAlt})`);
          context.vroot = vrootAlt;
          return await this.playCursor(context);
        } else if (e.url === urlTrans && vtrans.toLowerCase() !== 'amy') {
          let vtransAlt = 'amy';
          console.log(`ebt-cursor.playCursor ${vtrans} unavailable`,
            `(trying ${vtransAlt}/${vroot})`);
          context.vtrans = vtransAlt;
          return await this.playCursor(context);
        } 
        console.log(`ebt-cursor.playCursor no audio`, scid);
        await this.playUrl(URL_NOAUDIO);
        return false;
      }
    },
    async clickPlayPause() {
      let { audioStarted, playPauseIcon, $refs, audioContext } = this;
      let playPause = $refs['ebt-play-pause'];
      playPause && playPause.$el.focus && playPause.$el.focus();
      if (audioStarted) {
        if (playPauseIcon === mdiPause) {
          Vue.set(this, "playToEnd", false);
          console.log(`ebt-cursor.clickPlayPause pause`);
          this.clickPause();
        } else {
          Vue.set(this, "playToEnd", true);
          console.log('ebt-cursor.clickPlayPause() playToEnd');
        }
      } else {
        Vue.set(this, "audioStarted", new Date());
        Vue.set(this, "playToEnd", false);
        console.log(`ebt-cursor.clickPlayPause clickPlay`);
        this.clickPlay();
      }
    },
    clickPause() {
      let { audioSource, playToEnd } = this;
      if (audioSource) {
        Vue.set(this, "audioStarted", null); // paused
        Vue.set(this, "playTime", null);
        console.log(`ebt-cursor.clickPause => stop audio`);
        audioSource.stop();
      } else {
        console.error(`ebt-cursor.clickPause => no audioSource`);
      }
    },
    async clickPlay() {
      let {
        bilaraWeb,
        cursor,
        settings,
      } = this;
      let vtrans = cursor.lang === settings.lang
        ? settings.vnameTrans
        : bilaraWeb.langDefaultVoice(cursor.lang).name;
      let vroot = settings.vnameRoot;
      let opts = {vtrans, vroot};

      let ok = true;
      do {
        let { scid, lang, translator } = cursor;
        if (/:0/.test(scid)) {
          // For smoother listening, human voices normally fail over 
          // to robot voices for the entire sutta since there is no point
          // in failing over repeatedly for each succeeding segment 
          // if the sutta has no human recording.
          // However, human voices don't normally voice metadata segments,
          // so we need to bypass that failover for the metadata segments
          opts = {vtrans, vroot};
        }
        console.debug(`ebt-cursor.clickPlay ... `, {scid, lang, translator, opts});
        Vue.set(this, "audioScid", scid);
        this.updatePlayPauseIcon();
        ok = await this.playCursor(opts);
      } while(ok && this.playToEnd);

      this.playToEnd && this.playBell();
      Vue.set(this, "playToEnd", false);
      Vue.set(this, "audioStarted", null);
      Vue.set(this, "audioSource", null);
      Vue.set(this, "playPauseIcon", mdiAccountVoice);
      console.log(`ebt-cursor.clickPlay => done`);
    },
    async nextSegment() {
      let { audioScid, sutta, cursor, $store, playToEnd } = this;
      let segments = sutta && sutta.segments || [];
      let iAudioSegment = segments.findIndex(s=>s.scid === audioScid);
      let iCursorSegment = segments.findIndex(s=>s.scid === cursor.scid);
      if (iCursorSegment < 0 || iAudioSegment < 0) {
          console.log(`ebt-cursor.nextSegment => false`, 
            {iAudioSegment, iCursorSegment});
      }
      let iNextSeg = audioScid === cursor.scid
        ? iAudioSegment + 1
        : iCursorSegment;
      let nextSeg = segments[iNextSeg];
      let nextScid = nextSeg && nextSeg.scid;
      if (nextScid) {
        $store.commit('ebt/selectSegment', nextScid);
        let elt = document.getElementById(nextScid);
        if (elt) {
          console.debug(`ebt-cursor.nextSegment() scrollIntoView`,
            `nextScid:${nextScid}`, elt);
          elt.scrollIntoView({ block: "center", behavior: "smooth",});
        } else {
          console.debug(`ebt-cursor.nextSegment nextScid:${nextScid}`);
        }
      } else {
        console.debug(`ebt-cursor.nextSegment nextScid:${nextScid}`);
      } 
      return nextScid;
    },
    async playBell() {
      let { settings } = this;
      let { ips } = settings;
      let bell = Settings.IPS_CHOICES[ips];
      console.log(`ebt-cursor.playBell`, ips, bell);
      if (bell && bell.url) {
        await this.playUrl(bell.url.substring(1));
      }
    },
    clickPageTop() {
      let elt = document.getElementById("ebt-search-field");
      if (elt) {
        let refSearchAuto = elt.__vue__.$refs.refSearchAuto;
        let input = refSearchAuto.$refs.input;
        this.$nextTick(()=>{
          console.log('ebt-cursor.clickPageTop() scrollIntoView', {elt});
          elt.scrollIntoView({block: "center"});
          input.focus();
        });
      }
    },
    clickPageBottom() {
      let elt = document.getElementById("ebt-tipitaka");
      elt && this.$nextTick(()=>{
        console.log('ebt-cursor.clickPageBottom() scrollIntoView', {elt});
        elt.scrollIntoView({block: "center"});
      });
    },
    updatePlayPauseIcon() {
      let that = this;
      let { playToEnd } = this;

      if (playToEnd) {
        console.debug(`ebt-cursor.updatePlayPauseIcon => pause (playToEnd)`);
        Vue.set(this, "playPauseIcon", mdiPause);
      } else {
        Vue.set(this, "playPauseIcon", mdiInfinity);
        let MS_CONTINUOUS_PLAY = 1000;
        setTimeout(()=>{
          let { audioStarted } = this;
          let playPauseIcon = audioStarted ? mdiPause : mdiAccountVoice;
          if (playPauseIcon !== this.playPauseIcon) {
            Vue.set(this, "playPauseIcon", playPauseIcon);
            console.debug(`ebt-cursor.updatePlayPauseIcon => pause (play segment)`);
          } else {
            console.debug(`ebt-cursor.updatePlayPauseIcon => accountVoice`);
          }
        }, MS_CONTINUOUS_PLAY);
      }
    },
  },
  computed: {
    audioContext() {
      let ac = this.theAudioContext;
      if (ac == null) {
        ac = new AudioContext();
        Vue.set(this, "theAudioContext", ac);
      }
      return ac;
    },
    cursorLabel() {
      let { scid='--', lang='--' } = this.cursor || {};
      return `${scid}/${lang}`;
    },
    cursor() {
      let { iCursor, history } = this.settings;
      return history && history[iCursor];
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
    segments() {
      let { sutta } = this;
      return sutta && sutta.segments || [];
    },
    history() {
      return this.$store.state.ebt.settings.history;
    },
    settings() {
      return this.$store.state.ebt.settings; 
    },
  },
}
</script>
<style>
.ebt-nav-cursor {
  display: flex;
  flex-flow: row noWrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: var(--ebt-background-color-dark);
}
.ebt-audio-bottom {
  position: absolute;
  let: 0;
  bottom: calc(var(--ebt-bottom-navigation-height)*1);
  background-color: var(--ebt-focus-background-color-dark) !important;
  border-top-right-radius: 0.5em !important;
  display: flex;
  flex-flow: row;
  padding: 4pt;
  padding-left: 1em;
  padding-right: 1em;
}
.ebt-play-time {
  font-size: smaller;
  margin-left: 0.2em;
  margin-right: 0.2em;
}
.ebt-page-bottom {
  position: absolute;
  right: 0;
  bottom: calc(var(--ebt-bottom-navigation-height)*1);
  background-color: var(--ebt-focus-background-color-dark) !important;
  border-top-left-radius: 0.5em !important;
  display: flex;
  flex-flow: row;
  padding: 4pt;
}
</style>
