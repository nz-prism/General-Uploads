//=============================================================================
// RPG Maker MZ - MessageBackground
//=============================================================================

/*:
 * @target MZ
 * @plugindesc メッセージウィンドウに任意の画像を使用できるようにするプラグインです。
 * @author nz_prism
 *
 * @help MessageBackground.js
 * ver. 1.0.0
 * 
 * [バージョン履歴]
 * 2022/11/28 1.0.0 リリース
 * 
 * メッセージウィンドウに任意の画像を使用できるようにするプラグインです。
 * まずプラグインパラメータ「背景画像リスト」にキャラクター名と、そのキャラク
 * ターに紐づける背景画像を設定してください。実際にメッセージイベントを設定す
 * る際、その名前を名前欄に入力し、かつ背景に「透明」を設定することで設定され
 * た画像が表示されるようになります。
 * プラグインパラメータ「メッセージオフセットX(Y)」は制御文字「\PX(\PY)」と
 * 同様に、メッセージ全体をずらす値です。メッセージの表示位置がずれている場合、
 * このパラメータで調整してください。
 * プラグインパラメータ「ポーズサインオフセットX(Y)」はメッセージ停止時に表示
 * されるポーズアイコン（▼）をずらす値です。ポーズサインの表示位置を調整する場
 * 合に使用してください。
 * 
 * 
 * 利用規約については別紙「ソフトウェア使用許諾契約書」をご覧ください。
 * 
 * 
 * @param messageOffsetX
 * @text メッセージオフセットX
 * @desc メッセージ全体を水平方向にずらす値です。
 * @default 64
 * @type number
 * @max 10000
 * @min -10000
 * 
 * @param messageOffsetY
 * @text メッセージオフセットY
 * @desc メッセージ全体を垂直方向にずらす値です。
 * @default 64
 * @type number
 * @max 10000
 * @min -10000
 * 
 * @param pauseSignOffsetX
 * @text ポーズサインオフセットX
 * @desc ポーズサインを水平方向にずらす値です。
 * @default 0
 * @type number
 * @max 10000
 * @min -10000
 * 
 * @param pauseSignOffsetY
 * @text ポーズサインオフセットY
 * @desc ポーズサインを垂直方向にずらす値です。
 * @default -24
 * @type number
 * @max 10000
 * @min -10000
 * 
 * @param backgroundPictures
 * @text 背景画像リスト
 * @desc キャラクター名に関連づけられる背景画像のリストです。
 * @default []
 * @type struct<picture>[]
 * 
 * 
 */

/*~struct~picture:
 *
 * @param name
 * @text 名前
 * @desc メッセージの名前欄に入力する話者の名前です。
 * @type string
 * 
 * @param pictureName
 * @text ピクチャ名
 * @desc メッセージの背景として使用するピクチャの名前です。
 * @type file
 * @dir img/system
 * 
 */

(() => {
    'use strict';
    const PLUGIN_NAME = "MessageBackground";
    const pluginParams = PluginManager.parameters(PLUGIN_NAME);

    const MESSAGE_OFFSET_X = Number(pluginParams.messageOffsetX);
    const MESSAGE_OFFSET_Y = Number(pluginParams.messageOffsetY);

    const PAUSE_SIGN_OFFSET_X = Number(pluginParams.pauseSignOffsetX);
    const PAUSE_SIGN_OFFSET_Y = Number(pluginParams.pauseSignOffsetY);

    const BACKGROUND_PICTURES = {};
    for (const str of JSON.parse(pluginParams.backgroundPictures)) {
        const obj = JSON.parse(str);
        if (obj) BACKGROUND_PICTURES[obj.name] = obj.pictureName;
    }


    Game_Message.prototype.backgroundPictureName = function() {
        return BACKGROUND_PICTURES[this._speakerName];
    };

    Game_Message.prototype.doesUseBackgroundPicture = function() {
        return this._background === 2 && !!this.backgroundPictureName();
    };


    const _Scene_Boot_prototype_loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {
        _Scene_Boot_prototype_loadSystemImages.call(this);
        Object.values(BACKGROUND_PICTURES).forEach(pictureName => ImageManager.loadSystem(pictureName));
    };


    Scene_Message.prototype.messageWindowRect = function() {
        const ww = Graphics.width;
        const wh = this.calcWindowHeight(4, false) + 8;
        const wx = (Graphics.width - ww) / 2;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };


    const _Window_Message_prototype_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function(rect) {
        _Window_Message_prototype_initialize.call(this, rect);
        const sprite = new Sprite();
        this._backgroundSprite = sprite;
        this.addChildToBack(sprite);
    };

    const _Window_Message_prototype_newLineX = Window_Message.prototype.newLineX;
    Window_Message.prototype.newLineX = function(textState) {
        const x = _Window_Message_prototype_newLineX.call(this, textState);
        return x + ($gameMessage.doesUseBackgroundPicture() ? MESSAGE_OFFSET_X : 0);
    };

    Window_Message.prototype.newPage = function(textState) {
        this.contents.clear();
        this.resetFontSettings();
        this.clearFlags();
        this.updateSpeakerName();
        this.loadMessageFace();
        textState.x = textState.startX;
        textState.y = 0 + ($gameMessage.doesUseBackgroundPicture() ? MESSAGE_OFFSET_Y : 0);
        textState.height = this.calcTextHeight(textState);
    };

    Window_Message.prototype._refreshPauseSign = function() {
        Window.prototype._refreshPauseSign.call(this);
        if ($gameMessage.doesUseBackgroundPicture()) {
            const sprite = this._pauseSignSprite;
            sprite.x += PAUSE_SIGN_OFFSET_X;
            sprite.y += PAUSE_SIGN_OFFSET_Y;
        }
    };

    Window_Message.prototype.updateBackgroundDimmer = function() {
        Window_Base.prototype.updateBackgroundDimmer.call(this);
        const sprite = this._backgroundSprite;
        if (sprite) sprite.opacity = this.openness;
    };

    const _Window_Message_prototype_updatePlacement = Window_Message.prototype.updatePlacement
    Window_Message.prototype.updatePlacement = function() {
        const backgroundPictureName = $gameMessage.backgroundPictureName();
        if (backgroundPictureName && $gameMessage.background() === 2) {
            const bitmap = ImageManager.loadSystem(backgroundPictureName);
            this.width = bitmap.width;
            this.height = bitmap.height;
            this._backgroundSprite.bitmap = bitmap;
        } else {
            this.width = Graphics.width;
            this.height = this.fittingHeight(4) + 8;
            this._backgroundSprite.bitmap = null;
        }
        this.x = (Graphics.width - this.width) / 2;
        this._refreshPauseSign();
        _Window_Message_prototype_updatePlacement.call(this);
    };


})();
