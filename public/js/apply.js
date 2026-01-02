const button = document.querySelector("#send-code");
const phoneInput = document.querySelector("#phone");
const feedback = document.querySelector("#sms-feedback");

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `sms-feedback${type ? " " + type : ""}`;
}

function startCountdown() {
  let remaining = 60;
  button.disabled = true;
  button.textContent = `已发送 ${remaining}s`;
  const timer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(timer);
      button.disabled = false;
      button.textContent = "获取验证码";
      return;
    }
    button.textContent = `已发送 ${remaining}s`;
  }, 1000);
}

async function sendCode() {
  const phone = phoneInput.value.trim();
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    setFeedback("请输入有效手机号。", "error");
    return;
  }
  setFeedback("正在发送验证码...", "");
  try {
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.message || "短信发送失败。", "error");
      return;
    }
    let message = "验证码已发送，请注意查收。";
    if (data.debugCode) {
      message = `验证码已发送（演示码：${data.debugCode}）。`;
    }
    setFeedback(message, "");
    startCountdown();
  } catch (error) {
    setFeedback("短信发送失败，请稍后重试。", "error");
  }
}

if (button) {
  button.addEventListener("click", sendCode);
}
