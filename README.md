# README

##　首先要说明一个前提

这个demo仅仅适用于web端,但是思路应该是通用的,其它端需要你自己适配移植。

##　起因仅仅是我们需要一个视频流作为背景

没想到这么简单一个需求，但是在cocos中实现没想到这么麻烦。官方仅仅只有`videoplayer`组件，但是功能实在是过于弱鸡，仅仅支持简单的视频播放，无法播放一个直播流。

经过一番研究发现，官方是支持`webview`组件的，那不是就好办了吗，能上web啥玩意实现不了？然而事实是我太天真了，当我把这个组件放到页面上，发现它的层级是最高的，而且根本没有地方可以去调整！由于它的webview和渲染层是直接分离出现的，所以是无法在项目中进行调整的。这样就只能修改源代码了，于是我往页面里添加了一点css,让canvas的层级高于`webview`的内容层，重新编译引擎后发现是可行的。canvas上的内容确实跑到`webview`视频上方了（注意，你必须保证你的canvas背景层变成透明的，这个简单，在项目里设置一下canvas透明就可以了），但是新的麻烦出现了，由于你的canvas层级更高,这就意味着你无法和更下层的元素进行交互，你可能会觉得，就一个视频，让它一直播放不就行了，要啥交互，但是它的webview是iframe实现的，这意味着你的视频想自动播放都成了大问题（现在大部分浏览器都必须由用户交互过一次页面才允许播放）！不动的视频,这实在太扯蛋了~然后还发现一个很不爽的点,这个`webview`是不支持加载项目内的html文件的,虽然不是很大的问题,但是一想到一个项目要为几个html文件再部署一个项目,就很TAT~

期间也找了其他方案，发现都不太行,好在最后曙光还是出现了~

我在github上看到了这个项目：
https://github.com/452010348/live_streaming

研究了一下源代码，思路很新奇，通过将video标签上的内容绘制到canvas上，然后通过一些cocos的api去生成2d纹理，再将内容绘制到一个精灵身上，画面就可以在预览中出现了~

## 一顿移植之后，终于可以用了

经过移植后,只需要将这个脚本挂载到一个2d节点上,既可以开启视频背景.项目中直播是用`mpegts.js`实现的,理论上可以改成任何你喜欢的播放器,只要video上能出现画面,这一套流程就是可行的~

##　遇到的一个大坑

2d纹理不自动释放,这个问题确实花了不少时间.我在播放几分钟之后,chrome的内存占用从几百M直接暴涨到了3个G,再往后页面就会出现卡顿.原因是cocos引擎会帮你缓存一些你使用过的资源,如果你不手动释放,那么内存占用就会一直增加.这么做的好处是,资源缓存复用很方便,但是如果你是像我这样的动态加载资源场景,一定要记得释放前边的资源.具体看下方链接:

https://docs.cocos.com/creator/manual/zh/asset/release-manager.html?h=%E8%B5%84%E6%BA%90%E9%87%8A%E6%94%BE

然后我添加了一行代码就解决了这个问题:

```js
assetManager.releaseAsset(this._texture);
```
