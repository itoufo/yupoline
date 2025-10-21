// グローバル変数
let liffInitialized = false;
let userProfile = null;

// DOM要素
const elements = {
    loading: document.getElementById('loading'),
    app: document.getElementById('app'),
    error: document.getElementById('error'),
    errorText: document.getElementById('error-text'),
    userProfile: document.getElementById('user-profile'),
    dataDisplay: document.getElementById('data-display'),
    btnGetProfile: document.getElementById('btn-get-profile'),
    btnSendMessage: document.getElementById('btn-send-message'),
    btnCloseLiff: document.getElementById('btn-close-liff')
};

// エラー表示
function showError(message) {
    elements.errorText.textContent = message;
    elements.error.style.display = 'block';
    elements.loading.style.display = 'none';
    console.error(message);
}

// ローディング表示
function showLoading(show = true) {
    elements.loading.style.display = show ? 'block' : 'none';
    elements.app.style.display = show ? 'none' : 'block';
}

// ユーザープロフィール表示
function displayUserProfile(profile) {
    const html = `
        <div class="profile-card">
            <img src="${profile.pictureUrl}" alt="${profile.displayName}" class="profile-image">
            <h3>${profile.displayName}</h3>
            ${profile.statusMessage ? `<p class="status-message">${profile.statusMessage}</p>` : ''}
            <p class="user-id">User ID: ${profile.userId}</p>
        </div>
    `;
    elements.userProfile.innerHTML = html;
}

// プロフィール取得
async function getProfile() {
    try {
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        showLoading(true);
        userProfile = await liff.getProfile();
        displayUserProfile(userProfile);

        // Supabaseにユーザーデータを保存
        await saveUserData(userProfile.userId, userProfile);
        await saveActivityLog(userProfile.userId, 'get_profile');

        // 保存されたデータを取得して表示
        const userData = await getUserData(userProfile.userId);
        elements.dataDisplay.innerHTML = `
            <h3>保存されたデータ</h3>
            <pre>${JSON.stringify(userData, null, 2)}</pre>
        `;

        showLoading(false);
    } catch (error) {
        showError('プロフィール取得エラー: ' + error.message);
    }
}

// メッセージ送信
async function sendMessage() {
    try {
        if (!liff.isInClient()) {
            alert('この機能はLINEアプリ内でのみ利用可能です');
            return;
        }

        await liff.sendMessages([
            {
                type: 'text',
                text: 'Yupoline からのメッセージです！'
            }
        ]);

        if (userProfile) {
            await saveActivityLog(userProfile.userId, 'send_message');
        }

        alert('メッセージを送信しました');
    } catch (error) {
        showError('メッセージ送信エラー: ' + error.message);
    }
}

// LIFFを閉じる
function closeLiff() {
    if (liff.isInClient()) {
        liff.closeWindow();
    } else {
        alert('LIFFブラウザではないため閉じることができません');
    }
}

// LIFF初期化
async function initializeLiff() {
    try {
        showLoading(true);

        // 設定の検証
        if (!validateConfig()) {
            showError('環境変数が正しく設定されていません。README.mdを確認してください。');
            return;
        }

        // Supabase初期化
        initSupabase();

        // LIFF初期化
        await liff.init({ liffId: CONFIG.LIFF_ID });
        liffInitialized = true;
        console.log('LIFF initialized successfully');

        // ログイン状態確認
        if (liff.isLoggedIn()) {
            userProfile = await liff.getProfile();
            displayUserProfile(userProfile);

            // 初回アクセスログ
            await saveActivityLog(userProfile.userId, 'app_open');
        } else {
            elements.userProfile.innerHTML = '<p>ログインしてください</p>';
        }

        showLoading(false);
    } catch (error) {
        showError('LIFF初期化エラー: ' + error.message);
    }
}

// イベントリスナー設定
function setupEventListeners() {
    elements.btnGetProfile.addEventListener('click', getProfile);
    elements.btnSendMessage.addEventListener('click', sendMessage);
    elements.btnCloseLiff.addEventListener('click', closeLiff);
}

// アプリ起動
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeLiff();
});
