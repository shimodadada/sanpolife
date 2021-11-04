// 画面の切り替え
const main = document.querySelector("main");

// 計測系の変数
let startTime; // 計測開始時間
let finishTime; // 計測終了時間
let totalTime; // 計測時間の合計
let SetTime; // setIntervalを止めるために必要な変数
let SelectedWeight; // 体重が入る変数

// GPSの計測の開始と終了を切り替えるためのID
let GPS_ID;

// GPSを使用する時の変数
const data = {
  count: 0, // 実行回数
  lastTime: 0, // 更新日時
  lastLat: 0, // 前回の緯度 latitube
  lastLot: 0, // 前回の経度 longitube
  latDis: 0, // 緯度の差分の距離 latitube distance
  lotDis: 0, // 経度の差分の距離 longitube distance
  walkDis: 0, // 実際に移動した距離 walking distance
  totalWalkDis: 0, // 実際に移動した距離の合計 total walking distance
};

// GSP取得オプション・オブジェクト
var optionObj = {
  enableHighAccuracy: false,
  timeout: 1000000,
  maximumAge: 0,
};

// 赤道の半径の長さ(m:メートル)
const equatorial_radius = 637837;

// 最初の画面の体重選択で「0kg~299kgまで」を範囲に設定する
for (let i = 30; i < 100; i++) {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = i + "kg";
  document.getElementById("weight").appendChild(option);
}

// 計測開始ボタンが押された時
function StartMeasure() {
  // 　ページトップに戻る
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  // 画面の切り替え
  main.classList.remove("first");
  main.classList.add("second");
  main.classList.remove("third");

  // 計測開始時の時間を取得
  startTime = new Date();

  // 体重の取得
  SelectedWeight = document.getElementById("weight");
  console.log("体重: " + SelectedWeight.value + "kg");

  // GPSから移動距離を測定する処理をスタート
  GPS_ID = navigator.geolocation.watchPosition(
    successFunc,
    errorFunc,
    optionObj
  );

  // 移動距離を書き換える要素を取得
  const WalkDistance = document.getElementById("WalkDistance");

  // 移動距離を3秒間隔で表示(SetTimeに格納しておく)
  SetTime = setInterval(function () {
    // HTMLを書き換えて瞬間の移動距離を表示
    WalkDistance.textContent = Math.floor(data.totalWalkDis * 1000) / 1000;
    console.log("計測中");
  }, 3000);
}

// 計測終了ボタンが押された時
function StopMeasure() {
  // ページトップに戻る
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  // 画面の切り替え
  main.classList.remove("first");
  main.classList.remove("second");
  main.classList.add("third");

  // 計測終了時の時間を取得
  finishTime = new Date();

  // 最終的な計測時間を計算
  const ST_Unix = startTime.getTime(); // StartTimeをUNIXで取得する 経過時間を計算するため
  const FT_Unix = finishTime.getTime(); // FinishTimeをUNIXで取得する 経過時間を計算するため
  totalTime = FT_Unix - ST_Unix; //UNIXの差を計算して計測時間を出す
  totalTime = Math.floor(totalTime / 1000); //UNIXの下3ケタはミリ秒なので除外する

  console.log("計測開始時間: " + ST_Unix + " (UNIX Ver)");
  console.log("計測終了時間: " + FT_Unix + " (UNIX Ver)");
  console.log("計測時間: " + totalTime + "秒");

  //計測終了時の時間を秒から時間に変更
  const totalTimeHour = totalTime / 3600;
  console.log("計測時間: " + totalTimeHour + "時間");

  // GPSから移動距離を測定する処理をストップ
  navigator.geolocation.clearWatch(GPS_ID);

  // 移動距離を3秒間隔で表示をストップする(裏でいつまでも処理されるのを防ぐため)
  clearInterval(SetTime);

  // 移動距離の合計の表示する要素を取得
  const TotalWalkDistance = document.getElementById("TotalWalkDistance");

  // 移動距離の合計の単位をkmに変換
  const kmWalkDis = data.totalWalkDis / 1000;
  console.log("移動距離の合計: " + kmWalkDis + "km");

  // 移動距離の合計を画面に表示
  TotalWalkDistance.textContent = Math.floor(kmWalkDis * 1000) / 1000;

  // 平均の速度(km/h)
  const AverageSpeed = kmWalkDis / totalTimeHour;
  console.log("平均の速さ: " + AverageSpeed + "km/h");

  // カロリーを書き換える要素を取得
  const Calorie = document.getElementById("Calorie");

  // カロリーを計算して画面に表示
  let METs = 3; // 徒歩の時
  if (AverageSpeed > 6) {
    // 早歩きの時
    METs = 5;
  }
  Calorie.textContent =
    Math.floor(METs * kmWalkDis * SelectedWeight.value * 1.05 * 1000) / 1000;

  // 体重を取得して書き換える要素を取得
  const todayWeight = document.getElementById("weightShow");
  todayWeight.textContent = SelectedWeight.value;

  // 平均移動速度表示
  const movingSpeedAverage = document.getElementById("movingAverage");
  movingSpeedAverage.textContent = Math.floor(AverageSpeed);
}

// 「明日も頑張ろう」を押した時
function Reset() {
  document.location.reload();
}

/*

    緯度・経度から移動距離を求める際に必要な公式

    ・円の孤の長さを求める公式
        L = 2πr
    ・扇方の孤の長さを求める公式
        l = 2πr × 中心角 ÷ 360
    ・三平方の定理
        a^2 + b^2 = c^2

*/

// GPS取得に成功した時の関数
function successFunc(position) {
  // データの更新
  var nowTime = ~~(new Date() / 1000); // UNIX Timestamp ~~は小数点切り捨ての意味

  // 実行回数を1追加
  ++data.count;
  console.log(data.count + "回目");

  // 前回の書き出しから3秒以上経過していたら描写
  // 毎回HTMLに書き出していると、ブラウザがフリーズするため
  if (data.lastTime + 3 > nowTime) {
    return false;
  }

  // 前回の時間を更新
  data.lastTime = nowTime;

  /*

        緯度の変化から南北方向の移動距離を求める式

        ・円の孤の長さを求める公式
            L = 2πr
        ・扇方の孤の長さを求める公式
            l = 2πr × 中心角 ÷ 360

        【定義】
            中心角 = 緯度
            r : 赤道の半径 637837m

            l1 : 変化前の孤
                    l1 = 2πr × 緯度1 ÷ 360
            l2 : 変化後の孤
                    l2 = 2πr × 緯度2 ÷ 360
        
        【孤の差分の長さ】
            差分の長さ = l2 - l1

        【緯度から南北方向の移動距離を求める式】
            南北方向の移動距離 = 2πr × (緯度2 - 緯度1) ÷ 360

        【JavaScript】
            π : Math.PI
            緯度2 : position.coords.latitude
            緯度1 : data.lastLat [グローバル変数]
            r : equatorial_radius [グローバル変数]

    */

  // 緯度の差分の距離をグローバル変数に格納
  data.latDis =
    (2 *
      Math.PI *
      equatorial_radius *
      (position.coords.latitude - data.lastLat)) /
    360;

  /*

        経度度の変化から東西方向の移動距離を求める式

        ・円の孤の長さを求める公式
            L = 2πr
        ・扇方の孤の長さを求める公式
            l = 2πr × 中心角 ÷ 360

        【定義】
            中心角 = 経度
            R : 緯度の位置によって変化する
                赤道の半径r × cosθ

            θ : 緯度 × π / 180

            l1 : 変化前の孤 l1 = 2πR × 緯度1 ÷ 360
            l2 : 変化後の孤 l2 = 2πR × 緯度2 ÷ 360
        
        【孤の差分の長さ】
            差分の長さ = l2 - l1

        【経度から東西方向の移動距離を求める式】
            東西方向の移動距離 = 2πR × (経度2 - 経度1) ÷ 360
                            = 2πr × cosθ × (経度2 - 経度1) ÷ 360
                            = 2πr × cos(緯度1 × π / 180) × (経度2 - 経度1) ÷ 360

        【JavaScript】
            π : Math.PI
            経度2 : position.coords.longitude
            経度1 : data.lastLot [グローバル変数]
            r : equatorial_radius [グローバル変数]
            cosθ : Math.cos(経度の差の角度)

    */

  // 経度の差分の距離をグローバル変数に格納
  data.lotDis =
    (2 *
      Math.PI *
      equatorial_radius *
      Math.cos((data.lastLat * Math.PI) / 180) *
      (position.coords.longitude - data.lastLot)) /
    360;

  /*

        緯度と経度のそれぞれの差分距離から実際の移動距離を求める式

        ・三平方の定理
            a^2 + b^2 = c^2

        【定義】
            c : 実際の移動距離
            a : 緯度の差分距離
            b : 経度の差分距離

        【実際の距離】
            c = √a^2 + b^2

        【JavaScript】
            c : data.walkDis [グローバル変数]
            a : data.latDis [グローバル変数]
            b : data.lotDis [グローバル変数]

            √ (平方根) : Math.sqrt(値)

    */

  // 2回目以降の実行から表示 (1回目は緯度・経度の比較が出来ないから)
  if (data.count > 1) {
    // 実際の移動距離をグローバル変数に格納 単位; メートル
    data.walkDis = Math.sqrt(data.latDis ** 2 + data.lotDis ** 2);

    // 移動距離の合計を加算していく
    data.totalWalkDis =
      data.totalWalkDis + Math.floor(data.walkDis * 1000) / 1000;
  }

  // 緯度と経度の更新
  data.lastLat = position.coords.latitude; // 緯度
  data.lastLot = position.coords.longitude; // 経度
}

// GPS取得に失敗した時の関数
function errorFunc(error) {
  // エラーコードのメッセージを定義
  var errorMessage = {
    0: "原因不明のエラーが発生しました…。",
    1: "位置情報の取得が許可されませんでした…。",
    2: "電波状況などで位置情報が取得できませんでした…。",
    3: "位置情報の取得に時間がかかり過ぎてタイムアウトしました…。",
  };

  // エラーコードに合わせたエラー内容を表示
  alert(errorMessage[error.code]);
}
