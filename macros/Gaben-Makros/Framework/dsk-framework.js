// ============================================================
// === DSK FRAMEWORK 01.03 ====================================
// ============================================================
// - vollständig nach Verantwortlichkeit neu geordnet
// - bestehende Funktionsnamen bleiben kompatibel
// - bewährte Effektanlage bleibt unverändert
// - allgemeine Kernfunktionen zuerst
// - seltene Spezialfunktionen weiter unten
// ============================================================


// ============================================================
// === BLOCK 0 — INITIALISIERUNG ===============================
// ============================================================

if (!globalThis.DSK) globalThis.DSK = {};
const DSK = globalThis.DSK;

DSK.version = "01.02";


// ============================================================
// === BLOCK 1 — GÖTTER & SYMBOLE ==============================
// ============================================================

DSK.Symbol = function(gott) {
    let clean = String(gott || "Nurti").toLowerCase();
    const klammerInhalt = clean.match(/\(([^)]+)\)/);
    if (klammerInhalt) clean = klammerInhalt[1];
    clean = clean.replace(/[^a-z]/g, "");

    const ahnengabeSymbol = "https://assets.forge-vtt.com/644fbc20a9e089e2ef894956/systems/dsk/icons/categories/ahnengabe.webp";
    const basis = "https://assets.forge-vtt.com/644fbc20a9e089e2ef894956/DSK/Allgemein_Glaubenssymbole/";

    if (clean === "ahne" || clean === "vorfahre") return ahnengabeSymbol;

    const symbole = {
        aphasma: "Aphasma.webp",
        brona: "Brona.webp",
        charytho: "Charytho.webp",
        dasgoettlichepaarfasar: "Das_Goettliche_Paar_Fasar.webp",
        diebruederausmitternachtxorlosch: "die_Brueder_aus_Mitternacht_Xorlosch.webp",
        dliebruederausmitternachtxorlosch: "die_Brueder_aus_Mitternacht_Xorlosch.webp",
        diebruederausmitternachthavena: "Die_Brueder_aus_Mitternacht_Havena.webp",
        dliebruederausmitternachthavena: "Die_Brueder_aus_Mitternacht_Havena.webp",
        felliam: "Felliam.webp",
        fenk: "Fenk.webp",
        grimmangrausch: "Grimm_und_Angrausch.webp",
        grisgror: "Gris_und_Gror.webp",
        gulasch: "Gulasch.webp",
        mamosh: "Mamosh.webp",
        meen: "Meen.webp",
        nurti: "Nurti.webp",
        osommosima: "Osommo_und_Sima.webp",
        piri: "Piri.webp",
        praios: "Praios.webp",
        rondra: "Rondra.webp",
        tavadieherrinderfelder: "Tava_die_Herrin_der_Felder.webp",
        tavaschoepferinderweltxorlosch: "Tava_Schoepferin_der_Welt_Xorlosch.webp",
        trachfasar: "Trach_Fasar.webp",
        verschlinger: "Verschlinger.webp",
        wanderer: "Wanderer.webp",
        za: "Za.webp",
        zerzal: "Zerzal.webp"
    };

    let gefunden = symbole[clean];

    if (!gefunden) {
        const key = Object.keys(symbole).sort((a, b) => b.length - a.length)
            .find(k => clean.includes(k) || k.includes(clean));
        gefunden = key ? symbole[key] : "Nurti.webp";
    }

    return basis + gefunden;
};

// Vorläufiger Kompatibilitätsalias für bestehende Makros.
DSK._resolveSymbol = function(input) {
    return DSK.Symbol(input);
};


// ============================================================
// === BLOCK 2 — AKTEURE, TOKEN & WESEN ========================
// ============================================================

// +++ 2.1 - TOKENNAME +++++++++++++++++++++++++++++++++++++++++
DSK.ResolveTokenName = function(actor) {
    if (!actor) return "Unbekannt";
    const token = canvas.tokens?.placeables?.find(t => t.actor?.uuid === actor.uuid || t.actor?.id === actor.id);
    return token?.document?.name || token?.name || actor.name || "Unbekannt";
};

// +++ 2.2 - TOKEN FINDEN ++++++++++++++++++++++++++++++++++++++
DSK.Token = DSK.Token || {};
DSK.Token.Finde = function(actor, id = null, uuid = null) {
    if (!actor) return null;

    if (id) {
        const t = canvas.tokens?.placeables?.find(x => x.id === id);
        if (t?.actor) return t;
    }
    if (uuid) {
        const t = canvas.tokens?.placeables?.find(x => x.document?.uuid === uuid || x.uuid === uuid);
        if (t?.actor) return t;
    }

    const c = canvas.tokens?.controlled?.find(x => x.actor?.uuid === actor.uuid || x.actor?.id === actor.id);
    if (c?.actor) return c;

    const a = actor.getActiveTokens?.()?.[0];
    if (a?.actor) return a;

    return canvas.tokens?.placeables?.find(x => x.actor?.uuid === actor.uuid || x.actor?.id === actor.id) || null;
};

// +++ 2.3 - WESEN-ERKENNUNG +++++++++++++++++++++++++++++++++++
DSK.Wesen = DSK.Wesen || {};

DSK.Wesen.isAlwaysErwacht = function(actor) {
    return Boolean(actor && (actor.type === "character" || actor.type === "npc"));
};

DSK.Wesen._species = function(actor) {
    return String(actor?.system?.species?.value || actor?.system?.details?.species || "").toLowerCase();
};

DSK.Wesen.match = function(actor, varianten = []) {
    if (!actor) return false;
    const liste = (Array.isArray(varianten) ? varianten : [varianten]).map(v => String(v || "").toLowerCase());
    if (this.isAlwaysErwacht(actor) && liste.some(v => ["erwacht", "erwachter", "erwachte"].includes(v))) return true;
    const species = this._species(actor);
    return liste.some(v => species.includes(v));
};

DSK.Wesen.IstLebendig = function(actor, { zusaetzlichAusgeschlossen = [] } = {}) {
    if (!actor) return false;
    const type = String(actor.type || "").toLowerCase(), species = this._species(actor);
    const std = ["untot", "geist", "vampir", "leiche", "golem", "konstrukt", "skelett", "zombie", "dämon", "homunkulus", "mumie"];
    const aus = [...std, ...(Array.isArray(zusaetzlichAusgeschlossen) ? zusaetzlichAusgeschlossen : [zusaetzlichAusgeschlossen])]
        .map(w => String(w || "").trim().toLowerCase()).filter(Boolean);

    if (type === "spirit") return false;
    return !aus.some(w => species.includes(w));
};

DSK.Wesen.LebendeInReichweite = function(ursprungsToken, reichweite, { ursprungAusschliessen = true, zusaetzlichAusgeschlossen = [] } = {}) {
    if (!ursprungsToken) return [];
    const max = Math.max(0, Number(reichweite) || 0);

    return (canvas.tokens?.placeables || []).filter(t => {
        if (!t?.actor || (ursprungAusschliessen && t.id === ursprungsToken.id)) return false;
        if (!DSK.Wesen.IstLebendig(t.actor, { zusaetzlichAusgeschlossen })) return false;
        return DSK.Geometrie?.Distanz ? DSK.Geometrie.Distanz(ursprungsToken, t) <= max : false;
    });
};

// ============================================================
// === BLOCK 3 — TARGETS & EMPFÄNGER ===========================
// ============================================================

// +++ 3.1 - TARGETS ++++++++++++++++++++++++++++++++++++++++++++
DSK.Target = DSK.Target || {};
DSK.Target.Erstes = function() { return Array.from(game.user.targets || [])[0] || null; };

DSK.Target.Merken = function(token) {
    if (!token?.actor) return null;
    return { tokenId: token.id, tokenUuid: token.document?.uuid || token.uuid || null, actorUuid: token.actor.uuid, name: token.name || token.actor.name || "Unbekannt" };
};

DSK.Target.Finden = async function(daten) {
    if (!daten) return null;

    if (daten.tokenId) {
        const t = canvas.tokens?.placeables?.find(x => x.id === daten.tokenId);
        if (t?.actor) return t;
    }
    if (daten.tokenUuid) {
        const t = canvas.tokens?.placeables?.find(x => x.document?.uuid === daten.tokenUuid || x.uuid === daten.tokenUuid);
        if (t?.actor) return t;
    }
    if (daten.actorUuid) {
        try {
            const doc = await fromUuid(daten.actorUuid), actor = doc?.documentName === "Token" ? doc.actor : doc;
            if (actor) return DSK.Token.Finde(actor, daten.tokenId, daten.tokenUuid);
        } catch (error) { console.warn("DSK.Target.Finden:", error); }
    }
    return null;
};

DSK.Target.Actor = async function(daten) {
    if (!daten) return null;
    const token = await this.Finden(daten);
    if (token?.actor) return token.actor;

    if (daten.actorUuid) {
        try {
            const doc = await fromUuid(daten.actorUuid);
            return doc?.documentName === "Token" ? doc.actor : doc || null;
        } catch { return null; }
    }
    return null;
};

// +++ 3.2 - EMPFÄNGER +++++++++++++++++++++++++++++++++++++++++
DSK.Empfaenger = DSK.Empfaenger || {};

DSK.Empfaenger.Besitzer = function(actor) {
    if (!actor) return [];
    const ownership = actor.ownership || actor.permission || {};
    return Object.entries(ownership).filter(([id, lvl]) => id !== "default" && Number(lvl) === 3 && Boolean(game.users.get(id))).map(([id]) => id);
};

DSK.Empfaenger.GM = function({ nurAktive = false } = {}) {
    return game.users.filter(u => u.isGM && (!nurAktive || u.active)).map(u => u.id);
};

DSK.Empfaenger.GMUndBesitzer = function(actor, { anfragenderUserId = null, nurAktiveGM = false } = {}) {
    const ids = new Set([...this.GM({ nurAktive: nurAktiveGM }), ...this.Besitzer(actor)]);
    if (anfragenderUserId && game.users.get(anfragenderUserId)) ids.add(anfragenderUserId);
    return Array.from(ids).filter(id => Boolean(game.users.get(id)));
};

// ============================================================
// === BLOCK 4 — GEGENSTÄNDE & ITEM-SUCHE =====================
// ============================================================

DSK.Item = DSK.Item || {};

// +++ 4.1 - GEGENSTAND SUCHEN +++++++++++++++++++++++++++++++++
DSK.Item.HatGegenstand = function(actor, suchbegriff = "", itemTypen = []) {
    if (!actor?.items) return false;

    const begriff = String(suchbegriff || "").toLowerCase();
    const typen = (Array.isArray(itemTypen) ? itemTypen : [itemTypen]).map(t => String(t || "").toLowerCase()).filter(Boolean);
    const items = typen.length ? typen.flatMap(t => actor.itemTypes?.[t] || []) : Array.from(actor.items);

    return items.some(item => !begriff || String(item.name || "").toLowerCase().includes(begriff));
};

// ============================================================
// === BLOCK 5 — QS-ERMITTLUNG =================================
// ============================================================

DSK.QS = DSK.QS || {};

// +++ 5.1 - QS AUS TESTDATA +++++++++++++++++++++++++++++++++++
DSK.QS.AusTestData = function(testDataObj = null) {
    if (!testDataObj) return 0;
    const werte = [testDataObj?.result?.QL, testDataObj?.result?.qualityStep, testDataObj?.result?.qualityLevel, testDataObj?.qualityStep, testDataObj?.qualityLevel, testDataObj?.QL];

    for (const wert of werte) {
        const qs = Number(wert);
        if (Number.isFinite(qs) && qs > 0) return Math.floor(qs);
    }
    return 0;
};

// +++ 5.2 - NACHRICHTENTEXT + AKTEUR ++++++++++++++++++++++++++
DSK.QS.NachrichtenText = function(message) {
    if (!message) return "";
    const raw = [String(message.flavor || ""), String(message.content || "")].join(" ");
    if (DSK.Schaden?.HtmlZuText) return DSK.Schaden.HtmlZuText(raw);

    const temp = document.createElement("div"); temp.innerHTML = raw;
    return String(temp.textContent || temp.innerText || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
};

DSK.QS.NachrichtGehoertZuActor = function(message, actor) {
    if (!message || !actor) return false;
    const speaker = message.speaker || {}, speakerToken = speaker.token ? canvas.scene?.tokens?.get(speaker.token) : null;
    if (speaker.actor === actor.id || speakerToken?.actor?.id === actor.id) return true;

    const text = this.NachrichtenText(message).toLowerCase(), name = String(actor.name || "").trim().toLowerCase();
    return name ? text.includes(name) : false;
};

// +++ 5.3 - QS AUS PROBENKARTE ++++++++++++++++++++++++++++++++
DSK.QS.AusProbenkarte = function(actor, suchbegriffe = []) {
    if (!actor) return 0;
    const begriffe = (Array.isArray(suchbegriffe) ? suchbegriffe : [suchbegriffe]).map(b => String(b || "").trim().toLowerCase()).filter(Boolean);

    for (const message of [...game.messages.contents].reverse()) {
        if (!this.NachrichtGehoertZuActor(message, actor)) continue;
        const text = this.NachrichtenText(message), lower = text.toLowerCase();
        if (begriffe.length && !begriffe.some(b => lower.includes(b))) continue;

        const qs = Number(text.match(/Qualitätsstufe\s*:\s*(\d+)/i)?.[1]);
        if (Number.isFinite(qs) && qs > 0) return Math.floor(qs);
    }
    return 0;
};

// +++ 5.4 - ZENTRALE QS-ERMITTLUNG ++++++++++++++++++++++++++++
DSK.QS.Ermitteln = function({
    actor, gabenName = "", suchbegriffe = [], testDataObj = null,
    flagNamespace = "world", flagName = "letzteGabenQS",
    fallback = 0, protokollieren = false
} = {}) {
    if (!actor) return 0;

    let qs = this.AusTestData(testDataObj), quelle = qs > 0 ? "testData" : "";

    if (qs <= 0) {
        const begriffe = [gabenName, ...(Array.isArray(suchbegriffe) ? suchbegriffe : [suchbegriffe])]
            .map(b => String(b || "").replace(/\([^)]*\)/g, "").trim()).filter(Boolean);
        qs = this.AusProbenkarte(actor, begriffe);
        if (qs > 0) quelle = "Probenkarte";
    }

    if (qs <= 0) {
        const flagQS = Number(actor.getFlag(flagNamespace, flagName));
        if (Number.isFinite(flagQS) && flagQS > 0) { qs = Math.floor(flagQS); quelle = "Actor-Flag"; }
    }

    if (qs <= 0) {
        const fb = Number(fallback);
        if (Number.isFinite(fb) && fb > 0) { qs = Math.floor(fb); quelle = "Fallback"; }
    }

    if (protokollieren) console.log(`[DSK QS] ${gabenName || "Ahnengabe"}:`, { actor: actor.name, qs, quelle: quelle || "nicht gefunden" });
    return Math.max(0, Math.floor(Number(qs) || 0));
};

// ============================================================
// === BLOCK 6 — UNIVERSELLE EFFEKTANLAGE ======================
// === ACTOR-ZIEL + SICHTBARES EFFEKT-BILD =====================
// ============================================================

DSK.Effekt = DSK.Effekt || {};

// +++ 6.1 - FORMELWERT AUS QS +++++++++++++++++++++++++++++++++
DSK.Effekt.ParseWert = function(formel, qs) {
    if (!formel || typeof formel !== "string") return 0;
    const expr = formel.replace(/qs/gi, qs);
    try { return Number(eval(expr)) || 0; }
    catch { return 0; }
};

// +++ 6.2 - CHANGES ERSTELLEN +++++++++++++++++++++++++++++++++
DSK.Effekt.BuildChanges = function(targets = [], key = "system.skillModifiers.FP", formel = "qs", qs = 1) {
    if (!Array.isArray(targets)) targets = [targets];
    const wert = this.ParseWert(formel, qs);

    if (key.startsWith("system.skillModifiers.")) {
        const prefix = wert >= 0 ? "+" : "-", abs = Math.abs(wert);
        return targets.map(name => ({ key, mode: 0, value: `${name} ${prefix}${abs}` }));
    }

    return targets.map(targetKey => ({
        key: String(targetKey || "").includes("system.") ? targetKey : key,
        mode: 2, value: wert
    }));
};

// +++ 6.3 - ZIELKATEGORIE PRÜFEN ++++++++++++++++++++++++++++++
DSK.Effekt.CheckTarget = function(actor, gabeZiel = "erwachte") {
    if (!actor) return false;

    const type = String(actor.type || "").toLowerCase();
    const targetLower = String(gabeZiel || "").trim().toLowerCase();

    if (["erwachte", "erwacht", "erwachter"].includes(targetLower) && DSK.Wesen.isAlwaysErwacht(actor)) return true;
    if (targetLower === "geist" && type === "spirit") return true;

    const species = String(actor.system?.species?.value || actor.system?.details?.species || "").toLowerCase();
    return species.includes(targetLower);
};

// +++ 6.4 - EFFEKT ANWENDEN +++++++++++++++++++++++++++++++++++
DSK.Effekt.Anwenden = async function(config = {}) {
    const {
        name = "Unbenannte Gabe", ahne = "", beschreibung = "", gabeZiel = "erwachte",
        qs = 1, formel = "qs", skills = [], key = "system.skillModifiers.FP",
        ziel = null, flags = null, statuses = [], duration = null, origin = null,
        changes: direkteChanges = null, showIcon = 1,
        disabled = false, transfer = false, type = "base"
    } = config;

    const targetActor = ziel?.documentName === "Actor" ? ziel : ziel?.actor || ziel || game.user.character;

    if (!targetActor?.createEmbeddedDocuments) {
        console.warn("DSK.Effekt.Anwenden: Kein gültiger Ziel-Akteur gefunden.", { name, ziel });
        return null;
    }

    if (!this.CheckTarget(targetActor, gabeZiel)) {
        console.warn("DSK.Effekt.Anwenden: Zielkategorie nicht erlaubt.", {
            name, actor: targetActor.name, actorType: targetActor.type, gabeZiel
        });
        return null;
    }

    const changes = Array.isArray(direkteChanges)
        ? foundry.utils.deepClone(direkteChanges)
        : this.BuildChanges(skills, key, formel, qs);

    const iconPath = DSK.Symbol(ahne || name);
    const statusListe = [...new Set(
        (Array.isArray(statuses) ? statuses : [statuses])
            .map(status => String(status || "").trim()).filter(Boolean)
    )];

    const effectData = {
        name, type,
        img: iconPath, icon: iconPath,
        description: beschreibung,
        changes, statuses: statusListe,
        showIcon: Number(showIcon) === 0 ? 0 : Number(showIcon) || 1,
        disabled: Boolean(disabled),
        transfer: Boolean(transfer)
    };

    if (flags) effectData.flags = foundry.utils.deepClone(flags);
    if (duration) effectData.duration = foundry.utils.deepClone(duration);
    if (origin) effectData.origin = origin;

    try {
        const createdEffects = await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        return createdEffects?.[0] || null;
    } catch (error) {
        console.error("DSK.Effekt.Anwenden: Effekt konnte nicht erstellt werden.", {
            name, targetActor: targetActor.name, targetActorUuid: targetActor.uuid,
            effectData, error
        });
        return null;
    }
};

// ============================================================
// === BLOCK 7 — WIRKUNGSENDE =================================
// === REGISTRIERUNG + PERSISTENTE EFFEKT-FLAGS ================
// ============================================================

DSK.EffektEnde = DSK.EffektEnde || {};

// +++ 7.1 - GRUNDDATEN ++++++++++++++++++++++++++++++++++++++++
DSK.EffektEnde._registry = DSK.EffektEnde._registry || {};
DSK.EffektEnde._buffer = DSK.EffektEnde._buffer || [];
DSK.EffektEnde._timer = null;

// +++ 7.2 - REGISTRIERUNG +++++++++++++++++++++++++++++++++++++
DSK.EffektEnde.Register = function(sfName, basisEffektName, beschreibungFuerEnde) {
    if (!sfName || !basisEffektName) return null;
    this._registry[sfName] = { sfName, basisEffektName, beschreibungFuerEnde };
    this.Init();
    return foundry.utils.deepClone(this._registry[sfName]);
};

DSK.EffektEnde.Daten = function(sfName) {
    const daten = this._registry[sfName];
    return daten ? foundry.utils.deepClone(daten) : null;
};

// +++ 7.3 - LÖSCH-HOOK ++++++++++++++++++++++++++++++++++++++++
DSK.EffektEnde.Init = function() {
    if (globalThis._dskEffektEndeHook) Hooks.off("preDeleteActiveEffect", globalThis._dskEffektEndeHook);

    globalThis._dskEffektEndeHook = Hooks.on("preDeleteActiveEffect", effect => {
        if (!effect) return;

        const flagDaten = effect.getFlag("dsk", "wirkungsende");
        const effektName = String(effect.name || effect.label || "").trim();
        let daten = null;

        if (flagDaten?.basisEffektName && flagDaten?.beschreibungFuerEnde) {
            daten = {
                sfName: flagDaten.sfName || "",
                basisEffektName: flagDaten.basisEffektName,
                beschreibungFuerEnde: flagDaten.beschreibungFuerEnde
            };
        } else {
            const name = effektName.toLowerCase();
            daten = Object.values(this._registry).find(eintrag => {
                const basis = String(eintrag.basisEffektName || "").trim().toLowerCase();
                return name === basis || name.includes(basis);
            }) || null;
        }

        if (!daten) return;

        const aktiverGM = game.users.find(user => user.isGM && user.active);
        const darfSenden = aktiverGM ? game.user.isGM && game.user.id === aktiverGM.id : game.user.isGM;
        if (!darfSenden) return;

        this._buffer.push({
            name: DSK.ResolveTokenName(effect.parent),
            icon: effect.icon || effect.img || DSK.Symbol(daten.basisEffektName),
            basisEffektName: daten.basisEffektName,
            beschreibungFuerEnde: daten.beschreibungFuerEnde
        });

        clearTimeout(this._timer);
        this._timer = setTimeout(() => this._SendeKarten(), 500);
    });
};

// +++ 7.4 - ENDKARTEN SENDEN ++++++++++++++++++++++++++++++++++
DSK.EffektEnde._SendeKarten = async function() {
    const eintraege = [...this._buffer];
    this._buffer = []; this._timer = null;
    if (!eintraege.length) return;

    const gruppen = new Map();

    for (const eintrag of eintraege) {
        const key = `${eintrag.basisEffektName}::${eintrag.beschreibungFuerEnde}`;
        if (!gruppen.has(key)) gruppen.set(key, {
            basisEffektName: eintrag.basisEffektName,
            beschreibungFuerEnde: eintrag.beschreibungFuerEnde,
            icon: eintrag.icon, namen: []
        });
        gruppen.get(key).namen.push(eintrag.name);
    }

    for (const gruppe of gruppen.values()) {
        const namen = [...new Set(gruppe.namen)];

        const html = `
            <div style="font-family:'Signika',sans-serif;">
                <div class="dskbox1">
                    <p style="display:flex;gap:8px;align-items:center;margin:0;">
                        <img src="${gruppe.icon}" style="width:28px;border:none;background:transparent;">
                        <b style="font-size:1.1em;">Wirkungsende</b>
                    </p>
                    <hr style="margin:4px 0;border:0;border-top:1px solid #c9bca6;">
                    <p style="font-weight:bold;margin:0;padding-top:2px;">${gruppe.basisEffektName}</p>
                </div>
                <div class="dskbox2" style="margin-top:10px;">
                    <p>${gruppe.beschreibungFuerEnde}</p>
                    <p style="font-size:.9em;color:#555;">Einheiten/Erschwernisse verflogen.</p>
                    <hr style="margin:6px 0;border:0;border-top:1px solid #c9bca6;">
                    <p style="margin-bottom:5px;"><b>Effekt beendet auf:</b></p>
                    ${DSK.UI.List(namen)}
                </div>
            </div>`;

        await ChatMessage.create({ speaker: { alias: "System" }, content: html });
    }
};

// ============================================================
// === BLOCK 8 — ZUSTÄNDE & AUTOMATISCHE ENDZUSTÄNDE ==========
// ============================================================

DSK.Zustaende = DSK.Zustaende || { _initialized: false };

// +++ 8.1 - WÄCHTER INITIALISIEREN ++++++++++++++++++++++++++++
DSK.Zustaende.InitHooks = function() {
    if (this._initialized) return;
    this._initialized = true;

    Hooks.once("ready", () => {
        if (!CONFIG.statusEffects) return;
        for (const id of ["feared", "pain", "encumbrance", "stupor", "confusion"]) {
            const config = CONFIG.statusEffects.find(e => e.id === id);
            if (config) config.max = 8;
        }
    });

    const check = effect => {
        if (!game.user.isGM) return;
        const name = String(effect?.name || effect?.label || "").toLowerCase();
        if (effect?.statuses?.size > 0 || effect?.changes?.length > 0 || name.includes("selbstvertrauen")) {
            setTimeout(() => this.PruefeEndZustaende(effect.parent), 200);
        }
    };

    Hooks.on("createActiveEffect", check);
    Hooks.on("updateActiveEffect", check);
    Hooks.on("deleteActiveEffect", check);
};

// +++ 8.2 - ZUSTÄNDE BERECHNEN ++++++++++++++++++++++++++++++++
DSK.Zustaende.PruefeEndZustaende = async function(actor) {
    if (!actor || actor.documentName !== "Actor") return;

    const werte = { feared: 0, pain: 0, encumbrance: 0, stupor: 0 };

    for (const effekt of actor.effects) {
        if (effekt.disabled) continue;

        for (const id of ["feared", "pain", "encumbrance", "stupor"]) {
            if (effekt.statuses?.has(id) && (!effekt.changes || effekt.changes.length === 0)) {
                werte[id] += Number(effekt.getFlag("dsk", "value")) || 1;
            }
        }

        for (const change of effekt.changes || []) {
            if (change.key === "system.status.feared") werte.feared += Number(change.value) || 0;
            if (change.key === "system.status.pain") werte.pain += Number(change.value) || 0;
            if (change.key === "system.status.encumbrance") werte.encumbrance += Number(change.value) || 0;
            if (change.key === "system.status.stupor") werte.stupor += Number(change.value) || 0;
        }
    }

    const selbstvertrauen = actor.effects.find(e =>
        String(e.name || e.label || "").toLowerCase().includes("selbstvertrauen") && !e.disabled
    );
    if (selbstvertrauen) werte.feared -= Number(selbstvertrauen.getFlag("dsk", "qs")) || 1;

    await this.ToggleEndzustand(actor, werte.feared >= 8, "panic", "Status Panisch", "icons/svg/terror.svg");
    await this.ToggleEndzustand(actor, werte.pain >= 8, "incapacitated", "Status Handlungsunfähig", "icons/svg/blood.svg");
    await this.ToggleEndzustand(actor, werte.encumbrance >= 8, "immobilized", "Status Fixiert", "icons/svg/net.svg");
    await this.ToggleEndzustand(actor, werte.stupor >= 8, "unconscious", "Status Bewusstlos", "icons/svg/sleep.svg");
};

// +++ 8.3 - ENDZUSTAND SETZEN/ENTFERNEN +++++++++++++++++++++++
DSK.Zustaende.ToggleEndzustand = async function(actor, conditionMet, statusId, statusName, iconPath) {
    const existing = actor.effects.filter(e => e.statuses?.has(statusId) || (e.name || e.label) === statusName);

    if (conditionMet) {
        if (!existing.length) {
            await actor.createEmbeddedDocuments("ActiveEffect", [{
                name: statusName, type: "base", img: iconPath,
                changes: [{ key: `system.status.${statusId}`, mode: 2, value: "1" }],
                statuses: [statusId],
                flags: { core: { statusId }, dsk: { autoVerknuepfung: true } }
            }]);
        } else if (existing.length > 1) {
            for (const effekt of existing.slice(1)) await effekt.delete();
        }
        return;
    }

    for (const effekt of existing) {
        if (effekt.getFlag("dsk", "autoVerknuepfung")) await effekt.delete();
    }
};

// ============================================================
// === BLOCK 9 — GM-ANFRAGEN ==================================
// ============================================================

DSK.GMAnfrage = DSK.GMAnfrage || {};

// +++ 9.1 - FLAG-SCHLÜSSEL ++++++++++++++++++++++++++++++++++++
DSK.GMAnfrage.FlagKey = function(name, prefix = "pending") {
    return `${prefix}${String(name || "Anfrage").replace(/[^a-zA-Z0-9]/g, "")}`;
};

// +++ 9.2 - SPEICHERN / LESEN / LÖSCHEN +++++++++++++++++++++++
DSK.GMAnfrage.Speichern = async function(actor, key, daten) {
    if (!actor || !key) return false;
    await actor.setFlag("world", key, foundry.utils.deepClone(daten || {}));
    return true;
};

DSK.GMAnfrage.Lesen = function(actor, key) {
    return (!actor || !key) ? null : actor.getFlag("world", key) || null;
};

DSK.GMAnfrage.Loeschen = async function(actor, key) {
    if (!actor || !key || actor.getFlag("world", key) === undefined) return false;
    await actor.unsetFlag("world", key);
    return true;
};

// +++ 9.3 - OFFENE ANFRAGEN FINDEN ++++++++++++++++++++++++++++
DSK.GMAnfrage.Finden = function(key) {
    if (!key) return [];

    const gefunden = new Map();
    for (const actor of game.actors) {
        if (actor.getFlag("world", key) !== undefined) gefunden.set(actor.uuid, actor);
    }

    for (const token of canvas.tokens?.placeables || []) {
        if (token.actor?.getFlag("world", key) !== undefined) gefunden.set(token.actor.uuid, token.actor);
    }

    return Array.from(gefunden.values());
};

// ============================================================
// === BLOCK 10 — EFFEKT-WARTESCHLANGE =========================
// === GM-VERARBEITUNG + EINE GEMEINSAME KARTE =================
// ============================================================

DSK.Warteschlange = DSK.Warteschlange || {};

// +++ 10.1 - SCHLÜSSEL + EFFEKTCONFIG +++++++++++++++++++++++++
DSK.Warteschlange._FlagKey = function(gabenName) {
    return "pendingSegen_" + String(gabenName || "Ahnengabe").replace(/[^a-zA-Z0-9]/g, "");
};

DSK.Warteschlange._EffektConfig = function(ziel = {}, config = {}) {
    const { casterActor, gabenName = "Ahnengabe", ahne = "Ahne", basisBeschreibung = "", qs = 1 } = config;

    return {
        name: ziel.name || gabenName, ahne: ziel.ahne || ahne,
        beschreibung: ziel.beschreibung || basisBeschreibung, gabeZiel: ziel.gabeZiel ?? "",
        qs: ziel.qs ?? qs, formel: ziel.formel ?? "qs",
        skills: foundry.utils.deepClone(ziel.skills || []), key: ziel.key || "system.skillModifiers.FP",
        changes: ziel.changes == null ? null : foundry.utils.deepClone(ziel.changes),
        flags: ziel.flags ? foundry.utils.deepClone(ziel.flags) : null,
        duration: ziel.duration ? foundry.utils.deepClone(ziel.duration) : null,
        statuses: Array.isArray(ziel.statuses) ? foundry.utils.deepClone(ziel.statuses) : null,
        origin: ziel.origin || casterActor?.uuid || null,
        showIcon: ziel.showIcon ?? 1,
        disabled: Boolean(ziel.disabled), transfer: Boolean(ziel.transfer),
        type: ziel.type || "base"
    };
};

DSK.Warteschlange._ZielDaten = function(ziel = {}, config = {}) {
    return {
        id: ziel.actor?.id || null, uuid: ziel.actor?.uuid || null,
        tokenName: ziel.tokenName || ziel.actor?.name || "Unbekannt",
        rolleText: ziel.rolleText || "Ziel",
        effekt: this._EffektConfig(ziel, config)
    };
};

// +++ 10.2 - ANFRAGE ERSTELLEN ++++++++++++++++++++++++++++++++
DSK.Warteschlange.Beantragen = async function(config = {}) {
    const {
        casterActor, casterToken, ziele = [], misserfolge = [],
        gabenName = "Ahnengabe", ahne = "Ahne", basisBeschreibung = "",
        qs = 1, dauerText = "", macroUuid = null
    } = config;

    if (!casterActor || !casterToken || !ziele.length) {
        ui.notifications.warn("Luna sagt 🌙: Wirkender, Token oder Ziele fehlen!");
        return false;
    }

    const needsGM = !game.user.isGM && ziele.some(ziel => ziel.actor && !ziel.actor.isOwner);
    const flagKey = this._FlagKey(gabenName);
    const kartenziele = ziele.filter(ziel => ziel.actor?.uuid !== casterActor.uuid)
        .map(ziel => ({ name: ziel.tokenName || ziel.actor?.name || "Unbekannt", rolle: ziel.rolleText || "Ziel" }));

    const gmLink = DSK.GabenUI.GMMakroButton(
        macroUuid, "Effekt anwenden",
        "Das Makro muss durch die Spielleitung ausgeführt werden."
    );

    const nachricht = await DSK.GabenUI.AnfrageKarteErstellen({
        gabenName, ahne, beschreibung: basisBeschreibung,
        wirkender: DSK.ResolveTokenName(casterActor), ziele: kartenziele,
        misserfolge: foundry.utils.deepClone(misserfolge), dauerText,
        gmLink, gmBereich: needsGM, anfragenderUserId: game.user.id
    });

    if (!nachricht) {
        ui.notifications.error("Luna sagt 🌙: Die Wirkungskarte konnte nicht erstellt werden!");
        return false;
    }

    if (!needsGM) {
        return Boolean(await this._WendeEffekteAn({
            ...config, messageId: nachricht.id,
            misserfolge: foundry.utils.deepClone(misserfolge)
        }));
    }

    await DSK.GMAnfrage.Speichern(casterActor, flagKey, {
        ziele: ziele.map(ziel => this._ZielDaten(ziel, config)),
        misserfolge: foundry.utils.deepClone(misserfolge),
        casterTokenId: casterToken.id,
        casterTokenUuid: casterToken.document?.uuid || casterToken.uuid || null,
        qs, gabenName, ahne, basisBeschreibung, dauerText,
        messageId: nachricht.id, anfragenderUserId: game.user.id,
        sceneId: canvas.scene?.id || null
    });

    ui.notifications.info("Luna sagt 🌙: Die Effektanwendung wurde bei der Spielleitung beantragt.");
    return false;
};

// +++ 10.3 - GM-ANFRAGE VERARBEITEN ++++++++++++++++++++++++++
DSK.Warteschlange.Verarbeiten = async function(gabenName) {
    if (!game.user.isGM) return false;

    const flagKey = this._FlagKey(gabenName);
    const pendingActors = DSK.GMAnfrage.Finden(flagKey);
    if (!pendingActors.length) return false;

    let wurdeVerarbeitet = false;

    for (const casterActor of pendingActors) {
        const daten = DSK.GMAnfrage.Lesen(casterActor, flagKey);
        if (!daten) continue;

        if (daten.sceneId && daten.sceneId !== canvas.scene?.id) {
            ui.notifications.warn(`Luna sagt 🌙: Die Anfrage von „${casterActor.name}“ gehört zu einer anderen Szene.`);
            continue;
        }

        const casterToken = DSK.Token.Finde(casterActor, daten.casterTokenId, daten.casterTokenUuid);
        if (!casterToken) {
            ui.notifications.warn(`Luna sagt 🌙: Der Token von „${casterActor.name}“ wurde nicht gefunden!`);
            continue;
        }

        const zieleBereit = [];

        for (const zielDaten of daten.ziele || []) {
            let zielActor = null;

            if (zielDaten.uuid) {
                try {
                    const doc = await fromUuid(zielDaten.uuid);
                    zielActor = doc?.documentName === "Token" ? doc.actor : doc;
                } catch {}
            }

            if (!zielActor && zielDaten.id) {
                zielActor = game.actors.get(zielDaten.id) ||
                    canvas.tokens?.placeables?.find(token => token.actor?.id === zielDaten.id)?.actor || null;
            }

            if (!zielActor) continue;

            zieleBereit.push({
                actor: zielActor,
                tokenName: zielDaten.tokenName || DSK.ResolveTokenName(zielActor),
                rolleText: zielDaten.rolleText || "Ziel",
                effekt: foundry.utils.deepClone(zielDaten.effekt || {})
            });
        }

        if (zieleBereit.length !== (daten.ziele || []).length) {
            ui.notifications.warn(`Luna sagt 🌙: Nicht alle Ziele für „${casterActor.name}“ wurden gefunden!`);
            continue;
        }

        const erfolgreich = await this._WendeEffekteAn({
            casterActor, casterToken, ziele: zieleBereit,
            misserfolge: foundry.utils.deepClone(daten.misserfolge || []),
            qs: daten.qs, gabenName: daten.gabenName, ahne: daten.ahne,
            basisBeschreibung: daten.basisBeschreibung, dauerText: daten.dauerText,
            messageId: daten.messageId
        });

        if (erfolgreich) {
            await DSK.GMAnfrage.Loeschen(casterActor, flagKey);
            wurdeVerarbeitet = true;
        }
    }

    return wurdeVerarbeitet;
};

// +++ 10.4 - EFFEKTE ÜBER BLOCK 6 ANWENDEN ++++++++++++++++++++
DSK.Warteschlange._WendeEffekteAn = async function(config = {}) {
    const {
        casterActor, ziele = [], misserfolge: gespeicherteMisserfolge = [],
        gabenName = "Ahnengabe", ahne = "Ahne", basisBeschreibung = "",
        qs = 1, dauerText = "", messageId = null
    } = config;

    if (!casterActor || !ziele.length) return false;

    const erfolge = [], misserfolge = foundry.utils.deepClone(gespeicherteMisserfolge);

    for (const ziel of ziele) {
        try {
            const basisConfig = ziel.effekt
                ? foundry.utils.deepClone(ziel.effekt)
                : this._EffektConfig(ziel, config);

            basisConfig.name ||= gabenName; basisConfig.ahne ||= ahne;
            basisConfig.beschreibung ||= basisBeschreibung; basisConfig.gabeZiel ??= "";
            basisConfig.qs ??= qs; basisConfig.origin ||= casterActor.uuid;
            basisConfig.showIcon ??= 1; basisConfig.type ||= "base"; basisConfig.ziel = ziel.actor;

            const externeFlags = foundry.utils.deepClone(basisConfig.flags || {});
            basisConfig.flags = {
                ...externeFlags,
                dsk: { casterUuid: casterActor.uuid, qs: Number(qs) || 1, ...(externeFlags.dsk || {}) }
            };

            if (ziel.rolleText) basisConfig.beschreibung += `<br><hr><b>Rolle in dieser Verbindung:</b> ${ziel.rolleText}`;

            const effekt = await DSK.Effekt.Anwenden(basisConfig);
            if (!effekt) throw new Error("Block 6 hat keinen Effekt zurückgegeben.");

            if (ziel.actor.uuid !== casterActor.uuid) {
                erfolge.push({ name: ziel.tokenName || DSK.ResolveTokenName(ziel.actor), rolle: ziel.rolleText || "Ziel" });
            }
        } catch (error) {
            console.error("Luna sagt 🌙: Effekt konnte nicht angewendet werden.", { ziel, error });
            misserfolge.push({ name: ziel.tokenName || ziel.actor?.name || "Unbekannt", rolle: ziel.rolleText || "Ziel" });
        }
    }

    const erfolgreich = erfolge.length > 0 || ziele.every(ziel => ziel.actor?.uuid === casterActor.uuid);

    if (messageId) {
        await DSK.GabenUI.AnfrageKarteAktualisieren({
            messageId, gabenName, ahne, beschreibung: basisBeschreibung,
            wirkender: DSK.ResolveTokenName(casterActor),
            ziele: erfolge, misserfolge, dauerText, erfolgreich
        });
    } else {
        await DSK.GabenUI.AnfrageKarteErstellen({
            gabenName, ahne, beschreibung: basisBeschreibung,
            wirkender: DSK.ResolveTokenName(casterActor),
            ziele: erfolge, misserfolge, dauerText,
            gmBereich: false, angewendet: true, erfolgreich
        });
    }

    return erfolgreich;
};

// ============================================================
// === BLOCK 11 — UI, GABENKARTEN & DIALOGE ====================
// ============================================================

// +++ 11.1 - ALLGEMEINE UI-BAUSTEINE +++++++++++++++++++++++++
DSK.UI = DSK.UI || {};

DSK.UI.Button = function(type, label, extra = "") {
    const big = "background:linear-gradient(#76301b,#582617);color:#f8f6f5;border:1px solid #000;border-radius:4px;font-weight:bold;padding:3px 6px;font-size:11px;cursor:pointer;width:80px;text-align:center;";
    const small = "background:#5a3b2a;color:#fff;border:1px solid #000;border-radius:3px;font-weight:bold;cursor:pointer;width:20px;height:20px;font-size:12px;line-height:20px;text-align:center;padding:0;";
    return `<button type="button" style="${type === "big" ? big : small}" ${extra}>${label}</button>`;
};

DSK.UI.DescriptionToggle = function(text) {
    return `<div style="margin-top:6px;"><span class="desc-toggle" style="cursor:pointer;font-size:.9em;color:#333;font-weight:bold;"><span class="arrow">▶</span> Beschreibung</span><div class="desc-content" style="display:none;font-size:.9em;color:#222;margin-top:4px;padding:8px 10px;">${text}</div></div>`;
};

DSK.UI.SubHeader = function(text) {
    return `<p style="text-align:center;font-size:.95em;color:#555;margin-top:-6px;margin-bottom:10px;">${text}</p>`;
};

DSK.UI.Box = function(type, content) {
    return type === "dskbox1" ? `<div class="dskbox1">${content}</div>` : `<div class="dskbox2" style="margin-top:10px;">${content}</div>`;
};

DSK.UI.List = function(items = []) {
    return `<ul class="dsklist">${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
};

DSK.UI.Header = function(title, resolvedSymbol) {
    const imgHtml = resolvedSymbol ? `<img src="${resolvedSymbol}" style="width:28px; border:none; background:transparent; flex-shrink:0;">` : "";
    return `<div class="dskbox1"><p style="display:flex; gap:8px; align-items:center; margin:0;"><span style="white-space:nowrap; display:flex; align-items:center; gap:8px;">${imgHtml}<b>Ahnengabe</b></span></p><hr style="margin:4px 0; border:0; border-top:1px solid #c9bca6;"><p style="font-weight:bold; margin-top:6px; margin-bottom:0;">${title}</p></div>`;
};

DSK.UI.Section = function(title, content) {
    return `<div class="dskbox1"><p style="font-weight:bold;">${title}</p></div><div class="dskbox2" style="margin-top:10px;">${content}</div>`;
};

DSK.UI.Icon = function(path, size = 32) {
    return `<img src="${path}" width="${size}" height="${size}" style="border:none;border-radius:4px;background:transparent;">`;
};

// +++ 11.2 - GABEN-UI GRUNDLAGEN ++++++++++++++++++++++++++++++
DSK.GabenUI = DSK.GabenUI || {};

DSK.GabenUI.ButtonStyle = function() {
    return "width:100%;cursor:pointer;padding:6px;background:linear-gradient(#76301b,#582617);color:#f8f6f5;border:1px solid #000;border-radius:3px;font-weight:bold;text-align:center;";
};

DSK.GabenUI.Details = function({ titel = "Gabenwirkung Information", inhalt = "", zentriert = true } = {}) {
    return `<details style="cursor:pointer;text-align:left;"><summary style="font-weight:bold;color:#76301b;${zentriert ? "text-align:center;" : ""}">${titel}</summary><div style="margin-top:6px;padding:6px 8px;background:rgba(0,0,0,.03);border-radius:3px;line-height:1.4;">${inhalt}</div></details>`;
};

DSK.GabenUI.MakroLink = function(macroUuid, label = "Effekt anwenden", fallbackText = "Das Makro muss manuell ausgeführt werden.") {
    return macroUuid ? `@UUID[${macroUuid}]{</> ${label}}` : `<span style="color:#B30000;">${fallbackText}</span>`;
};

DSK.GabenUI.GMMakroButton = function(macroUuid, label = "Effekt anwenden", fallbackText = "Das Makro muss durch die Spielleitung ausgeführt werden.") {
    if (!macroUuid) return `<span style="color:#B30000;">${fallbackText}</span>`;
    return `<button type="button" class="dsk-btn-gm-makro" data-macro-uuid="${macroUuid}" style="${this.ButtonStyle()}"><i class="fas fa-play"></i> ${label}</button>`;
};

// +++ 11.3 - ZONENBUTTON & VERBORGENER GM-BEREICH +++++++++++++
DSK.GabenUI.EffektButton = function({ templateId = "", zielEffektName = "", ahne = "Zerzal", effektData = {} } = {}) {
    if (!templateId || !zielEffektName) return "";
    const daten = typeof effektData === "string" ? effektData : encodeURIComponent(JSON.stringify(effektData || {}));
    return `<button type="button" class="dsk-btn-apply" data-template-id="${templateId}" data-ziel-effekt="${zielEffektName}" data-ahne="${ahne}" data-effekt-data="${daten}" style="${this.ButtonStyle()}"><i class="fas fa-play"></i> Effekte aktivieren</button>`;
};

DSK.GabenUI.GMEffektBereich = function({
    templateId = "", zielEffektName = "", ahne = "Zerzal", effektData = {},
    hinweis = "Wähle die betroffenen Token auf der Karte aus."
} = {}) {
    const button = this.EffektButton({ templateId, zielEffektName, ahne, effektData });
    if (!button) return "";

    return `<section class="secret"><hr><div style="text-align:center;"><p style="margin:0 0 6px;color:#76301b;font-weight:bold;">Gabenwirkung Information (Nur SL)</p><p style="margin:0 0 6px;font-size:.82em;color:#555;">${hinweis}</p><div style="display:flex;justify-content:center;margin-top:6px;">${button}</div></div></section>`;
};

// +++ 11.4 - WIRKENDER, ZIELE & MISSERFOLGE ++++++++++++++++++
DSK.GabenUI.ZielBereich = function({ wirkender = "", ziele = [], misserfolge = [] } = {}) {
    const wirkenderHtml = wirkender
        ? `<p style="margin:0 0 4px;text-align:left;"><b>Wirkender:</b></p>${DSK.UI.List([wirkender])}`
        : "";

    const rollenMap = new Map();
    for (const ziel of ziele) {
        const name = typeof ziel === "string" ? ziel : ziel?.name || "Unbekannt";
        const rolle = typeof ziel === "string" ? "Ziel" : ziel?.rolle || "Ziel";
        if (!rollenMap.has(rolle)) rollenMap.set(rolle, []);
        rollenMap.get(rolle).push(name);
    }

    let zielHtml = "";
    for (const [rolle, namen] of rollenMap.entries()) {
        const eindeutigeNamen = [...new Set(namen)];
        zielHtml += `<p style="margin:8px 0 4px;text-align:left;"><b>${rolle}:</b></p>${DSK.UI.List(eindeutigeNamen)}`;
    }

    const fehlerHtml = misserfolge.length
        ? `<hr><p style="text-align:center;color:#B30000;font-weight:bold;">Misserfolg</p>${DSK.UI.List(
            misserfolge.map(ziel => typeof ziel === "string" ? ziel : ziel?.name || "Unbekannt")
        )}`
        : "";

    return wirkenderHtml + zielHtml + fehlerHtml;
};

// +++ 11.5 - GEMEINSAMER KARTENINHALT +++++++++++++++++++++++++
DSK.GabenUI.AnfrageKartenInhalt = function({
    gabenName = "Ahnengabe", ahne = "Ahne", beschreibung = "", wirkender = "",
    ziele = [], misserfolge = [], dauerText = "", gmLink = "", gmBereich = false,
    gmEffekt = null, angewendet = false, erfolgreich = false
} = {}) {
    const statusHtml = angewendet ? `<p style="text-align:center;color:${erfolgreich ? "#18940F" : "#B30000"};font-weight:bold;">${erfolgreich ? "Erfolg" : "Misserfolg"}</p>` : "";
    const beschreibungHtml = beschreibung ? `${this.Details({ inhalt: beschreibung })}<hr>` : "";
    const dauerHtml = dauerText ? `<hr><p style="text-align:center;margin-bottom:0;"><b>Wirkungsdauer:</b> ${dauerText}</p>` : "";

    let gmHtml = "";
    if (gmBereich && !angewendet) {
        gmHtml = gmEffekt
            ? this.GMEffektBereich({
                templateId: gmEffekt.templateId, zielEffektName: gmEffekt.zielEffektName,
                ahne: gmEffekt.ahne || ahne, effektData: gmEffekt.effektData || {},
                hinweis: gmEffekt.hinweis || "Wähle die betroffenen Token auf der Karte aus."
            })
            : `<section class="secret"><hr><div style="text-align:center;"><p style="margin:0 0 6px;color:#76301b;font-weight:bold;">Gabenwirkung Information (Nur SL)</p><p style="margin:0 0 6px;font-size:.82em;color:#555;">Es ist keine erneute Target-Auswahl nötig.</p><div style="display:flex;justify-content:center;margin-top:6px;">${gmLink}</div></div></section>`;
    }

    return `${DSK.UI.Header(gabenName, DSK.Symbol(ahne))}<div class="dskbox2" style="margin-top:10px;">${beschreibungHtml}${statusHtml}${this.ZielBereich({ wirkender, ziele, misserfolge })}${dauerHtml}${gmHtml}</div>`;
};

// +++ 11.6 - KARTE ERSTELLEN & AKTUALISIEREN +++++++++++++++++
DSK.GabenUI.AnfrageKarteErstellen = async function({
    gabenName = "Ahnengabe", ahne = "Ahne", beschreibung = "", wirkender = "",
    ziele = [], misserfolge = [], dauerText = "", gmLink = "", gmBereich = false,
    gmEffekt = null, angewendet = false, erfolgreich = false, anfragenderUserId = null
} = {}) {
    return ChatMessage.create({
        speaker: { alias: "System" },
        flags: { dsk: { gabenAnfrage: true, gabenName, angewendet: Boolean(angewendet), anfragenderUserId } },
        content: this.AnfrageKartenInhalt({
            gabenName, ahne, beschreibung, wirkender, ziele, misserfolge,
            dauerText, gmLink, gmBereich, gmEffekt, angewendet, erfolgreich
        })
    });
};

DSK.GabenUI.AnfrageKarteAktualisieren = async function({
    messageId, gabenName = "Ahnengabe", ahne = "Ahne", beschreibung = "",
    wirkender = "", ziele = [], misserfolge = [], dauerText = "", erfolgreich = true
} = {}) {
    const message = game.messages.get(messageId);
    if (!message) return false;

    await message.update({
        content: this.AnfrageKartenInhalt({
            gabenName, ahne, beschreibung, wirkender, ziele, misserfolge,
            dauerText, gmBereich: false, angewendet: true, erfolgreich
        }),
        "flags.dsk.angewendet": true
    });

    return true;
};

// +++ 11.7 - GM-MAKROBUTTON-LISTENER ++++++++++++++++++++++++++
DSK.GabenUI.InitGMMakroButton = function() {
    if (globalThis._dskGabenGMMakroButtonListener) document.removeEventListener("click", globalThis._dskGabenGMMakroButtonListener);

    globalThis._dskGabenGMMakroButtonListener = async event => {
        const button = event.target.closest(".dsk-btn-gm-makro");
        if (!button) return;

        event.preventDefault(); event.stopPropagation();
        if (!game.user.isGM) return ui.notifications.warn("Luna sagt 🌙: Nur die Spielleitung kann den Effekt anwenden!");
        if (button.disabled || button.dataset.processing === "true") return;
        button.dataset.processing = "true";

        try {
            const macroUuid = button.dataset.macroUuid;
            if (!macroUuid) throw new Error("Keine Makro-UUID am GM-Button gefunden.");

            const macro = await fromUuid(macroUuid);
            if (!macro?.execute) throw new Error("Das hinterlegte Gabenmakro wurde nicht gefunden.");
            await macro.execute();
        } catch (error) {
            console.error("DSK.GabenUI.GMMakroButton: Makroausführung fehlgeschlagen.", error);
            ui.notifications.error("Luna sagt 🌙: Das Gabenmakro konnte nicht ausgeführt werden!");
        } finally {
            button.dataset.processing = "false";
        }
    };

    document.addEventListener("click", globalThis._dskGabenGMMakroButtonListener);
};

// +++ 11.8 - KLEINER GM-AUFDECKBUTTON +++++++++++++++++++++++++
DSK.GabenUI.InitGMGeheimButton = function() {
    if (globalThis._dskGabenGMGeheimButtonHook) Hooks.off("renderChatMessageHTML", globalThis._dskGabenGMGeheimButtonHook);

    globalThis._dskGabenGMGeheimButtonHook = Hooks.on("renderChatMessageHTML", (message, html) => {
        if (message.getFlag("dsk", "gabenAnfrage") !== true) return;

        const container = html?.querySelectorAll ? html : html?.[0];
        if (!container) return;

        for (const button of container.querySelectorAll("button")) {
            if (button.classList.contains("dsk-btn-apply") || button.classList.contains("dsk-btn-gm-makro")) continue;

            const text = String(button.textContent || "").trim().toLowerCase();
            if (!text.includes("aufdecken") && !text.includes("reveal")) continue;

            button.textContent = "GM"; button.title = "GM-Bereich anzeigen";
            Object.assign(button.style, {
                width: "auto", minWidth: "0", height: "auto", padding: "0 3px",
                margin: "2px 0 0", fontSize: "7px", lineHeight: "10px",
                opacity: "0.32", borderRadius: "2px", boxShadow: "none"
            });
        }
    });
};

// +++ 11.9 - BESCHREIBUNGS-TOGGLE +++++++++++++++++++++++++++++
DSK.UI.InitDescriptionToggle = function() {
    if (globalThis._dskDescriptionToggleListener) document.removeEventListener("click", globalThis._dskDescriptionToggleListener);

    globalThis._dskDescriptionToggleListener = event => {
        const toggle = event.target.closest(".desc-toggle");
        if (!toggle) return;

        const content = toggle.parentElement?.querySelector(".desc-content");
        const arrow = toggle.querySelector(".arrow");
        if (!content) return;

        const offen = content.style.display !== "none";
        content.style.display = offen ? "none" : "block";
        if (arrow) arrow.textContent = offen ? "▶" : "▼";
    };

    document.addEventListener("click", globalThis._dskDescriptionToggleListener);
};

// +++ 11.10 - DIALOGE & WHISPER +++++++++++++++++++++++++++++++
DSK.Dialog = DSK.Dialog || {};

DSK.Dialog.Auswahl = function(titel, inhalt, callback) {
    const dialog = new Dialog({
        title: titel, content: inhalt, buttons: {},
        render: html => {
            const container = html instanceof jQuery ? html[0] : html;
            const button = container?.querySelector("#dlgApply");
            if (button) button.addEventListener("click", () => { callback(html); dialog.close(); });
        }
    }, { width: 520, height: 650 });

    dialog.render(true);
};

DSK.Dialog._WhisperZiele = function(actor) {
    return DSK.Empfaenger.GMUndBesitzer(actor);
};

DSK.Dialog.Whisper = function(actor, titelDerGabe, symbolPfad, actorName, liste) {
    const symbol = DSK.Symbol(symbolPfad || titelDerGabe);
    return ChatMessage.create({
        whisper: this._WhisperZiele(actor), speaker: { alias: "System" },
        content: `${DSK.UI.Header(`${titelDerGabe}<br>Information`, symbol)}<div class="dskbox2" style="margin-top:10px;"><p><b>${actorName}</b> hat folgende Auswahl getroffen:</p>${DSK.UI.List((liste || []).map(e => `<b>${e}</b>`))}<hr><p style="text-align:center;font-style:italic;font-size:.9em;color:#555;">Die Auswahl wurde aufgrund deiner Beschreibung getroffen.</p></div>`
    });
};

DSK.Dialog.WhisperText = function(actor, titelDerGabe, symbolPfad, text) {
    return ChatMessage.create({
        whisper: this._WhisperZiele(actor), speaker: { alias: "System" },
        content: `${DSK.UI.Header(titelDerGabe, DSK.Symbol(symbolPfad || titelDerGabe))}<div class="dskbox2" style="margin-top:10px;">${text}</div>`
    });
};

DSK.Dialog.WhisperKompaktAuswahl = function(actor, titelDerGabe, symbolPfad, kategorienObjekt = {}) {
    let inhalt = `<p><b>Folgende Optionen standen im Umkreis zur Auswahl:</b></p><br>`;

    for (const [titel, elemente] of Object.entries(kategorienObjekt)) {
        inhalt += `<p><b>${titel}:</b></p>`;
        inhalt += elemente?.length
            ? DSK.UI.List(elemente)
            : `<p style="font-style:italic;color:#777;margin-bottom:6px;">Keine Optionen</p>`;
    }

    return ChatMessage.create({
        whisper: this._WhisperZiele(actor), speaker: { alias: "System" },
        content: `${DSK.UI.Header(`${titelDerGabe}<br>Auswahl Information`, DSK.Symbol(symbolPfad || titelDerGabe))}<div class="dskbox2" style="margin-top:10px;">${inhalt}<hr><p style="text-align:center;font-style:italic;font-size:.9em;color:#555;">Teile deiner Spielleitung die Auswahl mit, damit sie fortfahren kann.</p></div>`
    });
};

// ============================================================
// === BLOCK 12 — SCHADEN & ANGRIFFSREAKTIONEN =================
// === PARALLELE REAKTIONEN + PROBENWAFFENERKENNUNG ============
// ============================================================

const _dskAlterAngriffswaechter = DSK.Schaden?.Angriffswaechter || null;
DSK.Schaden = DSK.Schaden || {};

// +++ 12.1 - TEXT- UND NAMENSHELFER +++++++++++++++++++++++++++
DSK.Schaden.HtmlZuText = function(html = "") {
    const temp = document.createElement("div"); temp.innerHTML = String(html || "");
    return String(temp.textContent || temp.innerText || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
};

DSK.Schaden.NormalisiereName = function(name = "") {
    return String(name || "").toLowerCase().replace(/\u00a0/g, " ").replace(/[„“"']/g, "").replace(/\s+/g, " ").trim();
};

DSK.Schaden.EntferneNummerierung = function(name = "") {
    return String(name || "").replace(/\s*\(\d+\)\s*$/i, "").trim();
};

// +++ 12.2 - ANGRIFF AUS CHAT LESEN +++++++++++++++++++++++++++
DSK.Schaden.LeseAngriff = function(message) {
    const rawText = [String(message?.flavor || ""), String(message?.content || "")].join(" ");
    const text = this.HtmlZuText(rawText);
    const match = text.match(/(.+?)\s+gewinnt gegen\s+(.+?)(?=\s+Trefferpunkte\s*:|$)/i);
    if (!match?.[1] || !match?.[2]) return null;

    let schaden = 0;
    const endwerte = Array.from(text.matchAll(/=\s*(\d+)/g));
    if (endwerte.length) schaden = Number(endwerte.at(-1)?.[1]) || 0;
    if (schaden <= 0) schaden = Number(text.match(/Trefferpunkte\s*:\s*(\d+)/i)?.[1]) || 0;
    if (schaden <= 0 && message?.flags?.dsk?.damage !== undefined) schaden = Number(message.flags.dsk.damage) || 0;

    return {
        angreiferName: String(match[1]).trim(), verteidigerName: String(match[2]).trim(),
        schaden: Math.max(0, Math.floor(schaden)), text, rawText
    };
};

// +++ 12.3 - AKTEUR FINDEN UND LADEN ++++++++++++++++++++++++++
DSK.Schaden.FindeActor = function(name = "", excludeActorId = null) {
    const gesucht = this.NormalisiereName(name), basis = this.NormalisiereName(this.EntferneNummerierung(name));
    if (!gesucht) return null;

    const tokens = canvas.tokens?.placeables || [];
    let token = tokens.find(t => t.actor && t.actor.id !== excludeActorId && this.NormalisiereName(t.name) === gesucht);
    if (!token) token = tokens.find(t => t.actor && t.actor.id !== excludeActorId && this.NormalisiereName(t.actor.name) === gesucht);
    if (!token) token = tokens.find(t => {
        if (!t.actor || t.actor.id === excludeActorId) return false;
        const tokenBasis = this.NormalisiereName(this.EntferneNummerierung(t.name));
        const actorBasis = this.NormalisiereName(this.EntferneNummerierung(t.actor.name));
        return tokenBasis === basis || actorBasis === basis;
    });
    if (token?.actor) return { actor: token.actor, token, name: token.name || token.actor.name };

    const actor = game.actors.find(a => {
        if (a.id === excludeActorId) return false;
        const actorName = this.NormalisiereName(a.name);
        const actorBasis = this.NormalisiereName(this.EntferneNummerierung(a.name));
        return actorName === gesucht || actorBasis === basis;
    });

    return actor ? { actor, token: actor.getActiveTokens?.()?.[0] || null, name: actor.name } : null;
};

DSK.Schaden.LadeActor = async function(uuid) {
    if (!uuid) return null;
    try {
        const doc = await fromUuid(uuid);
        return doc?.documentName === "Token" ? doc.actor : doc || null;
    } catch { return null; }
};

DSK.Schaden.IstAktiverGM = function() {
    const gms = game.users.filter(u => u.isGM && u.active).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return Boolean(gms[0] && game.user.id === gms[0].id);
};

// +++ 12.4 - LEP UND SCHADENSBERECHNUNG +++++++++++++++++++++++
DSK.Schaden.LeP = function(actor) {
    return Math.max(0, Number(actor?.system?.stats?.LeP?.value) || 0);
};

DSK.Schaden.ZieheLePAb = async function(actor, schaden, minimumLeP = 0) {
    if (!actor) throw new Error("Kein Akteur für Schadensanwendung.");

    const vorher = this.LeP(actor), minimum = Math.max(0, Math.floor(Number(minimumLeP) || 0));
    const gewuenscht = Math.max(0, Math.floor(Number(schaden) || 0)), maximal = Math.max(0, vorher - minimum);
    const tatsaechlich = Math.min(gewuenscht, maximal), nachher = Math.max(minimum, vorher - tatsaechlich);

    if (tatsaechlich > 0) await actor.update({ "system.stats.LeP.value": nachher });

    return {
        vorher, nachher, schaden: tatsaechlich, gewuenschterSchaden: gewuenscht,
        verpufft: Math.max(0, gewuenscht - tatsaechlich), minimumLeP: minimum,
        limitErreicht: tatsaechlich < gewuenscht
    };
};

DSK.Schaden._BerechneWert = function(wert, modus, bonus, teiler) {
    const w = Math.max(0, Math.floor(Number(wert) || 0)), b = Math.max(0, Math.floor(Number(bonus) || 0));
    const t = Math.max(1, Math.floor(Number(teiler) || 1));
    if (modus === "addition") return w + b;
    if (modus === "teilen") return Math.floor(w / t);
    return w;
};

DSK.Schaden._BerechneAusInput = function(input) {
    return this._BerechneWert(input?.value, input?.dataset?.modus, input?.dataset?.bonus, input?.dataset?.teiler);
};

DSK.Schaden._BegrenzeSchaden = function(schaden, aktuelleLeP, minimumLeP = 0) {
    const gewuenscht = Math.max(0, Math.floor(Number(schaden) || 0));
    const leP = Math.max(0, Math.floor(Number(aktuelleLeP) || 0));
    const minimum = Math.max(0, Math.floor(Number(minimumLeP) || 0));
    return Math.min(gewuenscht, Math.max(0, leP - minimum));
};

// +++ 12.5 - UNIVERSELLE GM-SCHADENSKARTE +++++++++++++++++++++
DSK.Schaden.GMKarte = async function(config = {}) {
    if (!this.IstAktiverGM()) return null;

    const {
        key = "schaden", titel = "Schaden anwenden", ahne = "Ahne",
        zusammenfassung = "Schaden berechnen", beschreibung = "",
        modus = "fest", basis = 0, bonus = 0, teiler = 2, ziele = [],
        buttonText = "Schaden anwenden", bestaetigungsTitel = "Schaden angewendet",
        effektUuid = null, effektVerbrauchen = false, quelleUuid = null,
        abschlussText = null, limitText = null, vollTrefferText = null,
        lepDetailsVerbergen = false, regelDetailsVerbergen = false,
        minimumLeP = 0, vergleichsActorUuid = null,
        zielMussSchwaecherSein = false, grenzenTitel = "Schadensgrenze"
    } = config;

    if (key && key !== "schaden") {
        const vorhanden = game.messages.find(message =>
            message.getFlag("dsk", "schadensKarte") === true &&
            message.getFlag("dsk", "key") === key &&
            message.getFlag("dsk", "angewendet") !== true
        );
        if (vorhanden) return vorhanden;
    }

    const sichereZiele = ziele.filter(ziel => ziel?.uuid)
        .map(ziel => ({ uuid: ziel.uuid, name: ziel.name || "Unbekannt" }));
    if (!sichereZiele.length) return null;

    const basisWert = Math.max(0, Math.floor(Number(basis) || 0));
    const bonusWert = Math.max(0, Math.floor(Number(bonus) || 0));
    const teilerWert = Math.max(1, Math.floor(Number(teiler) || 1));
    const minimum = Math.max(0, Math.floor(Number(minimumLeP) || 0));
    const berechnet = this._BerechneWert(basisWert, modus, bonusWert, teilerWert);
    const zielVorschau = [];

    for (const ziel of sichereZiele) {
        const actor = await this.LadeActor(ziel.uuid), aktuelleLeP = this.LeP(actor);
        const tatsaechlich = this._BegrenzeSchaden(berechnet, aktuelleLeP, minimum);
        zielVorschau.push({
            ...ziel, aktuelleLeP, maximal: Math.max(0, aktuelleLeP - minimum),
            tatsaechlich, verpufft: Math.max(0, berechnet - tatsaechlich)
        });
    }

    const vergleichsActor = vergleichsActorUuid ? await this.LadeActor(vergleichsActorUuid) : null;
    const vergleichsLeP = this.LeP(vergleichsActor);
    const vergleichFehlgeschlagen = Boolean(zielMussSchwaecherSein && vergleichsActor) &&
        zielVorschau.some(ziel => ziel.aktuelleLeP >= vergleichsLeP);

    const suffix = `${key}-${foundry.utils.randomID()}-${Date.now()}`;
    const inputId = `dsk-schaden-input-${suffix}`, resultId = `dsk-schaden-result-${suffix}`;
    const buttonId = `dsk-schaden-button-${suffix}`, bereichId = `dsk-schaden-bereich-${suffix}`;
    const gmIds = game.users.filter(user => user.isGM && user.active).map(user => user.id);

    const zielListe = zielVorschau.map(ziel => `
        <p style="display:flex;justify-content:space-between;gap:8px;margin:5px 0;">
            <span><b>${ziel.name}</b>${lepDetailsVerbergen ? "" : `<br><span style="font-size:.82em;color:#555;">Aktuell: ${ziel.aktuelleLeP} LeP</span>`}</span>
            <span style="color:#b30000;font-weight:bold;white-space:nowrap;">−<span class="dsk-schaden-zielwert" data-result-id="${resultId}" data-ziel-lep="${ziel.aktuelleLeP}" data-minimum-lep="${minimum}">${ziel.tatsaechlich}</span> LeP</span>
        </p>`).join("");

    const inputBereich = modus === "fest"
        ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px;background:rgba(0,0,0,.05);border-radius:4px;margin:8px 0;"><span>Erkannter Schaden:</span><input id="${inputId}" class="dsk-schaden-input" type="number" value="${basisWert}" min="0" step="1" data-modus="${modus}" data-bonus="${bonusWert}" data-teiler="${teilerWert}" data-result-id="${resultId}" style="width:60px;text-align:center;font-weight:bold;"></div>`
        : `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px;background:rgba(0,0,0,.05);border-radius:4px;margin:8px 0;"><span>${modus === "addition" ? "Grundschaden:" : "Erkannter Schaden:"}</span><input id="${inputId}" class="dsk-schaden-input" type="number" value="${basisWert}" min="0" step="1" data-modus="${modus}" data-bonus="${bonusWert}" data-teiler="${teilerWert}" data-result-id="${resultId}" style="width:60px;text-align:center;font-weight:bold;"></div>
        ${modus === "addition" ? `<div style="display:flex;justify-content:space-between;gap:8px;padding:7px;background:rgba(0,0,0,.05);border-radius:4px;margin-bottom:8px;"><span>Zusatzschaden:</span><b>+${bonusWert} TP</b></div>` : ""}
        <div style="display:flex;justify-content:space-between;gap:8px;padding:7px;background:rgba(0,0,0,.05);border-radius:4px;margin-bottom:8px;"><span>${modus === "teilen" ? "Abgerundeter Anteil:" : "Gesamtschaden:"}</span><b><span id="${resultId}">${berechnet}</span> TP</b></div>`;

    const limitHtml = minimum > 0 && !regelDetailsVerbergen
        ? `<div style="margin:8px 0;padding:7px 9px;background:rgba(179,0,0,.08);border-left:3px solid #b30000;border-radius:3px;"><p style="margin:0 0 4px;color:#b30000;font-weight:bold;">${grenzenTitel}</p><p style="margin:0;font-size:.86em;">Das Ziel kann durch diese Schadensanwendung nicht unter <b>${minimum} LeP</b> sinken.</p></div>` : "";

    const vergleichHtml = zielMussSchwaecherSein && vergleichsActor && !regelDetailsVerbergen
        ? `<div style="margin:8px 0;padding:7px 9px;background:rgba(0,0,0,.05);border-radius:4px;"><p style="margin:0 0 4px;font-weight:bold;">LeP-Vergleich</p><p style="margin:0;font-size:.86em;">Wirkender: <b>${DSK.ResolveTokenName(vergleichsActor)}</b>${lepDetailsVerbergen ? "" : ` (${vergleichsLeP} LeP)`}</p>${vergleichFehlgeschlagen ? `<p style="margin:5px 0 0;color:#b30000;font-weight:bold;">Das Ziel besitzt nicht weniger LeP als der Wirkende.</p>` : `<p style="margin:5px 0 0;color:#18940F;font-weight:bold;">Das Ziel ist schwächer als der Wirkende.</p>`}</div>` : "";

    return ChatMessage.create({
        whisper: gmIds, speaker: { alias: "System" },
        flags: { dsk: {
            schadensKarte: true, angewendet: false, key, modus,
            basis: basisWert, bonus: bonusWert, teiler: teilerWert,
            ziele: sichereZiele, effektUuid, effektVerbrauchen, quelleUuid,
            bestaetigungsTitel, ahne, abschlussText, limitText, vollTrefferText,
            lepDetailsVerbergen: Boolean(lepDetailsVerbergen),
            regelDetailsVerbergen: Boolean(regelDetailsVerbergen),
            minimumLeP: minimum, vergleichsActorUuid,
            zielMussSchwaecherSein: Boolean(zielMussSchwaecherSein), grenzenTitel
        }},
        content: `<div style="font-family:'Signika',sans-serif;">
            ${DSK.UI.Header(titel, DSK.Symbol(ahne))}
            <div class="dskbox2" style="margin-top:10px;">

                ${beschreibung ? `<details style="cursor:pointer;margin:0 0 8px;">
                    <summary style="font-weight:bold;color:#76301b;font-size:12px;line-height:1.4;">Beschreibung</summary>
                    <div style="margin-top:8px;padding:6px 8px;background:rgba(0,0,0,.03);border-radius:4px;line-height:1.4;cursor:default;">${beschreibung}</div>
                </details>` : ""}

                <details id="${bereichId}" class="dsk-schaden-bereich" style="cursor:pointer;margin:0;" open>
                    <summary style="font-weight:bold;color:#76301b;font-size:12px;line-height:1.4;">${zusammenfassung}</summary>
                    <div style="margin-top:8px;cursor:default;">
                        ${inputBereich}${vergleichHtml}${limitHtml}
                        <hr>${zielListe}<hr>
                        <button id="${buttonId}" class="dsk-schaden-anwenden" type="button"
                            data-input-id="${inputId}" data-result-id="${resultId}" data-bereich-id="${bereichId}"
                            data-modus="${modus}" data-basis="${basisWert}" data-bonus="${bonusWert}" data-teiler="${teilerWert}"
                            style="${DSK.GabenUI?.ButtonStyle?.() || "width:100%;cursor:pointer;padding:6px;background:linear-gradient(#76301b,#582617);color:#f8f6f5;border:1px solid #000;border-radius:3px;font-weight:bold;text-align:center;"}"
                            ${vergleichFehlgeschlagen ? "disabled" : ""}>
                            ${vergleichFehlgeschlagen ? "Fehlgeschlagen – LeP-Voraussetzung" : buttonText}
                        </button>
                    </div>
                </details>

            </div>
        </div>`
    });
};

// +++ 12.6 - KARTE ERLEDIGEN + SCHADENSBEREICH ZUKLAPPEN +++++
DSK.Schaden._MarkiereErledigt = async function(message, button, text) {
    if (!message) return;

    const temp = document.createElement("div"); temp.innerHTML = message.content;
    const gespeicherterButton = temp.querySelector(`#${button.id}`);
    const bereichId = button.dataset.bereichId;
    const schadensBereich = bereichId ? temp.querySelector(`#${bereichId}`) : temp.querySelector(".dsk-schaden-bereich");

    if (gespeicherterButton) {
        gespeicherterButton.disabled = true;
        gespeicherterButton.style.opacity = "0.5";
        gespeicherterButton.style.cursor = "default";
        gespeicherterButton.innerHTML = text;
    }

    if (schadensBereich) schadensBereich.removeAttribute("open");

    await message.update({
        content: temp.innerHTML,
        "flags.dsk.angewendet": true
    });
};

// +++ 12.7 - SCHADENSKARTEN-LISTENER ++++++++++++++++++++++++++
DSK.Schaden.Init = function() {
    if (globalThis._dskSchadenInputListener) document.removeEventListener("input", globalThis._dskSchadenInputListener);
    if (globalThis._dskSchadenClickListener) document.removeEventListener("click", globalThis._dskSchadenClickListener);

    globalThis._dskSchadenInputListener = event => {
        const input = event.target.closest(".dsk-schaden-input");
        if (!input) return;

        const berechnet = DSK.Schaden._BerechneAusInput(input), resultId = input.dataset.resultId;
        if (!resultId) return;

        const resultElement = document.getElementById(resultId);
        if (resultElement) resultElement.textContent = String(berechnet);

        for (const element of document.querySelectorAll(`.dsk-schaden-zielwert[data-result-id="${resultId}"]`)) {
            element.textContent = String(DSK.Schaden._BegrenzeSchaden(
                berechnet, Number(element.dataset.zielLep), Number(element.dataset.minimumLep)
            ));
        }
    };

    globalThis._dskSchadenClickListener = async event => {
        const button = event.target.closest(".dsk-schaden-anwenden");
        if (!button) return;

        event.preventDefault();
        if (!game.user.isGM) return ui.notifications.warn("Luna sagt 🌙: Nur die Spielleitung kann diesen Schaden anwenden!");
        if (button.disabled || button.dataset.processing === "true") return;
        button.dataset.processing = "true";

        const messageId = button.closest("[data-message-id]")?.dataset?.messageId;
        const message = messageId ? game.messages.get(messageId) : null;

        try {
            if (!message) throw new Error("Die zugehörige Schadenskarte wurde nicht gefunden.");
            const flags = message.flags?.dsk || {};

            if (flags.angewendet) {
                button.disabled = true; button.style.opacity = "0.5";
                button.innerHTML = "Schaden bereits angewendet";
                return;
            }

            const modus = button.dataset.modus || flags.modus || "fest";
            const basis = Math.max(0, Math.floor(Number(button.dataset.basis ?? flags.basis) || 0));
            const bonus = Math.max(0, Math.floor(Number(button.dataset.bonus ?? flags.bonus) || 0));
            const teiler = Math.max(1, Math.floor(Number(button.dataset.teiler ?? flags.teiler) || 1));
            const input = document.getElementById(button.dataset.inputId);
            const eingabe = input ? Math.max(0, Math.floor(Number(input.value) || 0)) : basis;
            const berechnet = DSK.Schaden._BerechneWert(eingabe, modus, bonus, teiler);
            const minimumLeP = Math.max(0, Math.floor(Number(flags.minimumLeP) || 0));

            if (berechnet <= 0) {
                button.dataset.processing = "false";
                return ui.notifications.warn("Luna sagt 🌙: Es gibt keinen Schaden anzuwenden.");
            }

            if (flags.zielMussSchwaecherSein && flags.vergleichsActorUuid) {
                const vergleichsActor = await DSK.Schaden.LadeActor(flags.vergleichsActorUuid);
                if (!vergleichsActor) throw new Error("Der Vergleichsakteur wurde nicht gefunden.");
                const vergleichsLeP = DSK.Schaden.LeP(vergleichsActor);

                for (const ziel of flags.ziele || []) {
                    const zielActor = await DSK.Schaden.LadeActor(ziel.uuid);
                    if (!zielActor) continue;

                    if (DSK.Schaden.LeP(zielActor) >= vergleichsLeP) {
                        await DSK.Schaden._MarkiereErledigt(message, button, "Fehlgeschlagen – LeP-Voraussetzung");
                        await ChatMessage.create({
                            speaker: { alias: "System" },
                            content: `<div style="font-family:'Signika',sans-serif;">${DSK.UI.Header(flags.bestaetigungsTitel || "Schadensanwendung", DSK.Symbol(flags.ahne || "Aphasma"))}<div class="dskbox2" style="margin-top:10px;text-align:center;"><p style="color:#b30000;font-weight:bold;font-size:1.05em;">Die Schadensanwendung ist fehlgeschlagen.</p><p><b>${ziel.name}</b> besitzt nicht weniger Lebenspunkte als <b>${DSK.ResolveTokenName(vergleichsActor)}</b>.</p></div></div>`
                        });
                        return;
                    }
                }
            }

            const erfolge = [], erfolgsDaten = [];
            let gesamtAngewendet = 0;

            for (const ziel of flags.ziele || []) {
                const actor = await DSK.Schaden.LadeActor(ziel.uuid);
                if (!actor) continue;

                const result = await DSK.Schaden.ZieheLePAb(actor, berechnet, minimumLeP);
                gesamtAngewendet += result.schaden;
                erfolgsDaten.push({ name: ziel.name, limitErreicht: result.limitErreicht, schaden: result.schaden });

                let eintrag = `<b>${ziel.name}:</b> −${result.schaden} LeP`;
                if (!flags.lepDetailsVerbergen) eintrag += ` (${result.vorher} → ${result.nachher} LeP)`;

                if (result.limitErreicht) {
                    const text = flags.limitText || `<b>${flags.grenzenTitel || "Schadensgrenze"}:</b> ${result.verpufft} TP verfliegen wirkungslos.`;
                    eintrag += `<br><span style="font-size:.86em;color:#b30000;">${text}</span>`;
                }
                erfolge.push(eintrag);
            }

            if (flags.effektUuid && flags.effektVerbrauchen) {
                try {
                    const effekt = await fromUuid(flags.effektUuid);
                    if (effekt) await effekt.delete();
                } catch {}
            }

            await DSK.Schaden._MarkiereErledigt(message, button, `${gesamtAngewendet} LeP-Schaden angewendet`);

            if (erfolge.length) {
                const hatteLimit = erfolgsDaten.some(eintrag => eintrag.limitErreicht);
                const abschluss = hatteLimit ? flags.abschlussText : flags.vollTrefferText;
                const abschlussHtml = abschluss ? `<hr style="margin:8px 0;border:0;border-top:1px solid #c9bca6;"><p style="text-align:center;font-style:italic;color:#555;margin-bottom:0;">${abschluss}</p>` : "";

                await ChatMessage.create({
                    speaker: { alias: "System" },
                    content: `<div style="font-family:'Signika',sans-serif;">${DSK.UI.Header(flags.bestaetigungsTitel || "Schaden angewendet", DSK.Symbol(flags.ahne || "Rondra"))}<div class="dskbox2" style="margin-top:10px;"><p style="margin-bottom:6px;"><b>Ergebnis:</b></p>${DSK.UI.List(erfolge)}${abschlussHtml}</div></div>`
                });
            }
        } catch (error) {
            console.error("DSK Schaden Fehler:", error);
            button.dataset.processing = "false";
            ui.notifications.error("Luna sagt 🌙: Die Schadensanwendung konnte nicht abgeschlossen werden!");
        }
    };

    document.addEventListener("input", globalThis._dskSchadenInputListener);
    document.addEventListener("click", globalThis._dskSchadenClickListener);
};

// +++ 12.8 - ANGRIFFSWÄCHTER GRUNDDATEN +++++++++++++++++++++++
DSK.Schaden.Angriffswaechter = {
    _registry: _dskAlterAngriffswaechter?._registry instanceof Map ? _dskAlterAngriffswaechter._registry : new Map(),
    _verarbeiteteNachrichten: _dskAlterAngriffswaechter?._verarbeiteteNachrichten instanceof Map ? _dskAlterAngriffswaechter._verarbeiteteNachrichten : new Map(),
    _hookId: _dskAlterAngriffswaechter?._hookId || null
};

// +++ 12.9 - REAKTION REGISTRIEREN UND ENTFERNEN +++++++++++++++
DSK.Schaden.Angriffswaechter.Register = function(config = {}) {
    const {
        key = "schadensreaktion", actor = null, effektId = null, effektUuid = null,
        waffe = null, erlaubteWaffen = null, rolle = null, einmalig = false,
        protokollieren = false, beiErfolg = null, beiMisserfolg = null,
        beiFalscherWaffe = null
    } = config;

    if (!actor?.uuid) {
        console.warn("DSK.Schaden.Angriffswaechter.Register: Kein gültiger Akteur.", config);
        return null;
    }

    const waffen = [
        ...(Array.isArray(erlaubteWaffen) ? erlaubteWaffen : erlaubteWaffen ? [erlaubteWaffen] : []),
        ...(Array.isArray(waffe) ? waffe : waffe ? [waffe] : [])
    ].map(name => String(name || "").trim()).filter(Boolean);

    const eindeutigeWaffen = [...new Set(waffen)], rollenwert = String(rolle || "").toLowerCase();
    const sichereRolle = ["angreifer", "verteidiger", "beide"].includes(rollenwert)
        ? rollenwert : eindeutigeWaffen.length ? "angreifer" : "verteidiger";

    const registryKey = [
        String(actor.uuid), String(key || "schadensreaktion"),
        String(effektUuid || effektId || foundry.utils.randomID())
    ].join("::");

    const eintrag = {
        registryKey, key: String(key || "schadensreaktion"),
        actor, actorUuid: actor.uuid, actorId: actor.id,
        effektId: effektId || null, effektUuid: effektUuid || null,
        erlaubteWaffen: eindeutigeWaffen, rolle: sichereRolle,
        einmalig: Boolean(einmalig), protokollieren: Boolean(protokollieren),
        beiErfolg: typeof beiErfolg === "function" ? beiErfolg : null,
        beiMisserfolg: typeof beiMisserfolg === "function" ? beiMisserfolg : null,
        beiFalscherWaffe: typeof beiFalscherWaffe === "function" ? beiFalscherWaffe : null,
        registriertAm: Date.now()
    };

    this._registry.set(registryKey, eintrag);
    this.Init();

    if (eintrag.protokollieren) {
        console.log("[DSK Angriffswächter] Registrierung:", {
            key: eintrag.key, actor: actor.name, rolle: eintrag.rolle,
            erlaubteWaffen: eintrag.erlaubteWaffen,
            effektId: eintrag.effektId, effektUuid: eintrag.effektUuid
        });
    }

    return registryKey;
};

DSK.Schaden.Angriffswaechter.Entfernen = function(registryKey) {
    if (!registryKey) return false;
    this._verarbeiteteNachrichten.delete(registryKey);
    return this._registry.delete(registryKey);
};

DSK.Schaden.Angriffswaechter.EntfernenFuerEffekt = function(effekt = null) {
    if (!effekt) return 0;

    const effektUuid = String(effekt.uuid || ""), effektId = String(effekt.id || "");
    let entfernt = 0;

    for (const [registryKey, eintrag] of this._registry.entries()) {
        const passt =
            (effektUuid && String(eintrag.effektUuid || "") === effektUuid) ||
            (effektId && String(eintrag.effektId || "") === effektId);

        if (!passt) continue;
        this.Entfernen(registryKey);
        entfernt++;
    }

    return entfernt;
};

// +++ 12.10 - AKTEUR, EFFEKT UND ROLLE ++++++++++++++++++++++++
DSK.Schaden.Angriffswaechter._LadeActor = async function(eintrag) {
    if (eintrag?.actor?.documentName === "Actor") return eintrag.actor;

    if (eintrag?.actorUuid) {
        try {
            const doc = await fromUuid(eintrag.actorUuid);
            const actor = doc?.documentName === "Token" ? doc.actor : doc;

            if (actor?.documentName === "Actor") {
                eintrag.actor = actor; eintrag.actorId = actor.id;
                return actor;
            }
        } catch {}
    }

    return game.actors.get(eintrag?.actorId) ||
        canvas.tokens?.placeables?.find(token => token.actor?.id === eintrag?.actorId)?.actor || null;
};

DSK.Schaden.Angriffswaechter._LadeEffekt = async function(eintrag, actor) {
    if (eintrag?.effektUuid) {
        try {
            const effekt = await fromUuid(eintrag.effektUuid);
            if (effekt) return effekt;
        } catch {}
    }

    return eintrag?.effektId && actor?.effects ? actor.effects.get(eintrag.effektId) || null : null;
};

DSK.Schaden.Angriffswaechter._NamePasst = function(actor, gelesenerName = "") {
    if (!actor || !gelesenerName) return false;

    const gesucht = DSK.Schaden.NormalisiereName(gelesenerName);
    const gesuchtBasis = DSK.Schaden.NormalisiereName(DSK.Schaden.EntferneNummerierung(gelesenerName));
    const namen = new Set([
        actor.name, DSK.ResolveTokenName(actor),
        ...(actor.getActiveTokens?.() || []).map(token => token.name),
        ...(canvas.tokens?.placeables || [])
            .filter(token => token.actor?.uuid === actor.uuid || token.actor?.id === actor.id)
            .map(token => token.name)
    ].filter(Boolean));

    return [...namen].some(name => {
        const normal = DSK.Schaden.NormalisiereName(name);
        const basis = DSK.Schaden.NormalisiereName(DSK.Schaden.EntferneNummerierung(name));
        return normal === gesucht || basis === gesuchtBasis;
    });
};

DSK.Schaden.Angriffswaechter._RollePasst = function(eintrag, actor, angriff) {
    const istAngreifer = this._NamePasst(actor, angriff?.angreiferName);
    const istVerteidiger = this._NamePasst(actor, angriff?.verteidigerName);
    if (eintrag.rolle === "angreifer") return istAngreifer;
    if (eintrag.rolle === "verteidiger") return istVerteidiger;
    return istAngreifer || istVerteidiger;
};

// +++ 12.11 - ANGRIFFSPROBE UND WAFFE ERMITTELN +++++++++++++++
DSK.Schaden.Angriffswaechter._ProbeMessageIds = function(message) {
    const ids = [
        message?.flags?.dsk?.probeMessageId,
        message?.flags?.dsk?.attackMessageId,
        message?.flags?.dsk?.opposedTest?.attackMessageId,
        message?.flags?.dsk?.opposedTest?.messageId,
        message?.flags?.dsk?.opposedTest?.attackerMessageId,
        message?.flags?.dsk?.opposedTest?.sourceMessageId,
        message?.flags?.dsk?.preData?.messageId,
        message?.flags?.dsk?.sourceMessageId
    ];

    return [...new Set(ids.map(id => String(id || "").trim()).filter(Boolean))];
};

DSK.Schaden.Angriffswaechter._NachrichtGehoertZuActor = function(message, actor) {
    if (!message || !actor) return false;

    const speaker = message.speaker || {};
    const token = speaker.token ? canvas.scene?.tokens?.get(speaker.token) : null;
    if (speaker.actor === actor.id || token?.actor?.id === actor.id) return true;

    const text = DSK.Schaden.NormalisiereName(
        DSK.Schaden.HtmlZuText([String(message.flavor || ""), String(message.content || "")].join(" "))
    );

    return [actor.name, DSK.ResolveTokenName(actor)]
        .filter(Boolean).map(DSK.Schaden.NormalisiereName)
        .some(name => name && text.includes(name));
};

DSK.Schaden.Angriffswaechter._FindeProbenNachricht = function(message, actor) {
    for (const id of this._ProbeMessageIds(message)) {
        const probe = game.messages.get(id);
        if (probe) return probe;
    }

    const nachrichten = game.messages?.contents || [];
    const index = nachrichten.findIndex(eintrag => eintrag.id === message?.id);
    const davor = index >= 0
        ? nachrichten.slice(Math.max(0, index - 12), index).reverse()
        : [...nachrichten].reverse();

    return davor.find(eintrag => {
        if (!this._NachrichtGehoertZuActor(eintrag, actor)) return false;
        const text = DSK.Schaden.HtmlZuText([String(eintrag.flavor || ""), String(eintrag.content || "")].join(" "));
        return /\bAngriffsprobe\b/i.test(text) && !/\bgewinnt gegen\b/i.test(text);
    }) || null;
};

DSK.Schaden.Angriffswaechter._WaffenName = function(message, actor, angriff = null, erlaubteWaffen = [], probenMessage = null) {
    const erlaubte = (Array.isArray(erlaubteWaffen) ? erlaubteWaffen : [erlaubteWaffen])
        .map(name => String(name || "").trim()).filter(Boolean);

    const gesamtText = DSK.Schaden.NormalisiereName(DSK.Schaden.HtmlZuText([
        String(probenMessage?.flavor || ""), String(probenMessage?.content || ""),
        String(message?.flavor || ""), String(message?.content || ""),
        String(angriff?.rawText || "")
    ].join(" ")));

    const direkterTreffer = erlaubte
        .filter(name => gesamtText.includes(DSK.Schaden.NormalisiereName(name)))
        .sort((a, b) => b.length - a.length)[0];

    if (direkterTreffer) return direkterTreffer;

    for (const quelle of [probenMessage, message]) {
        const flagName = String(
            quelle?.flags?.dsk?.weaponName ||
            quelle?.flags?.dsk?.weapon?.name ||
            quelle?.flags?.dsk?.itemName ||
            quelle?.flags?.dsk?.item?.name ||
            quelle?.flags?.dsk?.preData?.source?.name ||
            quelle?.flags?.dsk?.postData?.source?.name || ""
        ).trim();

        if (flagName) return flagName;
    }

    const probeText = DSK.Schaden.HtmlZuText([
        String(probenMessage?.flavor || ""), String(probenMessage?.content || "")
    ].join(" "));

    const probenMatch = probeText.match(/(?:^|\s)([^]*?)\s+Angriffsprobe(?:\s*-\s*Vergleichsprobe)?/i);

    if (probenMatch?.[1]) {
        const teil = String(probenMatch[1]).trim();
        const treffer = erlaubte
            .filter(name => DSK.Schaden.NormalisiereName(teil).includes(DSK.Schaden.NormalisiereName(name)))
            .sort((a, b) => b.length - a.length)[0];

        if (treffer) return treffer;
    }

    const kandidaten = (actor?.items || []).filter(item => {
        const typ = String(item.type || "").toLowerCase();
        return ["meleeweapon", "rangeweapon", "weapon", "waffe", "nahkampfwaffe", "fernkampfwaffe"].includes(typ) ||
            typ.includes("weapon") || typ.includes("waffe");
    });

    const gefunden = kandidaten
        .filter(item => gesamtText.includes(DSK.Schaden.NormalisiereName(item.name)))
        .sort((a, b) => String(b.name).length - String(a.name).length)[0];

    return gefunden?.name || "";
};

DSK.Schaden.Angriffswaechter._WaffePasst = function(waffenName, erlaubteWaffen = []) {
    if (!erlaubteWaffen.length) return true;

    const verwendet = DSK.Schaden.NormalisiereName(waffenName);
    if (!verwendet) return false;

    return erlaubteWaffen.some(erlaubt => {
        const vergleich = DSK.Schaden.NormalisiereName(erlaubt);
        return Boolean(vergleich && (
            verwendet === vergleich ||
            verwendet.includes(vergleich) ||
            vergleich.includes(verwendet)
        ));
    });
};

// +++ 12.12 - ANTI-DUPLIKAT +++++++++++++++++++++++++++++++++++
DSK.Schaden.Angriffswaechter._WurdeVerarbeitet = function(registryKey, messageId) {
    if (!registryKey || !messageId) return false;
    if (!this._verarbeiteteNachrichten.has(registryKey)) this._verarbeiteteNachrichten.set(registryKey, new Set());
    return this._verarbeiteteNachrichten.get(registryKey).has(messageId);
};

DSK.Schaden.Angriffswaechter._MarkiereVerarbeitet = function(registryKey, messageId) {
    if (!registryKey || !messageId) return;
    if (!this._verarbeiteteNachrichten.has(registryKey)) this._verarbeiteteNachrichten.set(registryKey, new Set());

    const nachrichten = this._verarbeiteteNachrichten.get(registryKey);
    nachrichten.add(messageId);

    if (nachrichten.size > 40) {
        for (const id of [...nachrichten].slice(0, nachrichten.size - 40)) nachrichten.delete(id);
    }
};

// +++ 12.13 - EINZELNE REAKTION VERARBEITEN +++++++++++++++++++
DSK.Schaden.Angriffswaechter._VerarbeiteEintrag = async function(eintrag, message, angriff) {
    const actor = await this._LadeActor(eintrag);
    if (!actor || !this._RollePasst(eintrag, actor, angriff)) return false;

    const effekt = await this._LadeEffekt(eintrag, actor);
    if ((eintrag.effektId || eintrag.effektUuid) && !effekt) {
        this.Entfernen(eintrag.registryKey);
        return false;
    }

    const probenMessage = this._FindeProbenNachricht(message, actor);
    const waffenName = this._WaffenName(message, actor, angriff, eintrag.erlaubteWaffen, probenMessage);
    const waffePasst = this._WaffePasst(waffenName, eintrag.erlaubteWaffen);
    const probeMessageId = probenMessage?.id || null;

    const grunddaten = {
        key: eintrag.key, actor, effekt, message, angriff, waffenName,
        erlaubteWaffen: foundry.utils.deepClone(eintrag.erlaubteWaffen),
        probeMessageId, probenMessage
    };

    if (!waffePasst) {
        if (eintrag.protokollieren) {
            console.log("[DSK Angriffswächter] Falsche Waffe:", {
                key: eintrag.key, actor: actor.name, waffenName,
                erlaubteWaffen: eintrag.erlaubteWaffen, probeMessageId,
                probenText: probenMessage
                    ? DSK.Schaden.HtmlZuText([String(probenMessage.flavor || ""), String(probenMessage.content || "")].join(" "))
                    : ""
            });
        }

        if (eintrag.beiFalscherWaffe) await eintrag.beiFalscherWaffe(grunddaten);
        return false;
    }

    let verarbeitet = true;
    if (eintrag.beiErfolg) verarbeitet = (await eintrag.beiErfolg(grunddaten)) !== false;

    if (eintrag.protokollieren) {
        console.log("[DSK Angriffswächter] Erfolgreiche Reaktion:", {
            key: eintrag.key, actor: actor.name, rolle: eintrag.rolle,
            waffenName, ziel: angriff.verteidigerName,
            schaden: angriff.schaden, probeMessageId, verarbeitet
        });
    }

    if (verarbeitet && eintrag.einmalig) this.Entfernen(eintrag.registryKey);
    return verarbeitet;
};

// +++ 12.14 - ERFOLGREICHE ANGRIFFE VERARBEITEN +++++++++++++++
DSK.Schaden.Angriffswaechter.VerarbeiteNachricht = async function(message) {
    if (!message || message.speaker?.alias === "System" || message.flags?.dsk?.isWatcherMsg) return;

    const angriff = DSK.Schaden.LeseAngriff(message);
    if (!angriff?.angreiferName || !angriff?.verteidigerName || angriff.schaden <= 0) return;

    for (const eintrag of [...this._registry.values()]) {
        if (!this._registry.has(eintrag.registryKey) || this._WurdeVerarbeitet(eintrag.registryKey, message.id)) continue;

        const actor = await this._LadeActor(eintrag);
        if (!actor || !this._RollePasst(eintrag, actor, angriff)) continue;

        this._MarkiereVerarbeitet(eintrag.registryKey, message.id);

        try {
            await this._VerarbeiteEintrag(eintrag, message, angriff);
        } catch (error) {
            console.error("[DSK Angriffswächter] Einzelne Gabenreaktion fehlgeschlagen:", {
                key: eintrag.key, actor: actor.name, messageId: message.id, angriff, error
            });
        }
    }
};

// +++ 12.15 - MISSERFOLGE VERARBEITEN +++++++++++++++++++++++++
DSK.Schaden.Angriffswaechter.VerarbeiteMisserfolg = async function(message) {
    if (!message || message.speaker?.alias === "System" || message.flags?.dsk?.isWatcherMsg) return;

    const text = DSK.Schaden.HtmlZuText([String(message.flavor || ""), String(message.content || "")].join(" "));
    if (!/m(?:iss)?erfolg|gescheitert|nicht gelungen|verloren gegen/i.test(text)) return;

    for (const eintrag of [...this._registry.values()]) {
        if (!eintrag.beiMisserfolg || eintrag.rolle === "verteidiger" ||
            this._WurdeVerarbeitet(eintrag.registryKey, message.id)) continue;

        const actor = await this._LadeActor(eintrag);
        if (!actor) continue;

        const speakerActorId = message.speaker?.actor;
        const speakerToken = message.speaker?.token ? canvas.scene?.tokens?.get(message.speaker.token) : null;
        const gehoertZuActor =
            speakerActorId === actor.id ||
            speakerToken?.actor?.id === actor.id ||
            DSK.Schaden.NormalisiereName(text).includes(DSK.Schaden.NormalisiereName(actor.name));

        if (!gehoertZuActor) continue;

        const probenMessage = this._FindeProbenNachricht(message, actor) || message;
        const waffenName = this._WaffenName(message, actor, null, eintrag.erlaubteWaffen, probenMessage);
        if (!this._WaffePasst(waffenName, eintrag.erlaubteWaffen)) continue;

        this._MarkiereVerarbeitet(eintrag.registryKey, message.id);

        try {
            await eintrag.beiMisserfolg({
                key: eintrag.key, actor,
                effekt: await this._LadeEffekt(eintrag, actor),
                message, angriff: null, waffenName,
                erlaubteWaffen: foundry.utils.deepClone(eintrag.erlaubteWaffen),
                probeMessageId: probenMessage?.id || message.id,
                probenMessage
            });
        } catch (error) {
            console.error("[DSK Angriffswächter] Misserfolgsreaktion fehlgeschlagen:", {
                key: eintrag.key, actor: actor.name, messageId: message.id, error
            });
        }
    }
};

// +++ 12.16 - ANGRIFFSWÄCHTER INITIALISIEREN +++++++++++++++++++
DSK.Schaden.Angriffswaechter.Init = function() {
    if (this._hookId) Hooks.off("createChatMessage", this._hookId);
    if (globalThis._dskAngriffswaechterEffektHookId) {
        Hooks.off("deleteActiveEffect", globalThis._dskAngriffswaechterEffektHookId);
    }

    this._hookId = Hooks.on("createChatMessage", async message => {
        await this.VerarbeiteNachricht(message);
        await this.VerarbeiteMisserfolg(message);
    });

    globalThis._dskAngriffswaechterEffektHookId = Hooks.on(
        "deleteActiveEffect",
        effekt => this.EntfernenFuerEffekt(effekt)
    );
};

// ============================================================
// === BLOCK 13 — SPEZIELLE CHATINTERAKTIONEN ==================
// ============================================================

DSK.ChatInteraktion = DSK.ChatInteraktion || { _initialized: false };

// +++ 13.1 - NURTI-NAHRUNG / PORTIONEN ++++++++++++++++++++++++
DSK.ChatInteraktion.Init = function() {
    if (this._initialized) return;
    this._initialized = true;

    Hooks.on("renderChatLog", (app, html) => {
        html.on("click", ".dsk-btn-portion", async ev => {
            const btn = ev.currentTarget, msg = game.messages.get(btn.dataset.msgId);
            const ahne = btn.dataset.ahne;
            if (!msg) return;

            let portionen = Number(msg.getFlag("dsk", "portionen")) || 0;
            if (portionen <= 0) return;

            const token = canvas.tokens.controlled[0];
            if (!token?.actor) return ui.notifications.warn("Luna sagt 🌙: Bitte wähle deinen Token aus, um eine Portion zu nehmen!");

            const actor = token.actor;
            if (!DSK.Wesen.match(actor, ["erwacht", "erwachter", "erwachte", "tier", "tiere", "katze", "katzen"])) {
                return ui.notifications.warn("Luna sagt 🌙: Diese Speise ist nur für Katzen!");
            }

            const esser = msg.getFlag("dsk", "esser") || [];
            if (esser.includes(actor.name)) return ui.notifications.warn(`Luna sagt 🌙: ${actor.name} hat sich bereits eine Portion aus dieser Schale gesichert!`);

            // +++ 13.2 - NAHRUNG INS INVENTAR ++++++++++++++++++
            const itemName = "Nurti Nahrung";
            const item = actor.items.find(i => i.name === itemName);

            if (item) {
                const menge = (item.system.quantity?.value || 1) + 1;
                await item.update({ "system.quantity.value": menge });
            } else {
                await actor.createEmbeddedDocuments("Item", [{
                    name: itemName, type: "equipment", img: DSK.Symbol(ahne),
                    system: {
                        description: { value: "<p><b>Lebensmittel</b><br>Hält einen Erwachten einen ganzen Tag lang satt.</p>" },
                        quantity: { value: 1 }, weight: { value: 0.1 }
                    }
                }]);
            }

            // +++ 13.3 - CHATKARTE AKTUALISIEREN +++++++++++++++
            portionen--; esser.push(actor.name);
            await msg.setFlag("dsk", "portionen", portionen);
            await msg.setFlag("dsk", "esser", esser);

            let content = msg.content
                .replace(/<span id="dsk-portionen-count">\d+<\/span>/, `<span id="dsk-portionen-count">${portionen}</span>`)
                .replace(/<ul id="dsk-esser-liste".*?<\/ul>/s, `<ul id="dsk-esser-liste" class="dsklist" style="margin-bottom:8px;">${esser.map(name => `<li><b>${name}</b></li>`).join("")}</ul>`);

            if (portionen <= 0) {
                content = content.replace(/<button class="dsk-btn-portion".*?<\/button>/s, `<div style="text-align:center;color:#8b0000;font-weight:bold;padding:5px;">Die Schale ist restlos leergeputzt!</div>`);
            }

            await msg.update({ content });
            ui.notifications.info(`Luna sagt 🌙: ${actor.name} hat eine Portion genommen!`);
        });
    });
};

// ============================================================
// === BLOCK 14 — SPEZIELLE ÜBERWACHUNGEN ======================
// === VERBORGENER WURF ========================================
// ============================================================

DSK.LiveUeberwachung = DSK.LiveUeberwachung || { _initialized: false };

// +++ 14.1 - VERBORGENER-WURF-WÄCHTER +++++++++++++++++++++++++
DSK.LiveUeberwachung.Init = function() {
    if (this._initialized) return;
    this._initialized = true;

    Hooks.on("createChatMessage", async message => {
        if (message.speaker?.alias === "System" || message.flags?.dsk?.isWatcherMsg) return;

        const authorId = message.author?.id || message.user?.id;
        if (authorId !== game.user.id) return;

        const raw = `${String(message.flavor || "")} ${String(message.content || "")}`;
        if (!raw.toLowerCase().includes("sinnessch")) return;

        let hoechsteQS = 0;
        const verborgeneNamen = [];

        for (const token of canvas.tokens?.placeables || []) {
            const effekt = token.actor?.effects?.find(e => e.getFlag("dsk", "isVerborgenerWurf"));
            if (!effekt) continue;

            hoechsteQS = Math.max(hoechsteQS, Number(effekt.getFlag("dsk", "qs")) || 1);
            verborgeneNamen.push(token.name);
        }

        if (!verborgeneNamen.length) return;

        const erschwernis = hoechsteQS * 2;
        const suchender = message.speaker?.alias || "Ein Suchender";
        const effektName = "Verborgener Wurf (Rondra)";

        const inhalt = `
            <p style="margin-bottom:8px;">Wenn du versuchst, jemanden wahrzunehmen, greift der Effekt <b>Verborgener Wurf</b>.</p>
            <p style="margin-bottom:4px;font-weight:bold;color:#76301b;">Vorgehen:</p>
            <ul class="dsklist" style="margin-top:0;margin-bottom:0;">
                <li>Ziehe <b>${erschwernis}</b> von deinem Probenwert ab.</li>
                <li>Vergleiche den Wurf mit dem neuen Wert.</li>
                <li><b style="color:#18940F;">Erfolg:</b> Habe bitte einen Moment Geduld, die Spielleitung beschreibt dir gleich, was du entdeckst.</li>
                <li><b style="color:#B30000;">Misserfolg:</b> Du nimmst nichts wahr.</li>
            </ul>`;

        const whisperIds = new Set(DSK.Empfaenger.GM());
        if (authorId) whisperIds.add(authorId);

        await ChatMessage.create({
            whisper: Array.from(whisperIds), speaker: { alias: "System" },
            flags: { dsk: { isWatcherMsg: true } },
            content: `${DSK.UI.Header(effektName, DSK.Symbol("Rondra"))}
                <div class="dskbox2" style="margin-top:10px;color:#000;font-size:.95em;">
                    <p style="margin-bottom:8px;"><b>${suchender}</b> hat eine Sinnesschärfe-Probe abgelegt.</p>
                    <hr style="margin:8px 0;border:0;border-top:1px solid #c9bca6;">
                    ${inhalt}
                </div>`
        });
    });
};

// ============================================================
// === BLOCK 15 — SPAWN & CLEANUP ==============================
// ============================================================

DSK.SpawnSystem = DSK.SpawnSystem || { _initialized: false };

// +++ 15.1 - SPAWN REGISTRIEREN +++++++++++++++++++++++++++++++
DSK.SpawnSystem.RegisterSpawn = function(effectName, targetEffectName, namesArray, ahne, targetDesc) {
    globalThis._dskSpawnRegistry ||= {};
    globalThis._dskSpawnRegistry[effectName] = {
        names: Array.isArray(namesArray) ? namesArray : [namesArray],
        targetEffectName, ahne, targetDesc
    };
};

// +++ 15.2 - SPAWN-WÄCHTER ++++++++++++++++++++++++++++++++++++
DSK.SpawnSystem.Init = function() {
    if (this._initialized) return;
    this._initialized = true;

    Hooks.on("createToken", async tokenDoc => {
        if (!game.user.isGM) return;

        const registry = globalThis._dskSpawnRegistry || {};

        for (const [effectName, config] of Object.entries(registry)) {
            if (!config.names.includes(tokenDoc.name)) continue;

            for (const actorToken of canvas.scene?.tokens || []) {
                const actor = actorToken.actor;
                if (!actor?.effects?.find(e => (e.name || e.label) === effectName)) continue;

                await tokenDoc.setFlag("dsk", "spawnedByUuid", actor.uuid);

                if (tokenDoc.actor && !tokenDoc.actor.effects.find(e => (e.name || e.label) === config.targetEffectName)) {
                    await tokenDoc.actor.createEmbeddedDocuments("ActiveEffect", [{
                        name: config.targetEffectName,
                        img: DSK.Symbol(config.ahne), icon: DSK.Symbol(config.ahne),
                        type: "base", showIcon: 1,
                        description: config.targetDesc,
                        flags: { dsk: { spawnedByUuid: actor.uuid } }
                    }]);
                }

                break;
            }
        }
    });

    // +++ 15.3 - SPAWN-CLEANUP ++++++++++++++++++++++++++++++++
    Hooks.on("deleteActiveEffect", async effect => {
        if (!game.user.isGM) return;

        const registry = globalThis._dskSpawnRegistry || {};
        const effectName = effect.name || effect.label || "";
        if (!registry[effectName]) return;

        const actor = effect.parent;
        if (!actor) return;

        const tokens = (canvas.scene?.tokens || [])
            .filter(token => token.getFlag("dsk", "spawnedByUuid") === actor.uuid)
            .map(token => token.id);

        if (tokens.length) await canvas.scene.deleteEmbeddedDocuments("Token", tokens);
    });
};

// ============================================================
// === BLOCK 16 — GEOMETRIE & RICHTUNGEN =======================
// ============================================================

DSK.Geometrie = DSK.Geometrie || {};

// +++ 16.1 - DISTANZ ++++++++++++++++++++++++++++++++++++++++++
DSK.Geometrie.Distanz = function(token1, token2) {
    if (!token1 || !token2) return 999;
    const dx = token1.center.x - token2.center.x, dy = token1.center.y - token2.center.y;
    const pxDist = Math.hypot(dx, dy);
    return (pxDist / canvas.scene.grid.size) * canvas.scene.grid.distance;
};

// Kompatibilitätsalias für ältere Makros.
DSK.Distanz = DSK.Geometrie.Distanz;

// +++ 16.2 - RICHTUNG +++++++++++++++++++++++++++++++++++++++++
DSK.Geometrie.Richtung = function(ursprung, ziel) {
    if (!ursprung || !ziel) return "Unbekannt";

    const dx = ziel.center.x - ursprung.center.x, dy = ziel.center.y - ursprung.center.y;
    let grad = Math.atan2(dy, dx) * (180 / Math.PI);
    if (grad < 0) grad += 360;

    return ["Osten", "Südosten", "Süden", "Südwesten", "Westen", "Nordwesten", "Norden", "Nordosten"][Math.round(grad / 45) % 8];
};

DSK.Geometrie.RichtungKurz = function(ursprung, ziel) {
    const richtung = this.Richtung(ursprung, ziel);
    return {
        Norden: "N", Nordosten: "NO", Osten: "O", Südosten: "SO",
        Süden: "S", Südwesten: "SW", Westen: "W", Nordwesten: "NW"
    }[richtung] || "?";
};

// +++ 16.3 - POSITION ++++++++++++++++++++++++++++++++++++++++++
DSK.Geometrie.PositionInfo = function(ursprung, ziel, { nachkommastellen = 0 } = {}) {
    const distanz = this.Distanz(ursprung, ziel);
    const stellen = Math.max(0, Math.min(3, Math.floor(Number(nachkommastellen) || 0)));
    const faktor = 10 ** stellen;

    return {
        distanz: Math.round(Number(distanz) * faktor) / faktor,
        richtung: this.Richtung(ursprung, ziel),
        richtungKurz: this.RichtungKurz(ursprung, ziel)
    };
};

// +++ 16.4 - HIMMELSRICHTUNGEN ++++++++++++++++++++++++++++++++
DSK.Geometrie.Richtungen = [
    { kurz: "N", lang: "Norden" }, { kurz: "NO", lang: "Nordosten" },
    { kurz: "O", lang: "Osten" }, { kurz: "SO", lang: "Südosten" },
    { kurz: "S", lang: "Süden" }, { kurz: "SW", lang: "Südwesten" },
    { kurz: "W", lang: "Westen" }, { kurz: "NW", lang: "Nordwesten" }
];

DSK.Geometrie.SichereRichtung = function(wert, fallback = "Norden") {
    const richtung = String(wert || "");
    return this.Richtungen.some(eintrag => eintrag.lang === richtung) ? richtung : fallback;
};

// +++ 16.5 - RICHTUNGSAUSWAHL FÜR DIALOGE +++++++++++++++++++++
DSK.Geometrie.RichtungsAuswahlHtml = function({ name = "richtung", vorauswahl = "Norden" } = {}) {
    return `<div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3px;width:100%;align-items:center;">
        ${this.Richtungen.map(richtung => `<label title="${richtung.lang}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;min-width:0;white-space:nowrap;font-size:.88em;"><input type="radio" name="${name}" value="${richtung.lang}" ${richtung.lang === vorauswahl ? "checked" : ""} style="margin:0;"><span>${richtung.kurz}</span></label>`).join("")}
    </div>`;
};

// ============================================================
// === BLOCK 17 — ZONEN & SCHABLONEN ===========================
// === ZIELEFFEKTE + GEKOPPELTES CLEANUP =======================
// ============================================================

DSK.Zone = DSK.Zone || {};

// +++ 17.1 - ZONENEFFEKTE AUF AUSWAHL ANWENDEN ++++++++++++++++
DSK.Zone.ApplyEffectsToSelected = async function(templateId, zielEffektName, ahne, effektData = {}) {
    if (!game.user.isGM) return ui.notifications.warn("Luna sagt 🌙: Nur die Spielleitung kann Zoneneffekte anwenden!");

    const tokens = canvas.tokens.controlled || [];
    if (!tokens.length) return ui.notifications.warn("Luna sagt 🌙: Bitte wähle mindestens ein betroffenes Token auf der Karte aus!");

    let count = 0, fehler = 0;

    for (const token of tokens) {
        const actor = token?.actor;
        if (!actor) { fehler++; continue; }

        const vorhanden = actor.effects.some(effect =>
            (effect.name || effect.label || "") === zielEffektName &&
            effect.getFlag("dsk", "templateId") === templateId
        );
        if (vorhanden) continue;

        const externeFlags = foundry.utils.deepClone(effektData.flags || {});
        const icon = effektData.img || effektData.icon || DSK.Symbol(ahne);
        const effectData = {
            name: zielEffektName, type: effektData.type || "base",
            img: icon, icon, showIcon: effektData.showIcon ?? 1,
            description: effektData.description || effektData.beschreibung || "",
            changes: Array.isArray(effektData.changes) ? foundry.utils.deepClone(effektData.changes) : [],
            statuses: Array.isArray(effektData.statuses) ? foundry.utils.deepClone(effektData.statuses) : [],
            disabled: Boolean(effektData.disabled), transfer: Boolean(effektData.transfer),
            flags: { ...externeFlags, dsk: { templateId, ...(externeFlags.dsk || {}) } }
        };

        if (effektData.duration) effectData.duration = foundry.utils.deepClone(effektData.duration);
        if (effektData.origin) effectData.origin = effektData.origin;

        try {
            const erstellt = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            if (erstellt?.[0]) count++; else fehler++;
        } catch (error) {
            fehler++;
            console.error("DSK.Zone.ApplyEffectsToSelected: Zoneneffekt konnte nicht angelegt werden.", {
                token: token.name, actor: actor.name, templateId, zielEffektName, effectData, error
            });
        }
    }

    if (count) ui.notifications.info(`Luna sagt 🌙: Effekt auf ${count} ausgewählte Token angewendet.`);
    if (fehler) ui.notifications.warn(`Luna sagt 🌙: Bei ${fehler} Token konnte der Zoneneffekt nicht angelegt werden.`);
    return count;
};

// +++ 17.2 - ZONENBUTTON ++++++++++++++++++++++++++++++++++++++
DSK.Zone.InitHooks = function() {
    if (globalThis._dskZoneApplyListener) document.removeEventListener("click", globalThis._dskZoneApplyListener);

    globalThis._dskZoneApplyListener = async event => {
        const button = event.target.closest(".dsk-btn-apply");
        if (!button) return;

        event.preventDefault(); event.stopPropagation();
        if (!game.user.isGM) return ui.notifications.warn("Luna sagt 🌙: Nur die Spielleitung kann Zoneneffekte anwenden!");
        if (button.disabled || button.dataset.processing === "true") return;
        button.dataset.processing = "true";

        try {
            const templateId = button.dataset.templateId;
            const zielEffektName = button.dataset.zielEffekt;
            const ahne = button.dataset.ahne || "Zerzal";
            if (!templateId || !zielEffektName) throw new Error("Template-ID oder Zieleffektname fehlt.");

            let effektData = {};
            try { effektData = JSON.parse(decodeURIComponent(button.dataset.effektData || "")); }
            catch { throw new Error("Die gespeicherten Zoneneffektdaten konnten nicht gelesen werden."); }

            await DSK.Zone.ApplyEffectsToSelected(templateId, zielEffektName, ahne, effektData);
        } catch (error) {
            console.error("DSK.Zone: Zoneneffekt konnte nicht angewendet werden.", error);
            ui.notifications.error("Luna sagt 🌙: Der Zoneneffekt konnte nicht angewendet werden!");
        } finally {
            button.dataset.processing = "false";
        }
    };

    document.addEventListener("click", globalThis._dskZoneApplyListener);

    // +++ 17.3 - QUELLEFFEKT + TEMPLATE GEMEINSAM ENTFERNEN +++

    if (globalThis._dskZoneCleanupHookId) Hooks.off("preDeleteActiveEffect", globalThis._dskZoneCleanupHookId);
    globalThis._dskZoneCleanupAktiv ||= new Set();

    globalThis._dskZoneCleanupHookId = Hooks.on("preDeleteActiveEffect", async effect => {
        const flags = effect?.flags?.dsk || {};
        if (flags.isZoneSource !== true) return;

        const templateId = String(flags.templateId || "").trim();
        if (!templateId || globalThis._dskZoneCleanupAktiv.has(templateId)) return;

        const gms = game.users.filter(u => u.isGM && u.active).sort((a, b) => String(a.id).localeCompare(String(b.id)));
        if (!game.user.isGM || (gms[0] && game.user.id !== gms[0].id)) return;

        globalThis._dskZoneCleanupAktiv.add(templateId);

        try {
            const zielEffektName = String(flags.zielEffektName || "").trim();
            const casterEffektName = flags.casterEffektName || effect.name || effect.label || "Ahnengabe";
            const ahne = flags.ahne || "Zerzal";
            const betroffeneNamen = [DSK.ResolveTokenName(effect.parent)];

            for (const token of canvas.tokens?.placeables || []) {
                const actor = token?.actor;
                if (!actor) continue;

                const treffer = actor.effects.filter(zielEffekt =>
                    zielEffekt.id !== effect.id &&
                    zielEffekt.getFlag("dsk", "templateId") === templateId &&
                    (!zielEffektName || (zielEffekt.name || zielEffekt.label || "") === zielEffektName)
                );

                if (!treffer.length) continue;
                betroffeneNamen.push(DSK.ResolveTokenName(actor));
                await actor.deleteEmbeddedDocuments("ActiveEffect", treffer.map(zielEffekt => zielEffekt.id));
            }

            const template = canvas.scene?.templates?.get(templateId) ||
                canvas.scene?.templates?.find(t =>
                    t.id === templateId || t._id === templateId ||
                    (flags.templateUuid && t.uuid === flags.templateUuid)
                ) || null;

            if (template) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
            else console.warn("DSK.Zone: Verknüpfte Fläche wurde nicht gefunden.", {
                templateId, templateUuid: flags.templateUuid || null,
                effekt: effect.name, effektUuid: effect.uuid
            });

            // Block 7 erzeugt in diesem Fall die Wirkungsendekarte.
            if (flags.wirkungsendeUeberBlock6 === true) return;

            const endeText = casterEffektName.includes("Geisterbann")
                ? "Die Skratglyphen verblassen, und die Bannzone löst sich auf."
                : "Die Energie der Skratglyphen erlischt, und die Geisterfessel löst sich auf.";

            await ChatMessage.create({
                speaker: { alias: "System" },
                content: `${DSK.UI.Header("Wirkungsende", effect.icon || effect.img || DSK.Symbol(ahne))}
                    <div class="dskbox2" style="margin-top:10px;">
                        <p><b>${casterEffektName}</b></p><p>${endeText}</p>
                        <p style="font-size:.9em;color:#555;">Einheiten/Erschwernisse verflogen.</p>
                        <hr style="margin:6px 0;border:0;border-top:1px solid #c9bca6;">
                        <p style="margin-bottom:5px;"><b>Effekt beendet auf:</b></p>
                        ${DSK.UI.List([...new Set(betroffeneNamen)])}
                    </div>`
            });
        } catch (error) {
            console.error("DSK.Zone: Gekoppeltes Zonen-Cleanup fehlgeschlagen.", {
                templateId, effekt: effect?.name, effektUuid: effect?.uuid, error
            });
        } finally {
            globalThis._dskZoneCleanupAktiv.delete(templateId);
        }
    });

    // +++ 17.4 - GEISTERBANN: PANIK SYNCHRONISIEREN ++++++++++++

    if (globalThis._dskPanikHookId) Hooks.off("updateActiveEffect", globalThis._dskPanikHookId);

    globalThis._dskPanikHookId = Hooks.on("updateActiveEffect", async effect => {
        const actor = effect?.parent;
        if (!actor) return;

        const name = String(effect.name || effect.label || "");
        if (!name.includes("Zone - Geisterbann")) return;

        const value = Number(effect.getFlag("dsk", "value") ?? 8);
        if (value >= 7) return;

        const panikEffekte = actor.effects.filter(e =>
            String(e.name || e.label || "").toLowerCase().includes("panisch")
        );
        if (!panikEffekte.length) return;

        await actor.deleteEmbeddedDocuments("ActiveEffect", panikEffekte.map(e => e.id));
        ui.notifications.info(`Luna sagt 🌙: ${actor.name} hat sich gefasst – Status aufgehoben!`);
    });
};

// ============================================================
// === BLOCK 18 — ZENTRALE INITIALISIERUNG & ABSCHLUSS =========
// ============================================================

// +++ 18.1 - KERNSYSTEME INITIALISIEREN ++++++++++++++++++++++++
DSK.EffektEnde?.Init?.();
DSK.Zustaende?.InitHooks?.();

DSK.GabenUI?.InitGMMakroButton?.();
DSK.GabenUI?.InitGMGeheimButton?.();
DSK.UI?.InitDescriptionToggle?.();

DSK.Schaden?.Init?.();
DSK.Schaden?.Angriffswaechter?.Init?.();

// +++ 18.2 - SPEZIALSYSTEME INITIALISIEREN ++++++++++++++++++++
DSK.ChatInteraktion?.Init?.();
DSK.LiveUeberwachung?.Init?.();
DSK.SpawnSystem?.Init?.();
DSK.Zone?.InitHooks?.();

// +++ 18.3 - ABSCHLUSS ++++++++++++++++++++++++++++++++++++++++
console.log(`DSK Framework v${DSK.version} erfolgreich geladen.`);