import Vue from "vue"
import VueCookie from "vue-cookie"
import { Settings } from '../src/index'

const COOKIE_NAME = 'ebt-settings';
const COOKIE_SETTINGS = {
    expires: "100Y",
    SameSite: "Strict",
}

export default (context, inject) => {
    let {
        $vuetify,
        store,
        app,
    } = context;

    let $t = function(key) {
        if (/\./.test(key)) {
            key = key.startsWith('$vuetify') ? key : `$vuetify.${key}`;
        } else {
            key = `$vuetify.ebt.${key}`;
        }
        return $vuetify && $vuetify.lang.t(key) || `$vuetify.lang.t(${key})`;
    }
    console.debug(`ebt-client: injecting $t`);
    inject('t', $t);
    console.debug(`ebt-client: injecting $cookie`);
    inject('cookie', VueCookie);

    let cookieJson = VueCookie.get(COOKIE_NAME);
    if (cookieJson) {
        try {
          let settings = new Settings(JSON.parse(cookieJson));
          console.log(`ebt-client: `, {settings});
          store.commit('ebt/settings', settings);
          $vuetify.lang.current = settings.locale;
        } catch(e) {
          let msg = [
            `Cannot retrieve settings.`,
            `Please refresh your browser page.`,
            `ERROR: cannot parse saved settings (cookieJson:${cookieJson} length:${cookieJson.length})`,
          ].join('\n');
          console.error(msg);
          alert(msg);
        }
    }

    store.subscribe((mutation,state) => {
        let { type } = mutation;
        if (type==='ebt/settings' || type==='ebt/suttaRef' || type==='ebt/selectSegment') {
            let settings = state.ebt.settings;
            $vuetify.lang.current = settings.locale;
            if (settings.saveSettingsExamples) {
                let ebtCookie = new Settings(settings); // may trim history
                console.debug(`ebt-client: saving settings and examples`, ebtCookie);
                VueCookie.set(COOKIE_NAME, JSON.stringify(ebtCookie), COOKIE_SETTINGS);
            } else if (settings.saveSettings) {
                let ebtCookie = new Settings(settings); // clear history
                ebtCookie.history = [];
                console.debug(`ebt-client: saving settings`, ebtCookie);
                VueCookie.set(COOKIE_NAME, JSON.stringify(ebtCookie), COOKIE_SETTINGS);
            } else {
                console.debug(`ebt-client: clearing cookie`, settings);
                VueCookie.delete(COOKIE_NAME);
            }
        }
    });


}
