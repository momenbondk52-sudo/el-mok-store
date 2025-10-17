// ========================================================
//  ===> تم وضع بيانات Firebase الحقيقية الخاصة بك هنا <===
// ========================================================
const firebaseConfig = {
    apiKey: "AIzaSyBvIjRSQ4vsW3lSLxg70HefucbfmtJarlI",
    authDomain: "el-mok-store-13ff8.firebaseapp.com",
    projectId: "el-mok-store-13ff8",
    storageBucket: "el-mok-store-13ff8.appspot.com",
    messagingSenderId: "366978033733",
    appId: "1:366978033733:web:253797370a76d848075b2c",
    measurementId: "G-NNSH7XFNXX"
};


// ========================================================
// الكود التالي يقوم بتهيئة وتشغيل خدمات Firebase
// لا تقم بتعديل أي شيء أسفل هذا الخط
// ========================================================

// تهيئة تطبيق Firebase
const app = firebase.initializeApp(firebaseConfig);

// تهيئة خدمة المصادقة (لإنشاء الحسابات وتسجيل الدخول)
const auth = firebase.auth();

// تهيئة خدمة قاعدة البيانات (لتخزين السلة والمفضلة)
const db = firebase.firestore();

/**
 * دالة لجلب بيانات المستخدم (السلة والمفضلة) من قاعدة البيانات
 * @param {string} userId - المعرف الفريد للمستخدم
 * @returns {Promise<object>} - كائن يحتوي على بيانات المستخدم
 */
const getUserData = async (userId) => {
    try {
        const doc = await db.collection('users').doc(userId).get();
        return doc.exists ? doc.data() : { cart: [], favorites: [] };
    } catch (error) {
        console.error("Error getting user data:", error);
        return { cart: [], favorites: [] };
    }
};

/**
 * دالة لتحديث أو إنشاء بيانات المستخدم في قاعدة البيانات
 * @param {string} userId - المعرف الفريد للمستخدم
 * @param {object} data - البيانات الجديدة للحفظ (السلة والمفضلة)
 */
const updateUserData = (userId, data) => {
    return db.collection('users').doc(userId).set(data, { merge: true });
};