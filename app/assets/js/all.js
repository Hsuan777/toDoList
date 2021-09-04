// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1NqNVJuZyWRWTIn6JPFWDv3E7cPZdjws",
  authDomain: "to-do-list-21e2c.firebaseapp.com",
  databaseURL: "https://to-do-list-21e2c-default-rtdb.firebaseio.com",
  projectId: "to-do-list-21e2c",
  storageBucket: "to-do-list-21e2c.appspot.com",
  messagingSenderId: "174717852507",
  appId: "1:174717852507:web:305e301fdb95df65d0d87e"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// firebase 資料庫
const db = firebase.database();

// Vue
const app = Vue.createApp({
  data() {
    return {
      // toDoList
      toDoList: {},
      toDo: '',
      hasLogin: false,
      uid: '',
      totalTime: 0,
      // 番茄鐘
      seconds: 60,
      minutes : 25,
      countDown: null,
      started: false,
      percent: 0,
      // 拖曳元素
      targetSource: '',
      newIndex: '',
      oldIndex: ''
    }
  },
  methods: {
    /* toDoList */
    getData() {
      const vm = this;
      // 取得屬性值
      db.ref(`${vm.uid}`).on('value', (snapshot) => {
        vm.toDoList = [];
        Object.entries(snapshot.val() || {}).forEach((item, index) => {
          vm.toDoList.push(item[1]);
          vm.toDoList[index].order = index;
        })
        console.log(vm.toDoList);
      })
    },
    postData() {
      if (!this.toDo.trim()) {
        return;
      }
      // 取得推送亂數 ID
      const key = db.ref(`${this.uid}`).push().key;

      // 推送，在子層建立資料
      db.ref(`${this.uid}`).child(key).set({
        // 加入相同 key 值，方便刪除
        key: key,
        toDo: this.toDo,
        date: new Date().getTime(),
        order: this.toDoList.length + 1,
        checked: false,
      })
      this.toDo = '';
    },
    updateChecked(item) {
      let tempObj = item;
      tempObj.checked = !tempObj.checked;
      db.ref(`${this.uid}`).child(item.key).update(tempObj);
    },
    updateDataAll() {
      let tempObj = {};
      this.toDoList.forEach(item => {
        tempObj[item.key] = item;
      })
      db.ref(`${this.uid}`).update(tempObj);
      this.getData();
    },
    deleteData(key) {
      db.ref(`${this.uid}`).child(key).remove();
      this.updateDataAll();
    },
    deleteAll() {
      db.ref(`${this.uid}`).remove();
    },
    // google 登入
    googleLogin() {
      const provider = new firebase.auth.GoogleAuthProvider();
      const vm = this;
      firebase.auth().signInWithPopup(provider).then(function (result) {
        // 可以獲得 Google 提供 token，token可透過 Google API 獲得其他數據。
        // const credential = result.credential;
        // const token = result.credential.accessToken;
        // const user = result.user;
        vm.onAuthState();
      });
    },
    facebookLogin() {
      const provider = new firebase.auth.FacebookAuthProvider();
      const vm = this;
      provider.addScope('user_birthday');
      provider.setCustomParameters({
        'display': 'popup'
      }); 
      firebase.auth().signInWithPopup(provider).then(function(result) {
        // 取得FB Token，可以使用於FB API中
        // const token = result.credential.accessToken;
        // 使用者資料
        // const FBUser = result.user;
        vm.onAuthState();
      })
    },
    // 登出
    signOut() {
      firebase.auth().signOut().then(() => {
        this.onAuthState();
        alert('已登出');
      })
      this.reStart();
    },
    // 監聽登入狀態
    onAuthState() {
      const vm = this;
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          console.log("User is logined")
          vm.hasLogin = true;
          vm.uid = user.uid;
          vm.getData();
        } else {
          console.log("User is not logined yet.");
          vm.cleanData();
        }
      });
    },
    cleanData() {
      this.hasLogin = false;
      this.toDoList = {};
      this.uid = '';
    },
    /* 番茄鐘 */
    start() {
      this.started = true;
      this.countDown = setInterval(() => {
        this.totalTime -= 1;
        if (this.totalTime === 0) {
          clearInterval(this.countDown);
        }
      }, 1000);
    },
    stop() {
      this.started = false;
      clearInterval(this.countDown);
    },
    reStart() {
      this.started = false;
      this.totalTime = this.minutes * this.seconds;
      clearInterval(this.countDown);
    },
    /* 拖曳元素 */
    // 開始拖曳，指得是要被拖曳的物件
    dragStart(order, e) {
      this.oldOrder = order;
      this.targetSource = e.target;
      this.targetSource.classList.add('list-group--hover');
    },
    // 放至有效的目標容器
    dropped(e) {
      this.cancelDefault(e)
      if (e.target === this.targetSource) {
        return ;
      }
      e.target.classList.remove('list-group--hover');
    },
    // 拖曳結束，譬如放開滑鼠時，鍵盤 keyup 時
    dragEnd(e) {
      e.target.classList.remove('list-group--hover');
      this.changeData(this.oldOrder, this.newOrder);
    },
    // 進入目標容器
    dragEnter(e) {
      this.cancelDefault(e)
      // 狀態很快會變成"經過容器"
      // 當不是原本的目標容器時，變化 CSS 效果
      if (e.target !== this.targetSource && e.target.tagName === 'LI') {
        e.target.classList.add('list-group--hover', 'list-group--over')
      }
    },
    // 經過目標容器
    dragOver(order, e) {
      this.cancelDefault(e)
      this.newOrder = order;
      // 讓拖回原本的目標容器也會有 CSS 效果
      if (e.target === this.targetSource) {
        e.target.classList.add('list-group--hover')
      }
    },
    // 離開容器
    dragLeave(e) {
      this.cancelDefault(e)
      // e.target 指得是 li
      e.target.classList.remove('list-group--hover', 'list-group--over')
    },
    // 取消預設行為
    cancelDefault(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    changeData(oldOrder, newOrder) {
      let originToDo = this.toDoList[newOrder].toDo; 
      let originChecked = this.toDoList[newOrder].checked; 
      this.toDoList[newOrder].toDo = this.toDoList[oldOrder].toDo
      this.toDoList[newOrder].checked = this.toDoList[oldOrder].checked
      this.toDoList[oldOrder].toDo = originToDo;
      this.toDoList[oldOrder].checked = originChecked;
      this.updateDataAll();
    },
  },
  computed: {
    // 格式化剩餘時間
    timeLeft() {
      let min = Math.floor(this.totalTime / 60);
      let sec = this.totalTime % 60;
      const formatTime = (num) => {
        if (num < 10) {
          return '0' + num;
        } else {
          return num
        }
      }
      return `${formatTime(min)} : ${formatTime(sec)}`;
    },
  },
  watch: {
    totalTime(newValue) {
      this.percent = Math.floor(newValue / (this.minutes * this.seconds)*100);
    }
  },
  mounted() {
    this.reStart();
    this.onAuthState();
  },
}).mount('#app');