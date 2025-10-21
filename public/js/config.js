// 環境変数設定
// 本番環境ではNetlifyの環境変数から取得
const CONFIG = {
    LIFF_ID: window.ENV?.LIFF_ID || 'YOUR_LIFF_ID_HERE',
    SUPABASE_URL: window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
    SUPABASE_ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'
};

// 設定の検証
function validateConfig() {
    const missingConfigs = [];

    if (CONFIG.LIFF_ID === 'YOUR_LIFF_ID_HERE') {
        missingConfigs.push('LIFF_ID');
    }
    if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
        missingConfigs.push('SUPABASE_URL');
    }
    if (CONFIG.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
        missingConfigs.push('SUPABASE_ANON_KEY');
    }

    if (missingConfigs.length > 0) {
        console.warn('以下の設定が未設定です:', missingConfigs.join(', '));
        return false;
    }

    return true;
}
