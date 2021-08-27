// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQv3-yDg_Fu6UVZYz9YWMbh3ka1m8NwiA",
  authDomain: "webtest2-c2d0c.firebaseapp.com",
  databaseURL: "https://webtest2-c2d0c-default-rtdb.firebaseio.com",
  projectId: "webtest2-c2d0c",
  storageBucket: "webtest2-c2d0c.appspot.com",
  messagingSenderId: "1003425564921",
  appId: "1:1003425564921:web:31710ac40e85a41bbbba28"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// firebase 資料庫
const db = firebase.database();

// Vue
const app = Vue.createApp({
  data() {
    return {
      toDoList: {},
      toDo: '',
      hasLogin: false,
      uid: '',
      nullKey: '',
    }
  },
  methods: {
    getData() {
      const vm = this;
      // 取得屬性值
      db.ref(`${vm.uid}`).on('value', (snapshot) => {
        vm.toDoList = snapshot.val() || {};
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
      })
      this.toDo = '';
    },
    deleteData(key) {
      db.ref(`${this.uid}`).child(key).remove();
    },
    deleteAll() {
      db.ref(`${this.uid}`).remove();
    },
    // google 登入
    provider() {
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
    // 登出
    signOut() {
      firebase.auth().signOut().then(() => {
        this.onAuthState();
        alert('已登出');
      })
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
      this.toDoList = [];
      this.uid = '';
    },
  },
  mounted() {
    this.onAuthState();
  },
}).mount('#app');