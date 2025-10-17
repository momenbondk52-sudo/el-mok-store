document.addEventListener('DOMContentLoaded', () => {
    // تحديد النماذج والأزرار
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleBtn = document.getElementById('google-signin-btn');

    // دالة للتعامل مع أخطاء Firebase وعرضها للمستخدم
    const handleAuthError = (error) => {
        console.error("Firebase Auth Error:", error.code, error.message);
        let userMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
        // تخصيص الرسائل لتكون أوضح للمستخدم
        if (error.code === 'auth/wrong-password') {
            userMessage = "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.";
        } else if (error.code === 'auth/user-not-found') {
            userMessage = "هذا البريد الإلكتروني غير مسجل. يمكنك إنشاء حساب جديد.";
        } else if (error.code === 'auth/email-already-in-use') {
            userMessage = "هذا البريد الإلكتروني مستخدم بالفعل. يمكنك تسجيل الدخول.";
        } else if (error.code === 'auth/weak-password') {
            userMessage = "كلمة المرور ضعيفة جدًا. يجب أن تكون 6 أحرف على الأقل.";
        } else if (error.code === 'auth/popup-closed-by-user') {
            userMessage = "تم إلغاء عملية تسجيل الدخول عبر جوجل.";
        } else if (error.code === 'auth/unauthorized-domain') {
            userMessage = "هذا النطاق غير مصرح له. يرجى التواصل مع الدعم الفني.";
        }
        alert(userMessage);
    };

    // 1. التعامل مع تسجيل الدخول بالبريد الإلكتروني
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    // التوجيه للصفحة الرئيسية بعد النجاح
                    window.location.href = 'index.html';
                })
                .catch(handleAuthError);
        });
    }

    // 2. التعامل مع إنشاء حساب جديد بالبريد الإلكتروني
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = signupForm['signup-name'].value;
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            const confirmPassword = signupForm['signup-confirm-password'].value;

            // التحقق من تطابق كلمتي المرور
            if (password !== confirmPassword) {
                alert("كلمتا المرور غير متطابقتين.");
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // بعد إنشاء المستخدم، قم بتحديث ملفه الشخصي بالاسم
                    const user = userCredential.user;
                    return user.updateProfile({
                        displayName: name
                    }).then(() => {
                        window.location.href = 'index.html';
                    });
                })
                .catch(handleAuthError);
        });
    }

    // 3. التعامل مع تسجيل الدخول/الإنشاء عبر جوجل
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then(() => {
                    // التوجيه للصفحة الرئيسية بعد النجاح
                    window.location.href = 'index.html';
                })
                .catch(handleAuthError);
        });
    }
});