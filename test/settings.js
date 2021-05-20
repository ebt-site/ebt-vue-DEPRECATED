(typeof describe === 'function') && describe("settings", function() {
    const should = require("should");
    const {
        Settings,
    } = require("../src/index");

    it("TESTTESTdefault ctor", async()=>{
        var ebt = new Settings();
        should(ebt).properties({
            audio: Settings.AUDIO.OGG,
            iCursor: 0,
            fullLine: false,
            history: [],
            ips: 6,
            lang: 'en',
            maxResults: 5,
            maxHistory: 2000,  // half a cookie
            saveSettings: false,
            saveSettingsExamples: false,
            search: null,
            showId: false,
            showPali: true,
            showTrans: true,
            vnameRoot: 'Aditi',
            vnameTrans: 'Amy',

        });
    });
    it("custom ctor", async()=>{
        let maxHistory = 1000;
        let showId = true;
        let showPali = false;
        let history = [
            'one',
            'two',
            'three',
            'four',
        ];
        var ebt = new Settings({
            history,
            maxHistory,
            showId,
            showPali,
        });

        should.deepEqual(ebt.history, history);
        should(ebt.history).not.equal(history);

        should(ebt).properties({
            maxHistory,
            showId,
            showPali,
            history,
        });
    });
    it("TESTTESTstringify() fits a cookie", ()=>{
        let dates = [ 
            new Date(2021, 1, 1),
            new Date(2021, 2, 2),
            new Date(2021, 3, 3),
        ];
        let history = dates.map(date => ({date}));
        var ebt = new Settings({
            history,
        });

        // toJSON() truncates history as needed
        let cookie = JSON.stringify(ebt);
        should(cookie.length).below(4000); 
        let json = JSON.parse(cookie);
        let settings2 = new Settings(json);
        should.deepEqual(settings2.history, history);
    });
    it("TRANS_LANGUAGES => translation languages", ()=>{
        should.deepEqual(Settings.TRANS_LANGUAGES.map(tl=>tl.code).sort(), [
            'cs',
            'de',
            'en',
            'ja',
            'pt',
        ]);
    });

});

