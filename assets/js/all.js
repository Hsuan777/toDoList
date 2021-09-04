"use strict";

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyD1NqNVJuZyWRWTIn6JPFWDv3E7cPZdjws",
  authDomain: "to-do-list-21e2c.firebaseapp.com",
  databaseURL: "https://to-do-list-21e2c-default-rtdb.firebaseio.com",
  projectId: "to-do-list-21e2c",
  storageBucket: "to-do-list-21e2c.appspot.com",
  messagingSenderId: "174717852507",
  appId: "1:174717852507:web:305e301fdb95df65d0d87e"
}; // Initialize Firebase

firebase.initializeApp(firebaseConfig); // firebase 資料庫

var db = firebase.database(); // Vue

var app = Vue.createApp({
  data: function data() {
    return {
      // toDoList
      toDoList: {},
      toDo: '',
      hasLogin: false,
      uid: '',
      totalTime: 0,
      // 番茄鐘
      seconds: 60,
      minutes: 25,
      countDown: null,
      started: false,
      percent: 0,
      // 拖曳元素
      targetSource: '',
      newIndex: '',
      oldIndex: ''
    };
  },
  methods: {
    /* toDoList */
    getData: function getData() {
      var vm = this; // 取得屬性值

      db.ref("".concat(vm.uid)).on('value', function (snapshot) {
        vm.toDoList = [];
        Object.entries(snapshot.val() || {}).forEach(function (item, index) {
          vm.toDoList.push(item[1]);
          vm.toDoList[index].order = index;
        });
        console.log(vm.toDoList);
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
        date: new Date().getTime(),
        order: this.toDoList.length + 1,
        checked: false
      });
      this.toDo = '';
    },
    updateChecked: function updateChecked(item) {
      var tempObj = item;
      tempObj.checked = !tempObj.checked;
      db.ref("".concat(this.uid)).child(item.key).update(tempObj);
    },
    updateDataAll: function updateDataAll() {
      var tempObj = {};
      this.toDoList.forEach(function (item) {
        tempObj[item.key] = item;
      });
      db.ref("".concat(this.uid)).update(tempObj);
      this.getData();
    },
    deleteData: function deleteData(key) {
      db.ref("".concat(this.uid)).child(key).remove();
      this.updateDataAll();
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
        // const token = result.credential.accessToken;
        // 使用者資料
        // const FBUser = result.user;
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
      this.reStart();
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

    /* 番茄鐘 */
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

    /* 拖曳元素 */
    // 開始拖曳，指得是要被拖曳的物件
    dragStart: function dragStart(order, e) {
      this.oldOrder = order;
      this.targetSource = e.target;
      this.targetSource.classList.add('list-group--hover');
    },
    // 放至有效的目標容器
    dropped: function dropped(e) {
      this.cancelDefault(e);

      if (e.target === this.targetSource) {
        return;
      }

      e.target.classList.remove('list-group--hover');
    },
    // 拖曳結束，譬如放開滑鼠時，鍵盤 keyup 時
    dragEnd: function dragEnd(e) {
      e.target.classList.remove('list-group--hover');
      this.changeData(this.oldOrder, this.newOrder);
    },
    // 進入目標容器
    dragEnter: function dragEnter(e) {
      this.cancelDefault(e); // 狀態很快會變成"經過容器"
      // 當不是原本的目標容器時，變化 CSS 效果

      if (e.target !== this.targetSource && e.target.tagName === 'LI') {
        e.target.classList.add('list-group--hover', 'list-group--over');
      }
    },
    // 經過目標容器
    dragOver: function dragOver(order, e) {
      this.cancelDefault(e);
      this.newOrder = order; // 讓拖回原本的目標容器也會有 CSS 效果

      if (e.target === this.targetSource) {
        e.target.classList.add('list-group--hover');
      }
    },
    // 離開容器
    dragLeave: function dragLeave(e) {
      this.cancelDefault(e); // e.target 指得是 li

      e.target.classList.remove('list-group--hover', 'list-group--over');
    },
    // 取消預設行為
    cancelDefault: function cancelDefault(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    changeData: function changeData(oldOrder, newOrder) {
      var originToDo = this.toDoList[newOrder].toDo;
      var originChecked = this.toDoList[newOrder].checked;
      this.toDoList[newOrder].toDo = this.toDoList[oldOrder].toDo;
      this.toDoList[newOrder].checked = this.toDoList[oldOrder].checked;
      this.toDoList[oldOrder].toDo = originToDo;
      this.toDoList[oldOrder].checked = originChecked;
      this.updateDataAll();
    }
  },
  computed: {
    // 格式化剩餘時間
    timeLeft: function timeLeft() {
      var min = Math.floor(this.totalTime / 60);
      var sec = this.totalTime % 60;

      var formatTime = function formatTime(num) {
        if (num < 10) {
          return '0' + num;
        } else {
          return num;
        }
      };

      return "".concat(formatTime(min), " : ").concat(formatTime(sec));
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
