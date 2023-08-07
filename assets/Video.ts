import { _decorator, assetManager, Canvas, CCBoolean, CCInteger, CCString, Component, error, ImageAsset, Node, Sprite, SpriteFrame, Texture2D, view, Widget } from 'cc';
import mpegts from 'mpegts.js';
const { ccclass, property } = _decorator;

@ccclass('Video')
export class Video extends Component {
    // 视频宽高
    @property({
        type: CCInteger,
        tooltip: "视频文件宽度"
    })
    width = 1280;
    @property({
        type: CCInteger,
        tooltip: "视频文件高度"
    })
    height = 720;

    _fit_width = this.width;
    _fit_height = this.height;

    // 视频地址
    @property({
        type: CCString,
        tooltip: "视频地址"
    })
    videoUrl = ''
    // 是否是直播
    @property({
        type: CCBoolean,
        tooltip: "是否是直播"
    })
    isLive = false;

    canvasRef: HTMLCanvasElement = null;
    ctxRef: CanvasRenderingContext2D = null;
    // 播放器实例
    player: any = null;
    videoRef: HTMLVideoElement = null;

    _widget: Widget = null;
    _img: ImageAsset = null;
    _texture: Texture2D = null;
    _sprite: Sprite = null;
    _spriteFrame: SpriteFrame = null;

    // 初始化完毕标志
    _inited = false;

    createPlayer() {
        this.videoRef = document.createElement("video");

        // this.videoRef.style.width = '100%';
        // this.videoRef.style.height = '100%';
        this.videoRef.style.width = this._fit_width + "px";
        this.videoRef.style.height = this._fit_height + "px";
        this.videoRef.style.objectFit = "cover";

        this.videoRef.src = this.videoUrl;
        this.videoRef.crossOrigin = "anonymous";
        this.videoRef.loop = true;
        this.videoRef.muted = false;
        this.videoRef.autoplay = true;
        this.videoRef.playsInline = true;
        this.videoRef.controls = false;

        if (this.isLive) {
            if (mpegts.getFeatureList().mseLivePlayback) {
                this.player = mpegts.createPlayer({
                    type: 'flv',  // 可以是flv ts格式
                    isLive: this.isLive,
                    hasAudio: true, // chrome似乎不支持
                    url: this.videoUrl
                });
                this.player.attachMediaElement(this.videoRef);
                this.player.load();
                this.player.play();
            }
        } else {
            // TODO convert PlayerApi 保持一致
            this.player = {
                play: () => this.videoRef.play(),
                pause: () => this.videoRef.pause(),
                stop: () => {
                    this.videoRef.pause();
                    this.videoRef.currentTime = 0;
                },
            }
        }

        try {
            // this.player.play();
        } catch (err) {
            console.log(err);
        }
    }
    createCanvas() {
        this.canvasRef = document.createElement("canvas");
        this.canvasRef.width = this._fit_width;
        this.canvasRef.height = this._fit_height;
        this.ctxRef = this.canvasRef.getContext("2d");
    }
    calcCanvasSize() {
        // const x_scale = view.getScaleX();
        // const y_scale = view.getScaleY();
        // this._fit_width = this.width * x_scale;
        // this._fit_height = this.height * y_scale;
        this._fit_width = this.width;
        this._fit_height = this.height;
    }
    initEnv() {
        !this.node.getComponent(Widget) && this.node.addComponent(Widget);
        this._widget = this.node.getComponent(Widget);
        this._widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        this._widget.isAlignLeft = true;
        this._widget.isAlignRight = true;
        this._widget.isAlignTop = true;
        this._widget.isAlignBottom = true;
        this._widget.left = 0;
        this._widget.right = 0;
        this._widget.top = 0;
        this._widget.bottom = 0;

        this.node.addComponent(Sprite);
        this._sprite = this.node.getComponent(Sprite);
        this._sprite.name = 'video_sprite'
        this._sprite.sizeMode = Sprite.SizeMode.TRIMMED;

        this._img = new ImageAsset();
        this._texture = new Texture2D();
        this._spriteFrame = new SpriteFrame();

        // 似乎不需要
        // this.calcCanvasSize();
        this.createCanvas();
        // 修复空格
        this.videoUrl = this.videoUrl.trim();
        if (!this.videoUrl) {
            throw new Error('请传入视频地址')
        }

        this.createPlayer();
    }
    bindEvents() {
        // 绑定点击事件,只要用户有操作就进行播放
        this.node.once(Node.EventType.TOUCH_START, () => {
            this.player && this.player.play();
        })
    }
    start() {
        try {
            this.initEnv();
            this.bindEvents();
            this._inited = true
        } catch (err) {
            this.drawError(err);
            this._inited = false
        }
    }
    // 在画布上提示错误信息
    drawError(err) {
        const anchorX = 300;  // 指定锚点的 X 坐标
        const anchorY = 300;  // 指定锚点的 Y 坐标
        this.draw(() => {
            this.ctxRef.font = "60px Arial";
            this.ctxRef.fillStyle = "red";
            this.ctxRef.textAlign = "center";
            this.ctxRef.textBaseline = "middle";
            // 错误信息裁切
            // const text = (() => {
            //     const block_s = []
            //     const len = 10
            //     let i = 0
            //     const s = String(err)
            //     while ((i += len) < s.length) {
            //         block_s.push(s.slice(i, i + len))
            //     }
            //     return block_s.join('\n\r')
            // })()
            this.ctxRef.fillText(err, anchorX, anchorY);
        })
    }
    draw(fn?: () => void) {
        this.ctxRef.clearRect(0, 0, this._fit_width, this._fit_height);
        fn ? fn() : this.ctxRef.drawImage(this.videoRef, 0, 0, this._fit_width, this._fit_height);
    }
    update() {
        this._inited && this.draw();

        !this._img && (this._img = new ImageAsset(this.canvasRef));
        !this._texture && (this._texture = new Texture2D());
        !this._sprite && (this._sprite = new Sprite());
        !this._spriteFrame && (this._spriteFrame = new SpriteFrame());

        // 一定要进行释放,因为cocos引擎会帮你进行缓存,如果不及时释放,会导致内存泄漏
        assetManager.releaseAsset(this._texture);
        this._texture = new Texture2D()
        // this._texture = null
        this._img._nativeAsset = this.canvasRef
        this._texture.image = this._img;
        this._spriteFrame.texture = this._texture;
        this._sprite.spriteFrame = this._spriteFrame
    }
}


