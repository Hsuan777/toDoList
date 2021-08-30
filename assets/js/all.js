"use strict";

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDQv3-yDg_Fu6UVZYz9YWMbh3ka1m8NwiA",
  authDomain: "webtest2-c2d0c.firebaseapp.com",
  databaseURL: "https://webtest2-c2d0c-default-rtdb.firebaseio.com",
  projectId: "webtest2-c2d0c",
  storageBucket: "webtest2-c2d0c.appspot.com",
  messagingSenderId: "1003425564921",
  appId: "1:1003425564921:web:31710ac40e85a41bbbba28"
}; // Initialize Firebase

firebase.initializeApp(firebaseConfig); // firebase 資料庫

var db = firebase.database(); // Vue

var app = Vue.createApp({
  data: function data() {
    return {
      toDoList: {},
      toDo: '',
      hasLogin: false,
      uid: '',
      totalTime: 0,
      seconds: 60,
      minutes: 25,
      countDown: null,
      started: false,
      percent: 0
    };
  },
  methods: {
    getData: function getData() {
      var vm = this; // 取得屬性值

      db.ref("".concat(vm.uid)).on('value', function (snapshot) {
        vm.toDoList = snapshot.val() || {};
      });
    },
    postData: function postData() {
      if (!this.toDo.trim()) {
        return;
      } // 取得推送亂數 ID


      var key = db.ref("".concat(this.uid)).push().key; // 推送，在子層建立資料

      db.ref("".concat(this.uid)).child(key).set({
        // 加入相同 key 值，方便刪除
        key: key,
        toDo: this.toDo,
        date: new Date().getTime()
      });
      this.toDo = '';
    },
    deleteData: function deleteData(key) {
      db.ref("".concat(this.uid)).child(key).remove();
    },
    deleteAll: function deleteAll() {
      db.ref("".concat(this.uid)).remove();
    },
    // google 登入
    googleLogin: function googleLogin() {
      var provider = new firebase.auth.GoogleAuthProvider();
      var vm = this;
      firebase.auth().signInWithPopup(provider).then(function (result) {
        // 可以獲得 Google 提供 token，token可透過 Google API 獲得其他數據。
        // const credential = result.credential;
        // const token = result.credential.accessToken;
        // const user = result.user;
        vm.onAuthState();
      });
    },
    facebookLogin: function facebookLogin() {
      var provider = new firebase.auth.FacebookAuthProvider();
      var vm = this;
      provider.addScope('user_birthday');
      provider.setCustomParameters({
        'display': 'popup'
      });
      firebase.auth().signInWithPopup(provider).then(function (result) {
        // 取得FB Token，可以使用於FB API中
        var token = result.credential.accessToken; // 使用者資料

        var FBUser = result.user;
        console.log(FBUser);
        vm.onAuthState();
      });
    },
    // 登出
    signOut: function signOut() {
      var _this = this;

      firebase.auth().signOut().then(function () {
        _this.onAuthState();

        alert('已登出');
      });
    },
    // 監聽登入狀態
    onAuthState: function onAuthState() {
      var vm = this;
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          console.log("User is logined");
          vm.hasLogin = true;
          vm.uid = user.uid;
          vm.getData();
        } else {
          console.log("User is not logined yet.");
          vm.cleanData();
        }
      });
    },
    cleanData: function cleanData() {
      this.hasLogin = false;
      this.toDoList = {};
      this.uid = '';
    },
    start: function start() {
      var _this2 = this;

      this.started = true;
      this.countDown = setInterval(function () {
        _this2.totalTime -= 1;

        if (_this2.totalTime === 0) {
          clearInterval(_this2.countDown);
        }
      }, 1000);
    },
    stop: function stop() {
      this.started = false;
      clearInterval(this.countDown);
    },
    reStart: function reStart() {
      this.started = false;
      this.totalTime = this.minutes * this.seconds;
      clearInterval(this.countDown);
    },
    formatTime: function formatTime(num) {
      if (num < 10) {
        return '0' + num;
      } else {
        return num;
      }
    }
  },
  computed: {
    timeLeft: function timeLeft() {
      var min = Math.floor(this.totalTime / 60);
      var sec = this.totalTime % 60;
      return "".concat(this.formatTime(min), " : ").concat(this.formatTime(sec));
    }
  },
  watch: {
    totalTime: function totalTime(newValue) {
      this.percent = Math.floor(newValue / (this.minutes * this.seconds) * 100);
    }
  },
  mounted: function mounted() {
    this.reStart();
    this.onAuthState();
  }
}).mount('#app');
//# sourceMappingURL=all.js.map
