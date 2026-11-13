/************************************************************
 * GM-Übersichts-Makro – Zeitfenster-Gruppierung
 *
 * - aktive und versteckte/suspendierte Effekte getrennt
 * - versteckte Effekte als einklappbarer Bereich
 * - Bearbeiten, Löschen, Gruppenlöschung und Stufenregler
 * - offene Bereiche bleiben bei Aktualisierung erhalten
 * - Erstell- und Löschton
 ************************************************************/

/* ============================================================
   1 - KONFIGURATION, BUTTON-STYLES & SOUNDS
   ============================================================ */

const MACRO_VERSION = "01.03";

const BTN_BIG = `background:linear-gradient(#76301b,#582617);color:#f8f6f5;border:1px solid #000;border-radius:4px;font-weight:bold;padding:3px 8px;font-size:11px;cursor:pointer;white-space:nowrap;height:25px;line-height:17px;box-sizing:border-box;`;
const BTN_HEAD = `${BTN_BIG}width:75px;text-align:center;`;
const BTN_LVL = `background:#5a3b2a;color:#fff;border:1px solid #000;border-radius:3px;font-weight:bold;cursor:pointer;width:22px;height:22px;font-size:12px;line-height:20px;text-align:center;padding:0;`;

const SOUND_CREATE = "https://assets.forge-vtt.com/bazaar/modules/gAudioBundle-4/assets/src/Scene%20Switch%20Transitions%20And%20Textures/Transition_Alien_Sonar_03.ogg";
const SOUND_DELETE = "https://assets.forge-vtt.com/bazaar/modules/gAudioBundle-4/assets/src/Scene%20Switch%20Transitions%20And%20Textures/Transition_Synth_Delay_03.ogg";

async function spieleEffektTon(src, volume = 0.35) {
    try {
        await foundry.audio.AudioHelper.play({ src, volume, autoplay: true, loop: false }, false);
    } catch (error) {
        console.warn("DSK Effektübersicht: Ton konnte nicht abgespielt werden.", { src, error });
    }
}

/* ============================================================
   2 - GRUPPEN- & EFFEKT-ANALYSE
   ============================================================ */

function collectEffectsAndGroups() {
    const rawEffects = [];

    for (const token of canvas.tokens.placeables) {
        const actor = token.actor;
        if (!actor) continue;

        const actorImg = token.document?.texture?.src || actor.img || "icons/svg/mystery-man.svg";
        const displayName = token.document?.name || actor.name;

        for (const effect of actor.effects) {
            const name = effect.name || effect.label || "Unbenannter Effekt";
            const createdTime = effect._stats?.createdTime || effect.duration?.startTime || 0;

            rawEffects.push({
                tokenId: token.id, actorId: actor.id, actorName: displayName, actorImg,
                effectId: effect.id, name, icon: effect.img || effect.icon || "icons/svg/aura.svg",
                createdTime, flags: effect.flags, effect, groupId: null, verborgen: Boolean(effect.disabled)
            });
        }
    }

    const TIME_WINDOW_MS = 3000, groupsList = [];

    for (const item of rawEffects) {
        const kernName = item.name.split(" - ")[0].trim();
        let group = groupsList.find(g =>
            g.kernName === kernName && g.verborgen === item.verborgen &&
            Math.abs(g.baseTime - item.createdTime) <= TIME_WINDOW_MS
        );

        if (!group) {
            group = {
                id: `group_${groupsList.length + 1}_${Date.now()}`,
                kernName, name: item.name, baseTime: item.createdTime,
                verborgen: item.verborgen, items: []
            };
            groupsList.push(group);
        }

        group.items.push(item);
    }

    const groupsMap = {};

    for (const group of groupsList) {
        if (group.items.length <= 1) continue;
        groupsMap[group.id] = group.items;
        for (const item of group.items) item.groupId = group.id;
    }

    const tokensResult = {};

    for (const item of rawEffects) {
        tokensResult[item.tokenId] ||= {
            tokenId: item.tokenId, actorId: item.actorId,
            actorName: item.actorName, actorImg: item.actorImg,
            effects: [], hiddenEffects: []
        };

        const groupList = item.groupId ? groupsMap[item.groupId] : null;
        item.groupSize = groupList ? groupList.length : 1;

        (item.verborgen
            ? tokensResult[item.tokenId].hiddenEffects
            : tokensResult[item.tokenId].effects
        ).push(item);
    }

    return { tokensData: tokensResult, groupsMap };
}

/* ============================================================
   3 - STUFEN-REGLER
   ============================================================ */

async function updateSystemEffectLevel(effect, newValue) {
    const flags = effect.flags?.dsk || {}, max = flags.max ?? 8;
    const clamp = Math.clamp || ((val, min, maximum) => Math.max(min, Math.min(maximum, val)));
    const value = clamp(Number(newValue), 0, max);
    const changes = foundry.utils.deepClone(effect.changes || []);

    for (const change of changes) {
        if (change.key === "system.status.feared") change.value = String(value);
    }

    await effect.update({
        "flags.dsk.value": value,
        "flags.dsk.manual": value,
        changes
    });
}

function renderLevelControl(effectData) {
    if (!(effectData.flags?.dsk && typeof effectData.flags.dsk.value === "number")) return "";

    const value = effectData.flags.dsk.value, max = effectData.flags.dsk.max ?? 8;

    return `<div class="level-control" data-eid="${effectData.effectId}" data-token-id="${effectData.tokenId}" style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
        <button type="button" class="lvl-minus" data-eid="${effectData.effectId}" style="${BTN_LVL}">-</button>
        <input class="lvl-input" data-eid="${effectData.effectId}" type="number" min="0" max="${max}" value="${value}" style="width:34px;height:22px;text-align:center;font-size:12px;">
        <button type="button" class="lvl-plus" data-eid="${effectData.effectId}" style="${BTN_LVL}">+</button>
    </div>`;
}

/* ============================================================
   4 - EFFEKT-BESCHREIBUNG
   ============================================================ */

function renderEffectDescription(effectData) {
    const raw = effectData.effect.description || "";
    if (!raw) return `<div style="color:#777;font-size:.85em;margin-top:4px;">Keine Beschreibung vorhanden</div>`;

    return `<div style="margin-top:6px;">
        <span class="desc-toggle" style="cursor:pointer;font-size:.9em;color:#333;font-weight:bold;"><span class="arrow">▶</span> Beschreibung</span>
        <div class="desc-content" style="display:none;font-size:.9em;color:#222;margin-top:4px;padding:8px 10px;">${game.i18n.localize(raw)}</div>
    </div>`;
}

/* ============================================================
   5 - EFFEKT-ZEILE
   ============================================================ */

function renderSingleEffectRow(effectData) {
    let deleteHTML = "", groupHTML = "";

    if (effectData.groupId && effectData.groupSize > 1) {
        groupHTML = `<span style="background:#76301b;color:#fff;font-size:9px;padding:2px 5px;border-radius:3px;flex-shrink:0;white-space:nowrap;">Gruppe (${effectData.groupSize})</span>`;
        deleteHTML = `<button type="button" class="delete-group-btn" data-group-id="${effectData.groupId}" style="${BTN_BIG}">Gruppe löschen</button>
            <button type="button" class="delete-single" data-effect-id="${effectData.effectId}" style="${BTN_BIG}">Einzeln</button>`;
    } else {
        deleteHTML = `<button type="button" class="delete-single" data-effect-id="${effectData.effectId}" style="${BTN_BIG}">Löschen</button>`;
    }

    const hiddenHTML = effectData.verborgen
        ? `<span title="Suspendierter oder absichtlich verborgener Effekt" style="background:#555;color:#fff;font-size:9px;padding:2px 5px;border-radius:3px;flex-shrink:0;white-space:nowrap;">Verborgen</span>`
        : "";

    return `<div class="effect-row" data-token-id="${effectData.tokenId}" data-effect-id="${effectData.effectId}" style="padding:8px 4px;border-bottom:1px solid rgba(0,0,0,.12);">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">
            <img src="${effectData.icon}" width="36" height="36" style="border:1px solid rgba(0,0,0,.2);border-radius:4px;flex-shrink:0;object-fit:cover;">
            <div title="${effectData.name}" style="font-weight:bold;font-size:.95em;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${effectData.name}</div>
            ${hiddenHTML}${groupHTML}${renderLevelControl(effectData)}
            <div style="margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <button type="button" class="open-effect-sheet" style="${BTN_BIG}">Bearbeiten</button>${deleteHTML}
            </div>
        </div>
        ${renderEffectDescription(effectData)}
    </div>`;
}

/* ============================================================
   6 - VERSTECKTE EFFEKTE
   ============================================================ */

function renderHiddenEffectsSection(tokenData, isOpen) {
    const effects = tokenData.hiddenEffects || [];
    if (!effects.length) return "";

    return `<div class="hidden-effects-section" data-token-id="${tokenData.tokenId}" style="margin:12px 4px 2px;border:1px solid rgba(90,59,42,.35);border-radius:4px;background:rgba(90,59,42,.045);">
        <div class="hidden-effects-header" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:7px 9px;color:#5a3b2a;font-weight:bold;">
            <span class="hidden-effects-arrow" style="font-size:12px;width:12px;">${isOpen ? "▼" : "▶"}</span>
            <i class="fas fa-eye-slash" style="width:14px;text-align:center;"></i>
            <span>Versteckte Effekte</span>
            <span style="margin-left:auto;font-size:.85em;color:#666;">(${effects.length})</span>
        </div>
        <div class="hidden-effects-content" style="display:${isOpen ? "block" : "none"};padding:0 6px 6px;">
            <div style="font-size:.82em;color:#666;padding:2px 4px 7px;">Diese Effekte sind suspendiert und werden Spielern nicht als aktive Effekte angezeigt.</div>
            ${effects.map(renderSingleEffectRow).join("")}
        </div>
    </div>`;
}

/* ============================================================
   7 - TOKEN-BLOCK
   ============================================================ */

function renderActorSection(tokenData, isOpen, hiddenIsOpen) {
    const effects = tokenData.effects || [], hidden = tokenData.hiddenEffects || [];
    if (!effects.length && !hidden.length) return "";

    const countText = hidden.length
        ? `${effects.length} aktiv, ${hidden.length} versteckt`
        : `${effects.length} ${effects.length === 1 ? "Effekt" : "Effekte"}`;

    return `<div class="actor-block" data-token-id="${tokenData.tokenId}" style="padding:10px 0;">
        <div class="actor-dropdown-header" style="cursor:pointer;display:flex;align-items:center;gap:10px;">
            <span class="actor-arrow" style="font-size:14px;width:12px;">${isOpen ? "▼" : "▶"}</span>
            <img src="${tokenData.actorImg}" width="48" height="48" style="border-radius:50%;object-fit:cover;border:2px solid rgba(0,0,0,.2);flex-shrink:0;">
            <span style="font-weight:bold;color:#222;font-size:1.05em;">${tokenData.actorName}</span>
            <button type="button" class="edit-actor-btn" data-token-id="${tokenData.tokenId}" style="${BTN_HEAD}">Bearbeiten</button>
            <span style="margin-left:auto;font-size:.85em;color:#555;">(${countText})</span>
        </div>

        <div class="actor-dropdown-content" style="display:${isOpen ? "block" : "none"};margin-top:10px;">
            <div class="active-effects-section">
                ${effects.length ? effects.map(renderSingleEffectRow).join("") : `<p style="text-align:center;color:#777;font-size:.88em;margin:8px 0;">Keine aktiven Effekte.</p>`}
            </div>
            ${renderHiddenEffectsSection(tokenData, hiddenIsOpen)}
        </div>
    </div>`;
}

/* ============================================================
   8 - GM-DIALOG
   ============================================================ */

class DSKEffectManagerDialog extends Dialog {
    constructor() {
        super(
            { title: `Effekte Übersicht – GM (v${MACRO_VERSION})`, content: "", buttons: {} },
            { width: 880, height: 700, resizable: true }
        );

        this.openTokens = {};
        this.openHiddenEffects = {};
        this.groupsMap = {};
        this._hooks = [];
    }

    _saveOpenState() {
        if (!this.element) return;

        this.element.find(".actor-block").each((i, el) => {
            const tokenId = el.dataset.tokenId;
            const content = el.querySelector(".actor-dropdown-content");
            const hidden = el.querySelector(".hidden-effects-content");

            if (content?.style.display === "block") this.openTokens[tokenId] = true;
            else delete this.openTokens[tokenId];

            if (hidden?.style.display === "block") this.openHiddenEffects[tokenId] = true;
            else delete this.openHiddenEffects[tokenId];
        });
    }

    render(force = false, options = {}) {
        this._saveOpenState();
        this.data.content = this._renderHTML();

        if (!this._hooks.length) {
            // Änderungen bleiben lautlos.
            for (const name of ["updateActiveEffect", "updateToken", "createToken", "deleteToken"]) {
                const id = Hooks.on(name, () => this.render(true));
                this._hooks.push({ name, id });
            }

            // Effekt erstellt → Sound + Aktualisierung.
            let id = Hooks.on("createActiveEffect", () => {
                spieleEffektTon(SOUND_CREATE);
                this.render(true);
            });
            this._hooks.push({ name: "createActiveEffect", id });

            // Effekt gelöscht → Sound + Aktualisierung.
            id = Hooks.on("deleteActiveEffect", () => {
                spieleEffektTon(SOUND_DELETE);
                this.render(true);
            });
            this._hooks.push({ name: "deleteActiveEffect", id });
        }

        return super.render(force, options);
    }

    close(options = {}) {
        for (const h of this._hooks) Hooks.off(h.name, h.id);
        this._hooks = [];
        return super.close(options);
    }

    _renderHTML() {
        const { tokensData, groupsMap } = collectEffectsAndGroups();
        this.groupsMap = groupsMap;

        let html = `<div style="padding:10px;max-height:620px;overflow-y:auto;font-size:13px;">
            <div class="dskbox1" style="margin-bottom:14px;">
                <p style="font-weight:bold;text-align:center;">Effekte Übersicht (v${MACRO_VERSION})</p><hr>
                <p style="text-align:center;">Aktive und versteckte Effekte werden getrennt angezeigt. Zeitfenster-Gruppierung verbindet gleichzeitig erzeugte Effekte.</p>
            </div>
            <div class="dskbox2" style="padding:12px;">`;

        const tokenIds = Object.keys(tokensData);

        if (!tokenIds.length) {
            html += `<p style="text-align:center;color:#777;">Keine aktiven oder versteckten Effekte.</p>`;
        } else {
            let first = true;

            for (const tokenId of tokenIds) {
                if (!first) html += `<hr style="margin:12px 0;border:0;border-top:1px solid rgba(0,0,0,.2);">`;
                first = false;

                html += renderActorSection(
                    tokensData[tokenId],
                    Boolean(this.openTokens[tokenId]),
                    Boolean(this.openHiddenEffects[tokenId])
                );
            }
        }

        return html + `</div></div>`;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Akteur öffnen/schließen
        html.find(".actor-dropdown-header").on("click", ev => {
            if (ev.target.closest(".edit-actor-btn")) return;

            const block = ev.currentTarget.closest(".actor-block"), tokenId = block.dataset.tokenId;
            const content = block.querySelector(".actor-dropdown-content"), arrow = ev.currentTarget.querySelector(".actor-arrow");
            const open = content.style.display === "none";

            content.style.display = open ? "block" : "none";
            arrow.textContent = open ? "▼" : "▶";

            if (open) this.openTokens[tokenId] = true;
            else delete this.openTokens[tokenId];
        });

        // Versteckte Effekte öffnen/schließen
        html.find(".hidden-effects-header").on("click", ev => {
            ev.stopPropagation();

            const section = ev.currentTarget.closest(".hidden-effects-section"), tokenId = section.dataset.tokenId;
            const content = section.querySelector(".hidden-effects-content"), arrow = ev.currentTarget.querySelector(".hidden-effects-arrow");
            const open = content.style.display === "none";

            content.style.display = open ? "block" : "none";
            arrow.textContent = open ? "▼" : "▶";

            if (open) this.openHiddenEffects[tokenId] = true;
            else delete this.openHiddenEffects[tokenId];
        });

        // Akteur bearbeiten
        html.find(".edit-actor-btn").on("click", ev => {
            ev.preventDefault(); ev.stopPropagation();
            const token = canvas.tokens.get(ev.currentTarget.dataset.tokenId);
            token?.actor?.sheet.render(true, { token: token.document });
        });

        // Effekt bearbeiten
        html.find(".open-effect-sheet").on("click", ev => {
            ev.preventDefault(); ev.stopPropagation();
            const row = ev.currentTarget.closest(".effect-row");
            const effect = canvas.tokens.get(row.dataset.tokenId)?.actor?.effects.get(row.dataset.effectId);
            effect?.sheet.render(true);
        });

        // Beschreibung
        html.find(".desc-toggle").on("click", ev => {
            ev.preventDefault(); ev.stopPropagation();

            const content = ev.currentTarget.nextElementSibling;
            const arrow = ev.currentTarget.querySelector(".arrow");
            const open = content.style.display === "none";

            content.style.display = open ? "block" : "none";
            arrow.textContent = open ? "▼" : "▶";
        });

        // Stufe -
        html.find(".lvl-minus").on("click", async ev => {
            ev.preventDefault(); ev.stopPropagation();

            const row = ev.currentTarget.closest(".effect-row");
            const effect = canvas.tokens.get(row.dataset.tokenId)?.actor?.effects.get(ev.currentTarget.dataset.eid);
            if (!effect) return;

            await updateSystemEffectLevel(effect, (effect.flags.dsk?.value ?? 0) - 1);
            this.render(true);
        });

        // Stufe +
        html.find(".lvl-plus").on("click", async ev => {
            ev.preventDefault(); ev.stopPropagation();

            const row = ev.currentTarget.closest(".effect-row");
            const effect = canvas.tokens.get(row.dataset.tokenId)?.actor?.effects.get(ev.currentTarget.dataset.eid);
            if (!effect) return;

            await updateSystemEffectLevel(effect, (effect.flags.dsk?.value ?? 0) + 1);
            this.render(true);
        });

        // Stufe direkt
        html.find(".lvl-input").on("change", async ev => {
            ev.stopPropagation();

            const row = ev.currentTarget.closest(".effect-row");
            const effect = canvas.tokens.get(row.dataset.tokenId)?.actor?.effects.get(ev.currentTarget.dataset.eid);
            if (!effect) return;

            await updateSystemEffectLevel(effect, ev.currentTarget.value);
            this.render(true);
        });

        // Gruppe löschen
        html.find(".delete-group-btn").on("click", async ev => {
            ev.preventDefault(); ev.stopPropagation();

            for (const item of this.groupsMap[ev.currentTarget.dataset.groupId] || []) {
                const effect = canvas.tokens.get(item.tokenId)?.actor?.effects.get(item.effectId);
                if (effect) await effect.delete();
            }

            this.render(true);
        });

        // Einzelnen Effekt löschen
        html.find(".delete-single").on("click", async ev => {
            ev.preventDefault(); ev.stopPropagation();

            const row = ev.currentTarget.closest(".effect-row");
            const effect = canvas.tokens.get(row.dataset.tokenId)?.actor?.effects.get(row.dataset.effectId);
            if (!effect) return;

            await effect.delete();
            this.render(true);
        });
    }
}

/* ============================================================
   9 - STARTEN (SINGLETON)
   ============================================================ */

if (window.dskEffectManagerInstance?.rendered) {
    window.dskEffectManagerInstance.bringToTop();
} else {
    window.dskEffectManagerInstance = new DSKEffectManagerDialog();
    window.dskEffectManagerInstance.render(true);
}