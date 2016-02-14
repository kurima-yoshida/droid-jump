/**
 * DROID JUMP v1.0
 *
 * Copyright (c) 2016 Kurima Yoshida
 * Released under the MIT license.
 */

enchant();

window.onload = function() {

  // 定数
  var GAME_MODE_NORMAL = 0;
  var GAME_MODE_HARD = 1;
  var SCREEN_W = 640;
  var SCREEN_H = 480;
  var SCORE_DIGIT = 6;

  var gameMode = GAME_MODE_NORMAL;
  var normalHiScore = 0;
  var hardHiScore = 0;

  var game = new Game(SCREEN_W, SCREEN_H);

  // 画面中央に表示
  var left = (window.innerWidth - (game.width * game.scale)) / 2;
  var enchantStage = document.getElementById('enchant-stage');
  enchantStage.style.position = "absolute";
  enchantStage.style.left = left + "px";
  game._pageX = left;

  game.fps = 30;
  game.preload('./img/title.png', './img/player.png', './img/block.png',
      './img/bg.png', './img/score.png', './img/hiscore.png',
      './img/number.png');
  game.preload('./sound/se_jump.mp3', './sound/se_fall.mp3');
  game.preload('./sound/bgm_stage.mp3');

  game.onload = function() {

    // タイトルシーンを作成し返す
    var createTitleScene = function() {
      var scene = new Scene();

      scene.backgroundColor = '#000000';

      var titleSprite = new Sprite(640, 480);
      titleSprite.image = game.assets['./img/title.png'];
      titleSprite.x = 0;
      titleSprite.y = 0;
      scene.addChild(titleSprite);

      // シーンにタッチイベントを設定
      scene.addEventListener(Event.TOUCH_START, function(e) {
        game.replaceScene(createGameScene());
      });

      return scene;
    };

    var createGameScene = function() {
      var BLOCK_NUM = 24; // ブロックの数
      var PLAYER_W = 24; // 大きさの半分
      var PLAYER_H = 34; // 大きさの半分
      var BLOCK_W = 54 / 2; // 大きさの半分
      var BLOCK_H = 8; // 大きさの半分
      var JUMP_POWER = 20; // ジャンプ力
      var DIFFICULTY = 16384; // 難易度上昇係数

      var BG_W = 256;
      var BG_H = 256;

      var playerX, playerY, playerVX, playerVY; // プレイヤーキャラ
      var blockX = new Array(BLOCK_NUM); // ブロック
      var blockY = new Array(BLOCK_NUM); // ブロック
      var blockAlpha = new Array(BLOCK_NUM); // ブロック

      var screenY; // 画面下端のy座標
      var nextBlockY; // 次に配置するブロックのy座標
      var score; // スコア

      var playerDirection = 0; // プレイヤーキャラの向いてる方向（0 だと右  1 だと左）
      var playerMotion = 0; // モーション（0 だと普通  1だとジャンプ中）

      var playerSprite = new Sprite(48, 74);
      var blockSprites = new Array(BLOCK_NUM);
      var bgSprites = new Array(
          (Math.ceil(SCREEN_W / BG_W) + 1) * (Math.ceil(SCREEN_H / BG_H) + 1));

      var scoreSprite = new Sprite(256, 16);
      var hiscoreSprite = new Sprite(256, 16);

      var scoreNumberSprites = new Array(SCORE_DIGIT);
      var hiscoreNumberSprites = new Array(SCORE_DIGIT);

      var bLeftKey = false;
      var bRightKey = false;

      var i;
      var s;

      // シーン作成
      var scene = new Scene();
      scene.backgroundColor = '#000000';

      // 初期化
      score = 0;
      screenY = 0;
      playerX = 320;
      playerY = 100;
      playerVX = 0;
      playerVY = -10;

      playerDirection = 0;
      playerMotion = 0;

      // 初期ブロック作成
      nextBlockY = playerY - PLAYER_H;
      blockX[0] = playerX;
      blockY[0] = nextBlockY;
      blockAlpha[0] = 0;
      for (i = 1; i < BLOCK_NUM; i++) {
        nextBlockY = nextBlockY + 20;
        blockX[i] = (Math.random() * (SCREEN_W - BLOCK_W * 2)) + BLOCK_W;
        blockY[i] = nextBlockY;
        blockAlpha[i] = 0;
      }

      // スプライト作成

      // 背景
      for (i = 0; i < bgSprites.length; i++) {
        s = new Sprite(BG_W, BG_H);
        s.image = game.assets['./img/bg.png'];
        scene.addChild(s);
        bgSprites[i] = s;
      }

      // ブロック
      for (i = 0; i < BLOCK_NUM; i++) {
        s = new Sprite(54, 16);
        s.image = game.assets['./img/block.png'];
        s.x = blockX[i];
        s.y = blockY[i];
        scene.addChild(s);

        blockSprites[i] = s;
      }

      // プレイヤー
      playerSprite.image = game.assets['./img/player.png'];
      playerSprite.x = 100;
      playerSprite.y = 120;
      scene.addChild(playerSprite);

      // スコア
      scoreSprite.image = game.assets['./img/score.png'];
      scoreSprite.x = 8;
      scoreSprite.y = 10;
      scene.addChild(scoreSprite);

      // ハイスコア
      hiscoreSprite.image = game.assets['./img/hiscore.png'];
      hiscoreSprite.x = 8;
      hiscoreSprite.y = 32;
      scene.addChild(hiscoreSprite);

      // スコアの数字、ハイスコアの数字
      for (i = 0; i < SCORE_DIGIT; i++) {
        s = new Sprite(13, 16);
        s.image = game.assets['./img/number.png'];
        s.x = 184 - 14 * i;
        s.y = 4;
        scene.addChild(s);
        scoreNumberSprites[i] = s;
      }
      for (i = 0; i < SCORE_DIGIT; i++) {
        s = new Sprite(13, 16);
        s.image = game.assets['./img/number.png'];
        s.x = 184 - 14 * i;
        s.y = 26;
        scene.addChild(s);
        hiscoreNumberSprites[i] = s;
      }

      scene.addEventListener(Event.ENTER, function() {
        if (game.assets['./sound/bgm_stage.mp3'].src) {
          game.assets['./sound/bgm_stage.mp3'].play();
          game.assets['./sound/bgm_stage.mp3'].src.loop = true;
        }
      });

      // シーンに毎フレームイベントを設定
      scene.addEventListener(Event.ENTER_FRAME, function() {
        // BGM再生(ループ再生)
        if (!game.assets['./sound/bgm_stage.mp3'].src) {
          game.assets['./sound/bgm_stage.mp3'].play();
        }

        // キー入力
        if (bLeftKey) {
          playerDirection = 1;
          playerVX--;
        }
        if (bRightKey) {
          playerDirection = 0;
          playerVX++;
        }

        // 当たり判定とか
        var hitY = 0;
        for (i = 0; i < BLOCK_NUM; i++) {
          a = blockY[i] + PLAYER_H;
          if ((blockX[i] - BLOCK_W < playerX + PLAYER_W) &&
              (playerX - PLAYER_W < blockX[i] + BLOCK_W) &&
              (playerY >= a) &&
              (playerY + playerVY < a) &&
              blockAlpha[i] === 0) { // 透明度が0でないとブロックにあたらない
              if (a > hitY) {
              if (gameMode == GAME_MODE_HARD) {
                blockAlpha[i] = 1;
              }
              hitY = a;
            }
          }
        }

        if (hitY > 0) {
          // ジャンプ
          playerY = hitY;
          playerVY = JUMP_POWER;
          game.assets['./sound/se_jump.mp3'].clone().play();
        }

        // プレイヤーを移動させる
        playerX = playerX + playerVX;
        playerY = playerY + playerVY;

        if (playerX < -PLAYER_W) playerX = 640 + PLAYER_W;
        if (playerX > 640 + PLAYER_W) playerX = -PLAYER_W;

        if (playerY - screenY + PLAYER_H < 0) {
          // ゲームオーバー
          // タイトルへ
          game.replaceScene(createTitleScene());
          // 音楽停止
          game.assets['./sound/bgm_stage.mp3'].stop();
          // 落下音再生
          game.assets['./sound/se_fall.mp3'].clone().play();
          return;
        }

        // 重力かける
        playerVY--;

        // スクロール
        if (playerY - screenY > 350) {
          a = playerY - 350;
          // スクロールした量によって得点get
          score += (a - screenY);
          if (gameMode == GAME_MODE_NORMAL) {
            // ハイスコア更新
            if (score > normalHiScore) normalHiScore = score;
          } else if (gameMode == GAME_MODE_HARD) {
            // ハイスコア更新
            if (score > hardHiScore) hardHiScore = score;
          }
          screenY = a;
        }

        // ブロックが画面下に出たら画面上に移動
        for (i = 0; i < BLOCK_NUM; i++) {
          if (blockY[i] - screenY < 0) {
            // 幅の最大値
            a = JUMP_POWER * (JUMP_POWER + 1) / 2;
            // 幅を適当に決める
            a = a + 0 - ((a - 20) * DIFFICULTY) / (screenY + DIFFICULTY);
            nextBlockY = nextBlockY + a;
            blockX[i] = (Math.random() * (SCREEN_W - BLOCK_W * 2)) + BLOCK_W;
            blockY[i] = nextBlockY;
            // 透明度を元に戻す
            blockAlpha[i] = 0;
          }
        }

        // モーションをセット
        if (playerVY < 0) {
          // モーションが一瞬普通に戻る
          playerMotion = 0;
        } else {
          // モーションをジャンプ中にしておく
          playerMotion = 1;
        }

        // 背景スクロール
        var index = 0;
        for (i = (screenY * 2 / 3) % BG_H - BG_H; i < SCREEN_H; i += BG_H) {
          for (j = 0; j < SCREEN_W; j = j + BG_W) {
            bgSprites[index].visible = true;
            bgSprites[index].x = j;
            bgSprites[index].y = i;
            index++;
          }
        }
        for (i = index; i < bgSprites.length; ++i) {
          bgSprites[i].visible = false;
        }

        // ブロック位置設定
        for (i = 0; i < BLOCK_NUM; i++) {
          blockSprites[i].x = blockX[i] - BLOCK_W;
          blockSprites[i].y = SCREEN_H - (blockY[i] - screenY) - BLOCK_H;
        }

        // プレイヤーキャラを描画
        playerSprite.x = playerX - 24;
        playerSprite.y = SCREEN_H - (playerY - screenY) - 37; {
          var frame = 0;
          if (playerMotion !== 0) {
            frame += 1;
          }
          if (playerDirection !== 0) {
            frame += 2;
          }
          playerSprite.frame = frame;
        }

        // スコア描画
        var hiscore = normalHiScore;
        if (gameMode == GAME_MODE_HARD) {
          hiscore = hardHiScore;
        }
        for (i = 0; i < SCORE_DIGIT; i++) {
          scoreNumberSprites[i].frame = (score / (Math.pow(10, i)) % 10);
          hiscoreNumberSprites[i].frame = (hiscore / (Math.pow(10, i)) % 10);
        }
      });

      scene.addEventListener(Event.TOUCH_START, function(e) {
        bLeftKey = false;
        bRightKey = false;
        if (e.localX < SCREEN_W / 2) {
          bLeftKey = true;
        } else {
          bRightKey = true;
        }
      });

      scene.addEventListener(Event.TOUCH_END, function(e) {
        bLeftKey = false;
        bRightKey = false;
      });

      scene.addEventListener(Event.TOUCH_MOVE, function(e) {
        bLeftKey = false;
        bRightKey = false;
        if (e.localX < SCREEN_W / 2) {
          bLeftKey = true;
        } else {
          bRightKey = true;
        }
      });

      return scene;
    };

    game.replaceScene(createTitleScene());

  };

  game.start();

};
