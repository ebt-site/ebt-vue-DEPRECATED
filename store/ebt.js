const {
    BilaraWeb,
    Settings,
} = require('../src/index');
const examples = require('../api/examples.json');

var bilaraWeb;

const DEFAULT = {
    get sutta() { return {
        titles: ['...'],
        lang: 'en',
        translator: '...',
        sutta_uid: null,
        segments: [
            {scid: null, pli: '...', en: '...'}
        ],
    }}
}

export const state = () => ({
    search: '',
    searchResults: {},
    settings: Object.assign({}, new Settings()),
    sutta: DEFAULT.sutta,
    examples,
    voices: [],
})

export const mutations = {
    cursorScid(state, value) {
        let { settings, sutta } = state;
        let { history } = settings;
        let { sutta_uid, lang, translator, } = sutta;
        let suttas = history.filter(h=>h.sutta_uid===sutta_uid);
        if (suttas.length) {
            let cursor = suttas.find(h=>h.lang===lang) || suttas[0];
            settings.cursor = cursor;
            cursor.scid = value;
            cursor.lang = lang;
            cursor.translator = translator;
            console.log(`$store.state.ebt.cursorScid cursor:`, cursor);
        } else {
            console.warn(`$store.state.ebt.cursorScid mutation ignored.`,
                `Cursor not found for scid:${value} lang:${lang} history:`, 
                history);
        }
    },
    sutta(state, sutta) {
        let { settings } = state;
        let { history } = settings;
        let { sutta_uid, lang, updateHistory=true } = sutta;
        let sh = history.find(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        if (sh && !sh.scid) {
            sh.scid = sutta.segments[0].scid;
            sh.translator = sutta.translator;
            sh.lang = lang;
            settings.cursor = sh;
        }
        Object.assign(state.sutta, DEFAULT.sutta, sutta);
        console.log(`$store.state.ebt.sutta:`, sutta, sh);
    },
    suttaRef(state, value) {
        let { settings } = state;
        let { sutta_uid, lang, updateHistory=true } = value;
        Object.assign(state.sutta, DEFAULT.sutta, {sutta_uid, lang});
        if (updateHistory) {
            let { history } = settings;
            let sh = history.find(h=>h.sutta_uid===sutta_uid && h.lang===lang);
            let date = new Date();
            if (sh) {
                sh.date = date;
                settings.cursor = sh;
            } else {
                let { scid } = state.sutta.segments[0];
                let { translator } = state.sutta;
                let historyNew = { sutta_uid, date, lang, translator, scid};
                settings.cursor = historyNew;
                console.log(`dbg suttaRef`, historyNew);
                history.push(historyNew);
            }
            if (!settings.cursor.scid) {
                settings.cursor.scid = state.sutta.segments[0].scid;
                settings.cursor.lang = state.sutta.lang;
                settings.cursor.translator = state.sutta.translator;
            }
            history.sort((a,b)=>a.date-b.date);
        }
        console.log(`$store.state.ebt.suttaRef:`, value, settings); 
    },
    search(state, value) {
        if (value !== state.search) {
            console.log(`$store.state.ebt.search:`, value);
            state.search = value;
        }
    },
    searchResults(state, value) {
        state.searchResults = value;
        value.mlDocs.forEach(mld=>(mld.showDetails = false));
        console.log(`$store.state.ebt.searchResults:`, value);
    },
    settings(state, value) {
        Object.assign(state.settings, value);
        value.showTrans === false && (state.settings.showPali = true);
        value.showPali === false && (state.settings.showTrans = true);
        value.saveSettings && (state.settings.saveSettingsExamples = false);
        value.saveSettingsExamples && (state.settings.saveSettings = false);
        console.log(`$store.state.ebt.settings:`, value);
    },
    voices(state, value) {
        Object.assign(state.voices, value);
        console.log(`$store.state.ebt.voices:`, value);
    },
    examples(state, value) {
        Object.assign(state.examples, value);
        console.log(`$store.state.ebt.examples:`, value);
    },
}

export const actions = {
    async loadSutta (context, payload) {
        $nuxt.$emit('ebt-load-sutta', payload);
        let settings = context.state.settings;
        let { sutta_uid, lang=settings.lang, updateHistory } = payload;
        context.commit('suttaRef', {sutta_uid, lang, updateHistory});
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let sutta = await bilaraWeb.loadSutta({sutta_uid, lang});
        if (sutta == null) {
            console.log(`$store.state.ebt.loadSutta(${sutta_uid}/${lang})`,
                `substituting ${sutta_uid}/en`);
            lang = 'en';
            sutta = await bilaraWeb.loadSutta({sutta_uid, lang});
        }
        if (sutta == null) {
            console.error(`$store.state.ebt.loadSutta(${sutta_uid}/${lang})`,
                `=> not found`);
            return;
        }
        let { search } = $nuxt.$route.query;
        let newSearch = `${sutta_uid}/${lang}`;
        if (search !== newSearch) {
            $nuxt.$router.replace({query: {search: `${sutta_uid}/${lang}`}});
        }
        context.commit('sutta', sutta);
    },
    async loadExample ({commit, state}, payload) {
        let { pattern, lang=state.settings.lang } = payload;
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        if (pattern) {
            let value = await bilaraWeb.find({ pattern, lang, });
            value.mlDocs.forEach(mld=>{
                mld.segments = Object.keys(mld.segMap).map(scid=>mld.segMap[scid]);
            });
            commit('searchResults', value);
            commit('search', pattern);
            $nuxt.$emit('ebt-load-example', payload);
        }
    },
    async loadVoices({state, commit}) {
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let voices = await bilaraWeb.voices();
        commit('voices', voices);
    },
}
