import { _decorator, assetManager, Canvas, CCBoolean, CCInteger, CCString, Component, error, ImageAsset, LODGroup, Node, Sprite, SpriteFrame, Texture2D, view, Widget } from 'cc';
import mpegts from 'mpegts.js';
const { ccclass, requireComponent, property, } = _decorator;

@ccclass('Video')
@requireComponent([Widget, Sprite])
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

    // 交互标志
    isInteractive = false;

    start() {
        this.init();
    }
    update() {
        this._inited && this.draw();
        if (this.canvasRef && this.ctxRef) {
            !this._img && (this._img = new ImageAsset(this.canvasRef));
            !this._texture && (this._texture = new Texture2D());
            !this._sprite && (this._sprite = new Sprite());
            !this._spriteFrame && (this._spriteFrame = new SpriteFrame());
            // 一定要进行释放,因为cocos引擎会帮你进行缓存,如果不及时释放,会导致内存泄漏
            assetManager.releaseAsset(this._texture);
            this._texture = new Texture2D()
            this._img._nativeAsset = this.canvasRef
            this._texture.image = this._img;
            this._spriteFrame.texture = this._texture;
            this._sprite.spriteFrame = this._spriteFrame
        }
    }
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
    // 初始化环境变量信息
    initEnvironmentalInformation() {
        // firefox不支持
        this.isInteractive = navigator.userActivation?.isActive || false;

        // 检测视频地址
        this.videoUrl = this.videoUrl.trim();
        if (!this.videoUrl) {
            throw new Error('请传入视频地址')
        }

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

        this._sprite = this.node.getComponent(Sprite);
        this._sprite.name = 'video_sprite'
        this._sprite.sizeMode = Sprite.SizeMode.TRIMMED;

        this._img = new ImageAsset();
        this._texture = new Texture2D();
        this._spriteFrame = new SpriteFrame();

        // 直接创建画布以及播放器实例
        this.createCanvas();
        this.createPlayer();
    }
    bindAutoPlay() {
        // 绑定点击事件,只要用户有操作就进行播放
        this.node.once(Node.EventType.TOUCH_START, () => {
            this.player && this.player.play();
        })
    }
    init(): void {
        try {
            this.initEnvironmentalInformation();
            if (this.isInteractive && this.videoRef.paused) {
                this.player.play();
            }
            else {
                this.bindAutoPlay();
            }
            this._inited = true
        } catch (err) {
            console.error(err);
            this._inited = false
        }
    }
    draw(fn?: () => void) {
        if (this.ctxRef) {
            this.ctxRef.clearRect(0, 0, this._fit_width, this._fit_height);
            fn ? fn() : this.ctxRef.drawImage(this.videoRef, 0, 0, this._fit_width, this._fit_height)
        }
    }
}


